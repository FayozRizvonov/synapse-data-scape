"""
Authentication and tenant scoping for the CLAIRE API.

Until now every endpoint was open: the only scoping was a caller-supplied
`project_id`, and the frontend's `Authorization` header carried a build-time
constant that was never set.  This module turns a bearer token into a
`Principal` and enforces that the principal may act on a given project.

Tenancy chain
-------------
    JWT.sub  -> company_members.user_id -> company_id
    project  -> brands.id               -> brands.company_id

A request is authorised when those two company_ids intersect.  `project_id`
is a `brands.id` — brands are the company-owned entity an MMM project belongs
to.

Token verification
------------------
Supabase signs user tokens with HS256 using the project JWT secret.

* `SUPABASE_JWT_SECRET` set  — verified locally, no network call (preferred).
* otherwise                  — introspected against `/auth/v1/user`, which is
                               correct but adds a round trip per request.

The service-role key is also accepted as a bearer token for server-to-server
callers.  It is a server-side secret and must never reach a browser.

Everything here is deliberately fail-closed: any verification error is a 401,
and an unmapped project is a 403.  There is no bypass flag — an auth switch is
exactly the kind of thing that ships enabled by accident.
"""
from __future__ import annotations

import logging
import os
import time
from dataclasses import dataclass, field
from typing import Optional, Set

import httpx
import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)

# project_id -> (company_id, cached_at); brands rarely move between companies.
_project_company_cache: dict[str, tuple[Optional[str], float]] = {}
_CACHE_TTL_SECONDS = 300


@dataclass
class Principal:
    """An authenticated caller."""
    user_id: str
    email: Optional[str] = None
    company_ids: Set[str] = field(default_factory=set)
    is_service: bool = False

    def __str__(self) -> str:  # for logs; never dump the whole token
        return f"service" if self.is_service else f"user:{self.user_id}"


def _env(name: str) -> str:
    return (os.environ.get(name) or "").strip()


def _decode_local(token: str) -> Optional[dict]:
    """Verify with the project JWT secret, if one is configured."""
    secret = _env("SUPABASE_JWT_SECRET")
    if not secret:
        return None
    try:
        return jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": False},  # Supabase sets aud=authenticated
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")


def _introspect(token: str) -> dict:
    """Ask Supabase to validate the token when no local secret is available."""
    url, anon = _env("SUPABASE_URL"), _env("SUPABASE_ANON_KEY")
    if not url or not anon:
        raise HTTPException(
            status_code=503,
            detail="Auth not configured: set SUPABASE_JWT_SECRET, or SUPABASE_URL + SUPABASE_ANON_KEY",
        )
    try:
        res = httpx.get(
            f"{url}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": anon},
            timeout=5.0,
        )
    except httpx.HTTPError as exc:
        logger.warning(f"auth introspection failed: {exc}")
        raise HTTPException(status_code=503, detail="Auth provider unreachable")

    if res.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return res.json()


def _company_ids_for_user(user_id: str) -> Set[str]:
    """Active company memberships for a user."""
    try:
        from supabase_client import supabase_mmm_client as _sb  # type: ignore
        res = (
            _sb.client
            .from_("company_members")
            .select("company_id, status")
            .eq("user_id", user_id)
            .execute()
        )
    except Exception as exc:
        logger.warning(f"company lookup failed for {user_id}: {exc}")
        raise HTTPException(status_code=503, detail="Could not resolve tenant membership")

    out: Set[str] = set()
    for row in res.data or []:
        status = str(row.get("status") or "").lower()
        # Only active members carry access; invited/suspended must not.
        if status and status not in ("active", "accepted"):
            continue
        if row.get("company_id"):
            out.add(str(row["company_id"]))
    return out


def _company_for_project(project_id: str) -> Optional[str]:
    """Owning company of a project, i.e. brands.company_id."""
    now = time.time()
    hit = _project_company_cache.get(project_id)
    if hit and now - hit[1] < _CACHE_TTL_SECONDS:
        return hit[0]

    try:
        from supabase_client import supabase_mmm_client as _sb  # type: ignore
        res = (
            _sb.client
            .from_("brands")
            .select("id, company_id")
            .eq("id", project_id)
            .limit(1)
            .execute()
        )
        rows = res.data or []
        company_id = str(rows[0]["company_id"]) if rows and rows[0].get("company_id") else None
    except Exception as exc:
        logger.warning(f"project lookup failed for {project_id}: {exc}")
        raise HTTPException(status_code=503, detail="Could not resolve project owner")

    _project_company_cache[project_id] = (company_id, now)
    return company_id


async def get_principal(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Principal:
    """FastAPI dependency: require a valid bearer token."""
    if creds is None or not creds.credentials:
        raise HTTPException(
            status_code=401,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = creds.credentials.strip()

    # Server-to-server: the service-role key acts on behalf of the platform.
    service_key = _env("SUPABASE_SERVICE_ROLE_KEY")
    if service_key and token == service_key:
        logger.info(f"{request.method} {request.url.path} authenticated as service role")
        return Principal(user_id="service-role", is_service=True)

    claims = _decode_local(token) or _introspect(token)

    user_id = claims.get("sub") or claims.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token carries no subject")

    return Principal(
        user_id=str(user_id),
        email=claims.get("email"),
        company_ids=_company_ids_for_user(str(user_id)),
    )


def authorize_project(principal: Principal, project_id: str) -> None:
    """
    Assert the principal may act on this project, else raise 403/404.

    An unknown project is reported as 404 rather than 403 so the endpoint does
    not confirm the existence of ids belonging to other tenants.
    """
    if principal.is_service:
        return

    owner = _company_for_project(project_id)
    if owner is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Project {project_id} not found. project_id must be a brand id "
                "(brands.id) owned by a company."
            ),
        )

    if owner not in principal.company_ids:
        logger.warning(
            f"tenant denial: {principal} company_ids={sorted(principal.company_ids)} "
            f"attempted project {project_id} owned by {owner}"
        )
        raise HTTPException(status_code=403, detail="Project belongs to another organisation")

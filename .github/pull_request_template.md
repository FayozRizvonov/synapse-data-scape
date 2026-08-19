## What changed

<!-- One or two sentences. What does this do, and why? -->

## Tested on preview

**Rule: if it isn't tested on the preview URL, it doesn't go to main.**

- Preview URL: <!-- paste the Vercel preview link for this branch -->
- [ ] App loads without console errors
- [ ] Login works
- [ ] The flow this PR touches works end to end
- [ ] Checked at least one failure path (bad input, unauthorised, empty state)

## Risk

- [ ] Database migration included — applied and verified
- [ ] Auth / tenancy touched — cross-tenant access re-checked
- [ ] Environment variable added or changed — set in Vercel **and** locally
- [ ] Breaking API change — frontend updated in the same PR

## Rollback

<!-- If this breaks production, what is the fastest way back?
     Usually: Vercel > Deployments > previous good deploy > Instant Rollback.
     Note here if anything else is needed (e.g. a migration to reverse). -->

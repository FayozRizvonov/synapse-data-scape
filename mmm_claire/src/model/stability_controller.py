def evaluate_stability(diag):
    """
    Decide if model is stable.
    """

    if not diag["passed"]:
        return False

    if diag["max_rhat"] > 1.05:
        return False

    if diag["min_ess"] < 200:
        return False

    if diag.get("tree_depth_hit", False):
        return False

    return True
def get_prior_config(level):
    """
    Return prior multipliers for a given stability level.
    """

    if level == 0:
        return {
            "beta_scale": 1.0,
            "theta_cap": 0.95,
            "gamma_cap": 5.0,
            "fix_alpha": False,
        }

    if level == 1:
        return {
            "beta_scale": 0.8,
            "theta_cap": 0.90,
            "gamma_cap": 4.0,
            "fix_alpha": False,
        }

    if level == 2:
        return {
            "beta_scale": 0.6,
            "theta_cap": 0.85,
            "gamma_cap": 3.0,
            "fix_alpha": False,
        }

    if level == 3:
        return {
            "beta_scale": 0.5,
            "theta_cap": 0.80,
            "gamma_cap": 2.5,
            "fix_alpha": True,
        }

    raise ValueError("Invalid stability level")

def run_stable_model(bundle, debug_mode=True, max_levels=4):
    """
    Try model with increasing prior tightening.
    For each stability level, escalate draws before tightening priors.

    Returns:
        trace
        diagnostics dict
        prediction diagnostics dict
        stability level used
    """

    from src.model.pymc_mmm import build_pymc_model
    from src.model.sample_model import sample_model
    from src.model.diagnostics import (
        run_diagnostics,
        run_prediction_diagnostics,
    )
    from src.logger import get_logger

    logger = get_logger("STABILITY")

    # -------------------------------------------------
    # Draw escalation ladder (fixed policy)
    # -------------------------------------------------
    DRAW_LADDER = [
        (1000, 1000),
        (2000, 2000),
        (3000, 3000),
    ]

    if debug_mode:
        DRAW_LADDER = [(500, 500)]  # keep debug lightweight

    for level in range(max_levels):

        prior_config = get_prior_config(level)
        logger.info(f"\n=== Trying Stability Level {level} ===")

        # -------------------------------------------------
        # Build model once per stability level
        # -------------------------------------------------
        try:
            model = build_pymc_model(bundle, prior_config)
        except Exception:
            logger.exception("Model build failed")
            continue

        # -------------------------------------------------
        # Escalate draws before tightening priors
        # -------------------------------------------------
        for draw_attempt, (draws, tune) in enumerate(DRAW_LADDER):

            logger.info(
                f"Sampling attempt {draw_attempt+1} | "
                f"draws={draws}, tune={tune}"
            )

            try:
                trace = sample_model(
                    model,
                    draws=draws,
                    tune=tune,
                    chains=4,
                    target_accept=0.95,
                )

                diag = run_diagnostics(trace)
                pred_diag = run_prediction_diagnostics(trace, bundle)

            except Exception:
                logger.exception("Sampling crashed during escalation")
                break

            # ---------------------------------------------
            # Stability Check
            # ---------------------------------------------
            if evaluate_stability(diag):
                logger.info(
                    f"Model stable at Level {level} "
                    f"with draws={draws}"
                )
                return trace, diag, pred_diag, level

            # ---------------------------------------------
            # Log WHY unstable
            # ---------------------------------------------
            logger.warning(
                f"Unstable at draws={draws} | "
                f"max_rhat={diag.get('max_rhat')} | "
                f"min_ess={diag.get('min_ess')} | "
                f"tree_depth_hit={diag.get('tree_depth_hit')}"
            )

            # If tree depth issue → no need to increase draws
            if diag.get("tree_depth_hit", False):
                logger.warning(
                    "Tree depth hit detected. "
                    "Escalating priors instead of draws."
                )
                break

        # -------------------------------------------------
        # If all draw attempts failed → tighten priors
        # -------------------------------------------------
        logger.warning(
            f"Level {level} unstable after draw escalation. "
            "Tightening priors."
        )

    logger.error("All stability levels failed. MODEL REJECTED.")
    raise RuntimeError("All stability levels failed.")

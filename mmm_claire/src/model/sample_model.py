import multiprocessing
import os

import pymc as pm
import arviz as az
from src.logger import get_logger

logger = get_logger(__name__)


def _usable_cores(chains: int) -> int:
    """
    How many processes pm.sample may fork.

    Celery's default prefork pool runs tasks in *daemonic* processes, and a
    daemonic process is not allowed to have children — so asking PyMC for
    parallel chains there dies with:
        AssertionError: daemonic processes are not allowed to have children
    Detect that case and sample the chains sequentially instead.

    Override explicitly with MMM_SAMPLE_CORES if needed.
    """
    override = os.environ.get("MMM_SAMPLE_CORES")
    if override:
        try:
            return max(1, min(int(override), chains))
        except ValueError:
            logger.warning(f"Ignoring non-integer MMM_SAMPLE_CORES={override!r}")

    if multiprocessing.current_process().daemon:
        logger.warning(
            "Running inside a daemonic process (e.g. Celery prefork pool) — "
            "falling back to cores=1 (chains run sequentially). Launch the "
            "worker with --pool=solo or --pool=threads for parallel chains."
        )
        return 1
    return chains


def sample_model(
    model: pm.Model,
    draws: int = 1000,
    tune: int = 1000,
    chains: int = 4,
    target_accept: float = 0.97,
    random_seed: int = 42,
):
    """
    Run NUTS sampling for MMM model.

    Returns
    -------
    arviz.InferenceData
    """

    cores = _usable_cores(chains)

    logger.info(
        f"Starting sampling | draws={draws}, tune={tune}, "
        f"chains={chains}, cores={cores}, target_accept={target_accept}"
    )

    with model:
        trace = pm.sample(
            draws=draws,
            tune=tune,
            chains=chains,
            cores=cores,
            target_accept=target_accept,
            random_seed=random_seed,
            return_inferencedata=True,
            progressbar=True,
        )

    logger.info("Sampling completed successfully")
    return trace

import pymc as pm
import arviz as az
from src.logger import get_logger

logger = get_logger(__name__)


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

    logger.info(
        f"Starting sampling | draws={draws}, tune={tune}, "
        f"chains={chains}, target_accept={target_accept}"
    )

    with model:
        trace = pm.sample(
            draws=draws,
            tune=tune,
            chains=chains,
            cores=chains,   # 🔥 THIS LINE
            target_accept=target_accept,
            random_seed=random_seed,
            return_inferencedata=True,
            progressbar=True,
        )

    logger.info("Sampling completed successfully")
    return trace

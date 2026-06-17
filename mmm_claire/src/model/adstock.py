import pymc as pm
import pytensor
import pytensor.tensor as pt


def geometric_adstock(x, theta):
    """
    Geometric adstock implemented inside PyMC graph.

    Parameters
    ----------
    x : tensor (T, G, SB, C)
        Raw media tensor
    theta : tensor (C,)
        Adstock decay per media channel, in (0, 1)

    Returns
    -------
    tensor (T, G, SB, C)
        Adstocked media tensor
    """

    def step(curr_x, prev_adstock, theta):
        return curr_x + prev_adstock * theta

    adstocked, _ = pytensor.scan(
        fn=step,
        sequences=[x],
        outputs_info=pt.zeros_like(x[0]),
        non_sequences=[theta]
    )

    return adstocked

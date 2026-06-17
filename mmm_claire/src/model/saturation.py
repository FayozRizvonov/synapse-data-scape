import pytensor.tensor as pt


def hill_saturation(x, alpha, gamma):
    """
    Hill saturation function.

    Parameters
    ----------
    x : tensor (T, G, SB, C)
        Adstocked media
    alpha : tensor (C,)
        Half-saturation parameter (>0)
    gamma : tensor (C,)
        Shape parameter (>0)

    Returns
    -------
    tensor (T, G, SB, C)
        Saturated media
    """

    # Ensure numerical stability
    x_safe = pt.maximum(x, 1e-8)

    numerator = pt.power(x_safe, gamma)
    denominator = pt.power(alpha, gamma) + numerator

    return numerator / denominator

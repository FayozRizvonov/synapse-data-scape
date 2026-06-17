import numpy as np


def geometric_adstock_np(x, theta):
    """
    NumPy geometric adstock.

    x     : (T, G, SB, C)
    theta : (C,) or (draws, C)

    Returns
    -------
    adstocked x with same shape as x
    """
    T = x.shape[0]
    out = np.zeros_like(x)

    out[0] = x[0]

    for t in range(1, T):
        out[t] = x[t] + theta * out[t - 1]

    return out


def hill_saturation_np(x, alpha, gamma, eps=1e-8):
    """
    NumPy Hill saturation.

    x     : (..., C)
    alpha : (C,) or (draws, C)
    gamma : (C,) or (draws, C)
    """
    x_safe = np.maximum(x, eps)
    return (x_safe ** gamma) / (alpha ** gamma + x_safe ** gamma)

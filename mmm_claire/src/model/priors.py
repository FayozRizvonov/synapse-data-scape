FUNNEL_PRIORS = {
    "upper": {
        "beta_mu": 0.0,
        "beta_sigma": .8,

        "theta_alpha": 4,
        "theta_beta": 1,

        "sat_alpha_mu": 0.6,
        "sat_alpha_sigma": 0.4,
        "sat_gamma_sigma": 0.8,
    },

    "mid": {
        "beta_mu": -0.5,
        "beta_sigma": .6,

        "theta_alpha": 2,
        "theta_beta": 2,

        "sat_alpha_mu": 0.0,
        "sat_alpha_sigma": 0.4,
        "sat_gamma_sigma": 1.2,
    },

    "lower": {
        "beta_mu": -1.5,
        "beta_sigma": 0.5,

        "theta_alpha": 2,
        "theta_beta": 5,

        "sat_alpha_mu": -0.6,
        "sat_alpha_sigma": 0.4,
        "sat_gamma_sigma": 1.8,
    },
}

import numpy as np
import pandas as pd
from typing import Tuple

FEATURE_COLUMNS = [
    "trade_frequency_1m",
    "order_to_trade_ratio",
    "cancellation_rate",
    "price_deviation_pct",
    "volume_surge_ratio",
    "reciprocal_trade_ratio",
    "avg_order_duration_sec",
    "account_turnover_ratio",
]

def generate_synthetic_trading_dataset(
    n_samples: int = 4000,
    random_seed: int = 42
) -> pd.DataFrame:
    """
    Generates a reproducible synthetic dataset containing normal trades
    and simulated market manipulation patterns:
    - Normal (approx 80%)
    - Simulated Wash Trading (approx 8%)
    - Simulated Spoofing (approx 7%)
    - Simulated Pump and Dump (approx 5%)
    """
    np.random.seed(random_seed)
    n_normal = int(n_samples * 0.80)
    n_wash = int(n_samples * 0.08)
    n_spoof = int(n_samples * 0.07)
    n_pump = n_samples - (n_normal + n_wash + n_spoof)

    # 1. Normal Trading Patterns
    normal_data = {
        "trade_frequency_1m": np.random.gamma(shape=1.5, scale=1.0, size=n_normal),
        "order_to_trade_ratio": np.clip(np.random.normal(loc=2.2, scale=0.6, size=n_normal), 1.0, 5.0),
        "cancellation_rate": np.clip(np.random.beta(a=2, b=12, size=n_normal), 0.01, 0.35),
        "price_deviation_pct": np.random.normal(loc=0.0, scale=0.8, size=n_normal),
        "volume_surge_ratio": np.clip(np.random.lognormal(mean=0.0, sigma=0.3, size=n_normal), 0.3, 2.0),
        "reciprocal_trade_ratio": np.clip(np.random.beta(a=1, b=20, size=n_normal), 0.0, 0.15),
        "avg_order_duration_sec": np.clip(np.random.exponential(scale=65.0, size=n_normal) + 10.0, 5.0, 300.0),
        "account_turnover_ratio": np.clip(np.random.gamma(shape=1.2, scale=0.5, size=n_normal), 0.1, 2.0),
        "label": 0,
        "pattern_name": "NORMAL",
    }

    # 2. Simulated Wash Trading (Reciprocal collusion, rapid back-and-forth)
    wash_data = {
        "trade_frequency_1m": np.clip(np.random.normal(loc=12.0, scale=3.5, size=n_wash), 5.0, 30.0),
        "order_to_trade_ratio": np.clip(np.random.normal(loc=1.1, scale=0.1, size=n_wash), 1.0, 1.4),
        "cancellation_rate": np.clip(np.random.beta(a=1, b=25, size=n_wash), 0.0, 0.10),
        "price_deviation_pct": np.random.normal(loc=0.05, scale=0.2, size=n_wash),
        "volume_surge_ratio": np.clip(np.random.normal(loc=3.2, scale=0.8, size=n_wash), 1.8, 6.0),
        "reciprocal_trade_ratio": np.clip(np.random.beta(a=25, b=2, size=n_wash), 0.70, 0.99),
        "avg_order_duration_sec": np.clip(np.random.exponential(scale=3.0, size=n_wash) + 1.0, 0.5, 8.0),
        "account_turnover_ratio": np.clip(np.random.normal(loc=4.5, scale=1.2, size=n_wash), 2.0, 9.0),
        "label": 1,
        "pattern_name": "SIMULATED_WASH_TRADING",
    }

    # 3. Simulated Spoofing (Aggressive phantom orders, massive cancellation rates, ultra short lifespan)
    spoof_data = {
        "trade_frequency_1m": np.clip(np.random.normal(loc=3.0, scale=1.2, size=n_spoof), 1.0, 8.0),
        "order_to_trade_ratio": np.clip(np.random.normal(loc=14.0, scale=3.5, size=n_spoof), 8.0, 35.0),
        "cancellation_rate": np.clip(np.random.beta(a=25, b=2, size=n_spoof), 0.75, 0.99),
        "price_deviation_pct": np.random.normal(loc=-0.4, scale=1.2, size=n_spoof),
        "volume_surge_ratio": np.clip(np.random.normal(loc=4.5, scale=1.5, size=n_spoof), 2.0, 9.0),
        "reciprocal_trade_ratio": np.clip(np.random.beta(a=2, b=15, size=n_spoof), 0.0, 0.25),
        "avg_order_duration_sec": np.clip(np.random.exponential(scale=1.8, size=n_spoof) + 0.4, 0.2, 4.0),
        "account_turnover_ratio": np.clip(np.random.normal(loc=1.8, scale=0.6, size=n_spoof), 0.5, 4.0),
        "label": 1,
        "pattern_name": "SIMULATED_SPOOFING",
    }

    # 4. Simulated Pump and Dump (Extreme volume surge + massive price spike)
    pump_data = {
        "trade_frequency_1m": np.clip(np.random.normal(loc=18.0, scale=4.0, size=n_pump), 8.0, 35.0),
        "order_to_trade_ratio": np.clip(np.random.normal(loc=3.5, scale=0.9, size=n_pump), 1.5, 6.0),
        "cancellation_rate": np.clip(np.random.beta(a=4, b=10, size=n_pump), 0.1, 0.45),
        "price_deviation_pct": np.clip(np.random.normal(loc=11.5, scale=4.0, size=n_pump), 4.5, 25.0),
        "volume_surge_ratio": np.clip(np.random.lognormal(mean=1.8, sigma=0.5, size=n_pump), 4.0, 18.0),
        "reciprocal_trade_ratio": np.clip(np.random.beta(a=3, b=10, size=n_pump), 0.1, 0.45),
        "avg_order_duration_sec": np.clip(np.random.exponential(scale=12.0, size=n_pump) + 2.0, 1.0, 40.0),
        "account_turnover_ratio": np.clip(np.random.normal(loc=6.5, scale=2.0, size=n_pump), 3.0, 15.0),
        "label": 1,
        "pattern_name": "SIMULATED_PUMP_DUMP",
    }

    df_normal = pd.DataFrame(normal_data)
    df_wash = pd.DataFrame(wash_data)
    df_spoof = pd.DataFrame(spoof_data)
    df_pump = pd.DataFrame(pump_data)

    df_combined = pd.concat([df_normal, df_wash, df_spoof, df_pump], ignore_index=True)
    df_shuffled = df_combined.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)
    return df_shuffled

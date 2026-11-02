import numpy as np
import pandas as pd
from typing import List, Dict, Any
from .schemas import FeatureExplanation, TradeFeatureVector
from .generator import FEATURE_COLUMNS

# Reference baseline averages for normal trading behavior
FEATURE_BENCHMARKS = {
    "trade_frequency_1m": {"mean": 1.5, "std": 1.0, "high_threshold": 4.0, "label": "Trade Frequency (1m)"},
    "order_to_trade_ratio": {"mean": 2.2, "std": 0.6, "high_threshold": 5.0, "label": "Order-to-Trade Ratio"},
    "cancellation_rate": {"mean": 0.14, "std": 0.08, "high_threshold": 0.40, "label": "Order Cancellation Rate"},
    "price_deviation_pct": {"mean": 0.0, "std": 0.8, "high_threshold": 3.0, "label": "Price Deviation from SMA (%)"},
    "volume_surge_ratio": {"mean": 1.05, "std": 0.35, "high_threshold": 2.5, "label": "Volume Surge Ratio"},
    "reciprocal_trade_ratio": {"mean": 0.05, "std": 0.04, "high_threshold": 0.25, "label": "Reciprocal Counterparty Ratio"},
    "avg_order_duration_sec": {"mean": 75.0, "std": 45.0, "low_threshold": 6.0, "label": "Avg Order Duration (sec)"},
    "account_turnover_ratio": {"mean": 0.60, "std": 0.40, "high_threshold": 2.2, "label": "Account Turnover Ratio"},
}

def vector_to_dataframe(vector: TradeFeatureVector) -> pd.DataFrame:
    """Converts a TradeFeatureVector schema into a pandas DataFrame."""
    data = {col: [getattr(vector, col)] for col in FEATURE_COLUMNS}
    return pd.DataFrame(data)

def generate_feature_explanations(
    vector: TradeFeatureVector,
    feature_importances: Dict[str, float] = None
) -> List[FeatureExplanation]:
    """
    Computes approximate feature contributions based on deviation from normal baseline
    and model feature weighting.
    NOTE: These are approximate feature-based indicators, not definitive causal claims.
    """
    explanations = []

    for col in FEATURE_COLUMNS:
        val = getattr(vector, col)
        bench = FEATURE_BENCHMARKS[col]
        z_score = (val - bench["mean"]) / max(bench["std"], 1e-4)

        weight = feature_importances.get(col, 1.0 / len(FEATURE_COLUMNS)) if feature_importances else 0.125
        impact = abs(z_score) * weight

        direction = "NORMAL"
        desc = f"{bench['label']} is within nominal operating range."

        if col == "reciprocal_trade_ratio" and val > bench.get("high_threshold", 0.25):
            direction = "ELEVATED"
            desc = f"Simulated wash-trading marker: {val*100:.1f}% of trades executed reciprocally with same counterparty."
        elif col == "cancellation_rate" and val > bench.get("high_threshold", 0.40):
            direction = "ELEVATED"
            desc = f"Simulated spoofing marker: {val*100:.1f}% of placed orders were cancelled rapidly before fulfillment."
        elif col == "price_deviation_pct" and abs(val) > bench.get("high_threshold", 3.0):
            direction = "ELEVATED" if val > 0 else "SUPPRESSED"
            desc = f"Simulated pump marker: Execution price deviated {val:+.2f}% from trailing moving average."
        elif col == "volume_surge_ratio" and val > bench.get("high_threshold", 2.5):
            direction = "ELEVATED"
            desc = f"Unusual volume spike: Trading volume is {val:.1f}x higher than baseline moving average."
        elif col == "avg_order_duration_sec" and val < bench.get("low_threshold", 6.0):
            direction = "ABNORMAL_LOW"
            desc = f"Ultra-fast order lifespan: Average order open duration was only {val:.2f}s before cancellation/fill."
        elif col == "order_to_trade_ratio" and val > bench.get("high_threshold", 5.0):
            direction = "ELEVATED"
            desc = f"Order book flooding marker: {val:.1f} orders placed per executed trade."
        elif col == "trade_frequency_1m" and val > bench.get("high_threshold", 4.0):
            direction = "ELEVATED"
            desc = f"High frequency activity: Participant executed {val:.1f} trades in a 1-minute window."

        explanations.append(FeatureExplanation(
            feature_name=col,
            feature_value=float(val),
            impact_score=round(float(impact), 4),
            direction=direction,
            description=desc
        ))

    # Sort descending by impact score
    explanations.sort(key=lambda x: x.impact_score, reverse=True)
    return explanations

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class TradeFeatureVector(BaseModel):
    trade_id: Optional[str] = Field(default=None, description="Unique trade identifier")
    symbol: Optional[str] = Field(default="AAPL", description="Trading asset symbol")
    buyer_address: Optional[str] = Field(default=None, description="Buyer wallet address")
    seller_address: Optional[str] = Field(default=None, description="Seller wallet address")
    price: Optional[float] = Field(default=150.0, description="Execution price in simulated USD")
    quantity: Optional[float] = Field(default=10.0, description="Executed share quantity")
    timestamp: Optional[int] = Field(default=None, description="Trade execution timestamp")

    # Engineered numerical features used for AI inference
    trade_frequency_1m: float = Field(..., ge=0, description="Number of trades executed by participant in 1m window")
    order_to_trade_ratio: float = Field(..., ge=0, description="Ratio of orders submitted to trades executed")
    cancellation_rate: float = Field(..., ge=0, le=1.0, description="Proportion of orders cancelled before execution")
    price_deviation_pct: float = Field(..., description="Percentage price deviation from 20-period moving average")
    volume_surge_ratio: float = Field(..., ge=0, description="Ratio of current volume to trailing average volume")
    reciprocal_trade_ratio: float = Field(..., ge=0, le=1.0, description="Fraction of trades between same counterparty pair")
    avg_order_duration_sec: float = Field(..., ge=0, description="Average order lifespan before execution or cancellation")
    account_turnover_ratio: float = Field(..., ge=0, description="Ratio of trading volume to estimated portfolio value")

class FeatureExplanation(BaseModel):
    feature_name: str
    feature_value: float
    impact_score: float
    direction: str  # e.g., "ELEVATED", "NORMAL", "ABNORMAL"
    description: str

class PredictionResult(BaseModel):
    trade_id: Optional[str]
    is_anomaly: bool
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Normalized risk anomaly score between 0 and 1")
    severity: str = Field(..., description="Risk tier: LOW, MEDIUM, HIGH, CRITICAL")
    predicted_pattern: str = Field(
        ...,
        description="Simulated pattern classification: NORMAL, SIMULATED_WASH_TRADING, SIMULATED_SPOOFING, SIMULATED_PUMP_DUMP"
    )
    model_identifier: str
    top_features: List[FeatureExplanation]
    disclaimer: str = "SIMULATION_ONLY: This prediction is generated from synthetic academic data and does not indicate real-world securities violations."

class BatchPredictionRequest(BaseModel):
    records: List[TradeFeatureVector]

class BatchPredictionResponse(BaseModel):
    total_processed: int
    anomalies_detected: int
    results: List[PredictionResult]

class ModelMetrics(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: Optional[float]
    confusion_matrix: List[List[int]]
    train_samples: int
    test_samples: int
    anomaly_rate: float
    class_names: List[str]
    feature_names: List[str]
    feature_importances: Dict[str, float]
    disclaimer: str

class ModelInfoResponse(BaseModel):
    primary_model: str
    supervised_model: str
    feature_names: List[str]
    trained_at: str
    training_samples: int
    dataset_summary: Dict[str, Any]
    status: str

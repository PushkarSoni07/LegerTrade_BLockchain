import os
from datetime import datetime, timezone
from typing import Dict, Any, List

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .schemas import (
    TradeFeatureVector,
    PredictionResult,
    BatchPredictionRequest,
    BatchPredictionResponse,
    ModelMetrics,
    ModelInfoResponse
)
from .models import pipeline

app = FastAPI(
    title="LedgerTrade AI Surveillance Microservice",
    description="Real-time simulated market surveillance and trade anomaly detection service.",
    version="1.0.0"
)

# Enable CORS for frontend and Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    print("[FastAPI] Initializing ML Surveillance service...")
    pipeline.load_models()
    print("[FastAPI] Models loaded and ready for inference.")

@app.get("/health", tags=["Health"])
def get_health() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "service": "LedgerTrade AI Surveillance Microservice",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "models_loaded": pipeline.is_loaded,
        "primary_model": "Isolation Forest",
        "supervised_model": "Random Forest",
    }

@app.post("/predict", response_model=PredictionResult, tags=["Inference"])
def predict_trade_anomaly(payload: TradeFeatureVector) -> PredictionResult:
    try:
        return pipeline.predict_single(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )

@app.post("/predict/batch", response_model=BatchPredictionResponse, tags=["Inference"])
def predict_batch(payload: BatchPredictionRequest) -> BatchPredictionResponse:
    if not payload.records:
        return BatchPredictionResponse(total_processed=0, anomalies_detected=0, results=[])

    results: List[PredictionResult] = []
    anomalies_count = 0

    for rec in payload.records:
        res = pipeline.predict_single(rec)
        if res.is_anomaly:
            anomalies_count += 1
        results.append(res)

    return BatchPredictionResponse(
        total_processed=len(results),
        anomalies_detected=anomalies_count,
        results=results
    )

@app.get("/model/metrics", tags=["Model Analytics"])
def get_model_metrics() -> Dict[str, Any]:
    if not pipeline.is_loaded:
        pipeline.load_models()
    return pipeline.metadata

@app.get("/model/info", response_model=ModelInfoResponse, tags=["Model Analytics"])
def get_model_info() -> ModelInfoResponse:
    if not pipeline.is_loaded:
        pipeline.load_models()

    meta = pipeline.metadata
    return ModelInfoResponse(
        primary_model="Isolation Forest (Unsupervised)",
        supervised_model="Random Forest Classifier (Multi-class)",
        feature_names=meta.get("feature_names", []),
        trained_at=meta.get("trained_at", "Unknown"),
        training_samples=meta.get("train_samples", 0),
        dataset_summary={
            "total_samples": meta.get("samples_total", 0),
            "test_samples": meta.get("test_samples", 0),
            "synthetic_anomaly_rate": meta.get("anomaly_rate_synthetic", 0.20),
        },
        status="ONLINE"
    )

@app.post("/retrain", tags=["Model Management"])
def retrain_models(samples: int = 5000) -> Dict[str, Any]:
    if samples < 1000 or samples > 20000:
        raise HTTPException(status_code=400, detail="Sample size must be between 1000 and 20000")
    meta = pipeline.train_and_persist(n_samples=samples)
    return {
        "message": "Models successfully retrained on synthetic dataset",
        "samples": samples,
        "metrics": meta
    }

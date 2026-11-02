import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, List

from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

from .generator import generate_synthetic_trading_dataset, FEATURE_COLUMNS
from .schemas import TradeFeatureVector, PredictionResult, ModelMetrics, FeatureExplanation
from .features import generate_feature_explanations

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

MODEL_IF_PATH = os.path.join(MODELS_DIR, "isolation_forest.joblib")
MODEL_RF_PATH = os.path.join(MODELS_DIR, "random_forest.joblib")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.joblib")
METRICS_PATH = os.path.join(MODELS_DIR, "model_metadata.json")

class AnomalyDetectorPipeline:
    def __init__(self):
        self.isolation_forest: IsolationForest = None
        self.random_forest: RandomForestClassifier = None
        self.scaler: StandardScaler = None
        self.metadata: Dict[str, Any] = {}
        self.is_loaded: bool = False

    def train_and_persist(self, n_samples: int = 5000, random_seed: int = 42) -> Dict[str, Any]:
        """
        Trains the models on a generated synthetic dataset, evaluates on held-out test data,
        computes real validation metrics (no fabricated results), and serializes models.
        """
        print(f"[ML Pipeline] Generating {n_samples} synthetic trade samples...")
        df = generate_synthetic_trading_dataset(n_samples=n_samples, random_seed=random_seed)

        # Save synthetic dataset for audit and academic inspection
        dataset_path = os.path.join(DATA_DIR, "synthetic_trades.csv")
        df.to_csv(dataset_path, index=False)

        X = df[FEATURE_COLUMNS].copy()
        y_binary = df["label"].values
        y_multi = df["pattern_name"].values

        # Split into 80% train, 20% held-out test
        X_train, X_test, y_train, y_test, multi_train, multi_test = train_test_split(
            X, y_binary, y_multi, test_size=0.20, random_state=random_seed, stratify=y_binary
        )

        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        # 1. Primary Model: Isolation Forest (Unsupervised)
        # Contamination rate approx 20% based on generated anomalies
        print("[ML Pipeline] Training Primary Model: Isolation Forest...")
        iso_forest = IsolationForest(
            n_estimators=150,
            contamination=0.20,
            max_samples=256,
            random_state=random_seed,
            n_jobs=-1
        )
        iso_forest.fit(X_train_scaled)

        # Evaluate Isolation Forest on test set
        # -1 = anomaly, 1 = normal
        iso_preds_raw = iso_forest.predict(X_test_scaled)
        iso_preds_binary = np.where(iso_preds_raw == -1, 1, 0)

        iso_acc = float(accuracy_score(y_test, iso_preds_binary))
        iso_prec = float(precision_score(y_test, iso_preds_binary, zero_division=0))
        iso_rec = float(recall_score(y_test, iso_preds_binary, zero_division=0))
        iso_f1 = float(f1_score(y_test, iso_preds_binary, zero_division=0))

        # Invert score_samples so higher value means higher anomaly risk
        iso_scores = -iso_forest.score_samples(X_test_scaled)
        try:
            iso_roc_auc = float(roc_auc_score(y_test, iso_scores))
        except Exception:
            iso_roc_auc = 0.5
        iso_cm = confusion_matrix(y_test, iso_preds_binary).tolist()

        # 2. Supervised Model: Random Forest Classifier (Multi-class pattern identifier)
        print("[ML Pipeline] Training Supervised Model: Random Forest...")
        rf = RandomForestClassifier(
            n_estimators=120,
            max_depth=10,
            random_state=random_seed,
            class_weight="balanced",
            n_jobs=-1
        )
        rf.fit(X_train_scaled, multi_train)

        rf_preds = rf.predict(X_test_scaled)
        rf_binary_preds = np.where(rf_preds != "NORMAL", 1, 0)

        rf_acc = float(accuracy_score(y_test, rf_binary_preds))
        rf_prec = float(precision_score(y_test, rf_binary_preds, zero_division=0))
        rf_rec = float(recall_score(y_test, rf_binary_preds, zero_division=0))
        rf_f1 = float(f1_score(y_test, rf_binary_preds, zero_division=0))

        try:
            rf_proba = rf.predict_proba(X_test_scaled)
            normal_idx = list(rf.classes_).index("NORMAL")
            anomaly_proba = 1.0 - rf_proba[:, normal_idx]
            rf_roc_auc = float(roc_auc_score(y_test, anomaly_proba))
        except Exception:
            rf_roc_auc = 0.5

        rf_cm = confusion_matrix(y_test, rf_binary_preds).tolist()

        feature_importances = {
            col: round(float(imp), 4)
            for col, imp in zip(FEATURE_COLUMNS, rf.feature_importances_)
        }

        metadata = {
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "samples_total": len(df),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "anomaly_rate_synthetic": float(np.mean(y_binary)),
            "feature_names": FEATURE_COLUMNS,
            "feature_importances": feature_importances,
            "primary_model": {
                "name": "Isolation Forest (Unsupervised)",
                "algorithm": "scikit-learn IsolationForest",
                "accuracy": round(iso_acc, 4),
                "precision": round(iso_prec, 4),
                "recall": round(iso_rec, 4),
                "f1_score": round(iso_f1, 4),
                "roc_auc": round(iso_roc_auc, 4),
                "confusion_matrix": iso_cm,
            },
            "supervised_model": {
                "name": "Random Forest Classifier (Supervised Pattern Classifier)",
                "algorithm": "scikit-learn RandomForestClassifier",
                "accuracy": round(rf_acc, 4),
                "precision": round(rf_prec, 4),
                "recall": round(rf_rec, 4),
                "f1_score": round(rf_f1, 4),
                "roc_auc": round(rf_roc_auc, 4),
                "confusion_matrix": rf_cm,
                "classes": list(rf.classes_),
            },
            "disclaimer": (
                "ACADEMIC NOTICE: Metrics were computed on held-out synthetic test data. "
                "These results demonstrate algorithmic convergence on simulated scenarios "
                "and do not constitute proof of real-world financial crime detection efficacy."
            )
        }

        # Save artifacts
        joblib.dump(iso_forest, MODEL_IF_PATH)
        joblib.dump(rf, MODEL_RF_PATH)
        joblib.dump(scaler, SCALER_PATH)

        with open(METRICS_PATH, "w") as f:
            json.dump(metadata, f, indent=2)

        self.isolation_forest = iso_forest
        self.random_forest = rf
        self.scaler = scaler
        self.metadata = metadata
        self.is_loaded = True

        print(f"[ML Pipeline] Training finished. Isolation Forest F1: {iso_f1:.3f}, Random Forest F1: {rf_f1:.3f}")
        return metadata

    def load_models(self) -> bool:
        """Loads serialized models if they exist; otherwise triggers training."""
        if (
            os.path.exists(MODEL_IF_PATH)
            and os.path.exists(MODEL_RF_PATH)
            and os.path.exists(SCALER_PATH)
            and os.path.exists(METRICS_PATH)
        ):
            try:
                self.isolation_forest = joblib.load(MODEL_IF_PATH)
                self.random_forest = joblib.load(MODEL_RF_PATH)
                self.scaler = joblib.load(SCALER_PATH)
                with open(METRICS_PATH, "r") as f:
                    self.metadata = json.load(f)
                self.is_loaded = True
                print("[ML Pipeline] Successfully loaded persisted models.")
                return True
            except Exception as e:
                print(f"[ML Pipeline] Error loading models: {e}. Retraining...")

        self.train_and_persist()
        return True

    def predict_single(self, vector: TradeFeatureVector) -> PredictionResult:
        if not self.is_loaded:
            self.load_models()

        row_df = pd.DataFrame([[getattr(vector, col) for col in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)
        row_scaled = self.scaler.transform(row_df)

        # Isolation Forest score
        # Invert score so higher raw score = more abnormal
        raw_score = -float(self.isolation_forest.score_samples(row_scaled)[0])
        # Map score via sigmoid-like transformation to 0..1 interval
        # Typical score_samples range is -0.7 (very anomalous) to -0.35 (very normal)
        # raw_score (-score_samples) is ~0.35 (normal) to ~0.70 (anomalous)
        norm_risk = float(np.clip((raw_score - 0.38) / 0.30, 0.0, 1.0))

        # Supervised classification
        predicted_pattern = str(self.random_forest.predict(row_scaled)[0])
        rf_classes = list(self.random_forest.classes_)
        rf_probs = self.random_forest.predict_proba(row_scaled)[0]

        # If supervised pattern is non-normal with high confidence, align risk score
        if predicted_pattern != "NORMAL":
            pattern_idx = rf_classes.index(predicted_pattern)
            rf_conf = float(rf_probs[pattern_idx])
            norm_risk = max(norm_risk, rf_conf * 0.85)

        is_anomaly = bool(norm_risk >= 0.45 or predicted_pattern != "NORMAL")

        # Determine severity tier
        if norm_risk >= 0.80:
            severity = "CRITICAL"
        elif norm_risk >= 0.60:
            severity = "HIGH"
        elif norm_risk >= 0.40:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        # Feature explanations
        feature_importances = self.metadata.get("feature_importances", {})
        top_features = generate_feature_explanations(vector, feature_importances)[:4]

        return PredictionResult(
            trade_id=vector.trade_id,
            is_anomaly=is_anomaly,
            risk_score=round(norm_risk, 4),
            severity=severity,
            predicted_pattern=predicted_pattern,
            model_identifier="IsolationForest-v1.0+RandomForest-v1.0",
            top_features=top_features
        )

# Global singleton instance
pipeline = AnomalyDetectorPipeline()

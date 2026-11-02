import os
import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.generator import generate_synthetic_trading_dataset, FEATURE_COLUMNS
from app.schemas import TradeFeatureVector
from app.models import pipeline

class TestMLSurveillanceService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Force model training for tests
        pipeline.train_and_persist(n_samples=2000, random_seed=42)
        cls.client = TestClient(app)

    def test_01_synthetic_dataset_generation(self):
        df = generate_synthetic_trading_dataset(n_samples=1000, random_seed=123)
        self.assertEqual(len(df), 1000)
        for col in FEATURE_COLUMNS:
            self.assertIn(col, df.columns)
        self.assertIn("label", df.columns)
        self.assertIn("pattern_name", df.columns)

        # Check that abnormal classes exist
        patterns = df["pattern_name"].unique()
        self.assertIn("NORMAL", patterns)
        self.assertIn("SIMULATED_WASH_TRADING", patterns)
        self.assertIn("SIMULATED_SPOOFING", patterns)
        self.assertIn("SIMULATED_PUMP_DUMP", patterns)

    def test_02_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["models_loaded"])

    def test_03_model_metrics_endpoint(self):
        response = self.client.get("/model/metrics")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("primary_model", data)
        self.assertIn("supervised_model", data)
        self.assertIn("f1_score", data["primary_model"])
        self.assertIn("confusion_matrix", data["primary_model"])
        self.assertIn("feature_importances", data)

    def test_04_normal_trade_prediction(self):
        normal_vec = {
            "trade_frequency_1m": 1.2,
            "order_to_trade_ratio": 2.1,
            "cancellation_rate": 0.12,
            "price_deviation_pct": 0.2,
            "volume_surge_ratio": 1.1,
            "reciprocal_trade_ratio": 0.04,
            "avg_order_duration_sec": 70.0,
            "account_turnover_ratio": 0.5
        }
        response = self.client.post("/predict", json=normal_vec)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["is_anomaly"])
        self.assertLess(data["risk_score"], 0.50)
        self.assertEqual(data["severity"], "LOW")

    def test_05_wash_trading_prediction(self):
        wash_vec = {
            "trade_frequency_1m": 16.0,
            "order_to_trade_ratio": 1.1,
            "cancellation_rate": 0.02,
            "price_deviation_pct": 0.05,
            "volume_surge_ratio": 3.5,
            "reciprocal_trade_ratio": 0.95,  # Very high reciprocal trading
            "avg_order_duration_sec": 2.0,
            "account_turnover_ratio": 5.0
        }
        response = self.client.post("/predict", json=wash_vec)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["is_anomaly"])
        self.assertGreaterEqual(data["risk_score"], 0.50)
        self.assertEqual(data["predicted_pattern"], "SIMULATED_WASH_TRADING")

    def test_06_spoofing_prediction(self):
        spoof_vec = {
            "trade_frequency_1m": 2.5,
            "order_to_trade_ratio": 18.0,     # Excessive order placement
            "cancellation_rate": 0.92,        # 92% cancellation rate
            "price_deviation_pct": -0.4,
            "volume_surge_ratio": 4.8,
            "reciprocal_trade_ratio": 0.05,
            "avg_order_duration_sec": 1.2,    # Orders pulled in 1.2s
            "account_turnover_ratio": 1.8
        }
        response = self.client.post("/predict", json=spoof_vec)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["is_anomaly"])
        self.assertGreaterEqual(data["risk_score"], 0.50)
        self.assertEqual(data["predicted_pattern"], "SIMULATED_SPOOFING")

    def test_07_pump_and_dump_prediction(self):
        pump_vec = {
            "trade_frequency_1m": 22.0,
            "order_to_trade_ratio": 3.8,
            "cancellation_rate": 0.25,
            "price_deviation_pct": 14.5,     # 14.5% price spike from SMA
            "volume_surge_ratio": 8.5,       # 8.5x volume surge
            "reciprocal_trade_ratio": 0.20,
            "avg_order_duration_sec": 15.0,
            "account_turnover_ratio": 8.0
        }
        response = self.client.post("/predict", json=pump_vec)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["is_anomaly"])
        self.assertGreaterEqual(data["risk_score"], 0.50)
        self.assertEqual(data["predicted_pattern"], "SIMULATED_PUMP_DUMP")

if __name__ == "__main__":
    unittest.main()

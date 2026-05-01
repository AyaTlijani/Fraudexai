from fastapi import WebSocket
import asyncio
import numpy as np

from app.preprocess import preprocess
from app.predict import Predictor


def build_stream(X, y, n_fraud=50, n_normal=200):

    np.random.seed(42)

    fraud_idx = np.where(y == 1)[0]
    normal_idx = np.where(y == 0)[0]

    fraud_sample = np.random.choice(fraud_idx, min(n_fraud, len(fraud_idx)), replace=False)
    normal_sample = np.random.choice(normal_idx, min(n_normal, len(normal_idx)), replace=False)

    idx = np.concatenate([fraud_sample, normal_sample])
    np.random.shuffle(idx)

    return X[idx], y[idx]


def label(pred):
    return "FRAUD" if pred == 1 else "OK"


# ======================================
# LOAD DATA ON START (RESET ON RESTART)
# ======================================
_, X_test, _, y_test = preprocess(use_smote=False)
X_stream, y_stream = build_stream(X_test, y_test)
predictor = Predictor()


# ======================================
# STREAM PER CONNECTION (NO GLOBAL STATE)
# ======================================
async def run_stream(websocket: WebSocket, delay=2.5):

    await websocket.accept()

    for i, (x, true_label) in enumerate(zip(X_stream, y_stream)):

        result = predictor.predict(x)

        data = {
            "tx_id": i + 1,
            "status": label(result["fraud"]),
            "risk": result["risk"],
            "score": result["fraud_probability"],
            "true": "FRAUD" if true_label == 1 else "OK"
        }

        await websocket.send_json(data)

        await asyncio.sleep(delay)

    await websocket.close()
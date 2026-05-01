import json
import numpy as np

from app.preprocess import preprocess
from app.predict import Predictor


# ==========================================
# BUILD DATASET
# ==========================================

def build_dataset(X, y, n_fraud=50, n_normal=200):

    fraud_idx = np.where(y == 1)[0]
    normal_idx = np.where(y == 0)[0]

    fraud_sample = np.random.choice(
        fraud_idx,
        min(n_fraud, len(fraud_idx)),
        replace=False
    )

    normal_sample = np.random.choice(
        normal_idx,
        min(n_normal, len(normal_idx)),
        replace=False
    )

    idx = np.concatenate([fraud_sample, normal_sample])

    np.random.shuffle(idx)

    return X[idx], y[idx]


# ==========================================
# LABELS
# ==========================================

def label(pred):
    return "FRAUD" if pred == 1 else "OK"


# ==========================================
# GENERATE HISTORY JSON
# ==========================================

def generate_history_json():

    _, X_test, _, y_test = preprocess(use_smote=False)

    X_data, y_data = build_dataset(X_test, y_test)

    predictor = Predictor()

    results = []

    for i, (x, true_label) in enumerate(zip(X_data, y_data)):

        result = predictor.predict(x)

        tx = {
            "tx_id": i + 1,
            "status": label(result["fraud"]),
            "risk": result["risk"],
            "score": float(result["fraud_probability"]),
            "true": "FRAUD" if true_label == 1 else "OK"
        }

        results.append(tx)

    # SAVE JSON FILE
    with open("history.json", "w") as f:
        json.dump(results, f, indent=2)

    print("✅ history.json generated successfully")


# ==========================================
# RUN
# ==========================================

if __name__ == "__main__":
    generate_history_json()
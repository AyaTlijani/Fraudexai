import json
import os
import numpy as np

from app.preprocess import preprocess
from app.predict import Predictor


# ==========================================
# BUILD DATASET (FIXED)
# ==========================================

def build_dataset(X, y, n_fraud=50, n_normal=200):

    # FIXED SEED → SAME 250 TRANSACTIONS EVERY RUN
    np.random.seed(42)

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
# GENERATE HISTORY + TRANSACTIONS
# ==========================================

def generate_history_json():

    _, X_test, _, y_test = preprocess(use_smote=False)

    # --------------------------------------
    # LOAD OR CREATE FIXED TRANSACTIONS
    # --------------------------------------

    if os.path.exists("transactions.json"):

        with open("transactions.json", "r") as f:
            data = json.load(f)

        X_data = np.array([t["features"] for t in data])
        y_data = np.array([
            1 if t["true"] == "FRAUD" else 0
            for t in data
        ])

    else:

        X_data, y_data = build_dataset(X_test, y_test)

        transactions = []

        for i, (x, true_label) in enumerate(zip(X_data, y_data)):

            transactions.append({
                "tx_id": i + 1,
                "features": x.tolist(),
                "true": "FRAUD" if true_label == 1 else "OK"
            })

        with open("transactions.json", "w") as f:
            json.dump(transactions, f, indent=2)

        print("✅ transactions.json created")

    # --------------------------------------
    # PREDICTIONS
    # --------------------------------------

    predictor = Predictor()

    results = []

    for i, (x, true_label) in enumerate(zip(X_data, y_data)):

        result = predictor.predict(x)

        results.append({
            "tx_id": i + 1,
            "status": label(result["fraud"]),
            "risk": result["risk"],
            "score": float(result["fraud_probability"]),
            "true": "FRAUD" if true_label == 1 else "OK"
        })

    # --------------------------------------
    # SAVE HISTORY (YOUR REQUIRED PATH)
    # --------------------------------------

    history_path = r"C:\Users\MSI\Downloads\AYA-TLIJANI\PROGET PI\backend\history.json"

    with open(history_path, "w") as f:
        json.dump(results, f, indent=2)

    print("✅ history.json generated successfully at:")
    print(history_path)


# ==========================================
# RUN
# ==========================================

if __name__ == "__main__":
    generate_history_json()
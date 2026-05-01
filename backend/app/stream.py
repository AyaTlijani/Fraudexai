import time
import numpy as np
import pandas as pd

from app.preprocess import preprocess
from app.predict import Predictor


# ====================================
# STREAM SAMPLER
# ====================================

def build_stream(X, y, n_fraud=50, n_normal=200):

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


# ====================================
# LABEL FORMATTER
# ====================================

def status_label(pred):
    return "🚨 FRAUD" if pred == 1 else "✅ OK"


# ====================================
# STREAM ENGINE
# ====================================

def run_stream(delay=1.0):

    print("\n🚀 FRAUD STREAM SYSTEM STARTED")
    print("=" * 60)

    _, X_test, _, y_test = preprocess(use_smote=False)

    X_stream, y_stream = build_stream(X_test, y_test)

    predictor = Predictor()

    total = 0
    fraud_found = 0
    missed_fraud = 0

    logs = []

    print("\n📡 LIVE TRANSACTIONS")
    print("=" * 60)

    for i, (x, true_label) in enumerate(zip(X_stream, y_stream)):

        result = predictor.predict(x)

        prob = result["fraud_probability"]
        pred = result["fraud"]
        risk = result["risk"]

        total += 1

        # tracking
        if true_label == 1 and pred == 1:
            fraud_found += 1

        if true_label == 1 and pred == 0:
            missed_fraud += 1

        # ====================================
        # LIVE OUTPUT (CLEAN + VISUAL)
        # ====================================

        print(f"\nTX {i+1:03d}")
        print("-" * 40)
        print(f"🔎 Status : {status_label(pred)}")
        print(f"📊 Risk   : {risk}")
        print(f"🎯 Score  : {prob:.3f}")
        print(f"🧾 True   : {'FRAUD' if true_label == 1 else 'OK'}")

        # alert line
        if pred == 1:
            print("⚠️ ACTION: Review required")
        else:
            print("✔️ Action: Safe")

        print("=" * 40)

        logs.append({
            "true": int(true_label),
            "pred": int(pred),
            "prob": prob
        })

        time.sleep(delay)

    # ====================================
    # FINAL SUMMARY
    # ====================================

    print("\n📊 FINAL REPORT")
    print("=" * 60)

    print(f"🧾 Total transactions : {total}")
    print(f"🚨 Fraud detected     : {fraud_found}")
    print(f"❌ Missed fraud       : {missed_fraud}")

    detection_rate = fraud_found / (fraud_found + missed_fraud + 1e-8)

    print(f"📈 Detection rate     : {detection_rate:.3f}")

    # save logs
    pd.DataFrame(logs).to_csv("stream_logs.csv", index=False)

    print("\n💾 Logs saved → stream_logs.csv")
    print("🎉 STREAM FINISHED SUCCESSFULLY")


# ====================================
# RUN
# ====================================

if __name__ == "__main__":
    run_stream(delay=1.0)
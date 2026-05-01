# app/eval.py

import torch
import joblib
import numpy as np
import json
import os

from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

from app.preprocess import preprocess
from app.models.autoencoder import Autoencoder
from app.models.transformer_model import TransformerModel
from app.models.attention_model import AttentionModel
from app.ensemble import EnsembleFraudDetector

from app.config import *


# ====================================
# HELPER
# ====================================

def sigmoid(x):
    return 1 / (1 + np.exp(-x))


# ====================================
# METRICS
# ====================================

def evaluate(y_true, y_pred):
    return {
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
        "confusion_matrix": confusion_matrix(y_true, y_pred)
    }


# ====================================
# PRINT
# ====================================

def print_box(title, metrics, emoji):
    print("\n" + "═" * 60)
    print(f"{emoji}  {title}")
    print("═" * 60)

    print(f"Precision : {metrics['precision']:.4f}")
    print(f"Recall    : {metrics['recall']:.4f}")
    print(f"F1 Score  : {metrics['f1']:.4f}")

    print("\nConfusion Matrix:")
    print(metrics["confusion_matrix"])
    print("═" * 60)


# ====================================
# LOAD MODEL
# ====================================

def load_model(model_class, path):
    model = model_class().to(DEVICE)
    model.load_state_dict(torch.load(path, map_location=DEVICE))
    model.eval()
    return model


# ====================================
# TORCH PREDICTIONS
# ====================================

def predict_logits(model, X):
    X_tensor = torch.tensor(X, dtype=torch.float32).to(DEVICE)

    with torch.no_grad():
        logits = model(X_tensor)

    return logits.cpu().numpy().flatten()


# ====================================
# AUTOENCODER
# ====================================

def predict_autoencoder(model, X):
    X_tensor = torch.tensor(X, dtype=torch.float32).to(DEVICE)

    with torch.no_grad():
        recon = model(X_tensor)

        scores = torch.mean(
            (X_tensor - recon) ** 2,
            dim=1
        ).cpu().numpy()

    return scores


# ====================================
# MAIN EVALUATION
# ====================================

def run_eval():

    print("\n🚀 Loading dataset...")
    _, X_test, _, y_test = preprocess(use_smote=False)

    print("📦 Loading models...\n")

    ae = load_model(Autoencoder, AUTOENCODER_PATH)
    tr = load_model(TransformerModel, TRANSFORMER_PATH)
    att = load_model(AttentionModel, ATTENTION_PATH)

    log_model = joblib.load(LOGISTIC_PATH)

    print("🔍 Predicting...\n")

    # ====================================
    # MODEL OUTPUTS
    # ====================================

    ae_score = predict_autoencoder(ae, X_test)
    tr_logit = predict_logits(tr, X_test)
    att_logit = predict_logits(att, X_test)
    log_prob = log_model.predict_proba(X_test)[:, 1]

    # ====================================
    # ENSEMBLE
    # ====================================

    ensemble = EnsembleFraudDetector()

    final_score = np.array([
        ensemble.predict(
            ae_score[i],
            tr_logit[i],
            att_logit[i],
            log_prob[i]
        )
        for i in range(len(X_test))
    ])

    threshold = 0.40
    final_pred = (final_score > threshold).astype(int)

    # ====================================
    # INDIVIDUAL PREDICTIONS
    # ====================================

    ae_pred = (ae_score > np.percentile(ae_score, 95)).astype(int)
    tr_pred = (sigmoid(tr_logit) > 0.5).astype(int)
    att_pred = (sigmoid(att_logit) > 0.5).astype(int)
    log_pred = (log_prob > 0.5).astype(int)

    # ====================================
    # RESULTS PRINT
    # ====================================

    print_box("AUTOENCODER (ANOMALY DETECTOR)", evaluate(y_test, ae_pred), "🚨")
    print_box("TRANSFORMER", evaluate(y_test, tr_pred), "🧠")
    print_box("ATTENTION", evaluate(y_test, att_pred), "🎯")
    print_box("LOGISTIC REGRESSION", evaluate(y_test, log_pred), "📈")
    print_box("ENSEMBLE FRAUD SYSTEM", evaluate(y_test, final_pred), "🔥")

    # ====================================
    # SAVE METRICS (SAFE FIX)
    # ====================================

    os.makedirs("artifacts", exist_ok=True)

    def clean(x):
        if isinstance(x, np.ndarray):
            return x.tolist()
        return x

    results = {
        "autoencoder": evaluate(y_test, ae_pred),
        "transformer": evaluate(y_test, tr_pred),
        "attention": evaluate(y_test, att_pred),
        "logistic": evaluate(y_test, log_pred),
        "ensemble": evaluate(y_test, final_pred)
    }

    with open("artifacts/eval_results.json", "w") as f:
        json.dump(results, f, default=clean, indent=4)

    print("\n💾 Saved: artifacts/eval_results.json")
    print("\n🎉 SYSTEM EVALUATION COMPLETE")
# app/predict.py

import torch
import numpy as np
import pickle
import joblib

from app.models.autoencoder import Autoencoder
from app.models.transformer_model import TransformerModel
from app.models.attention_model import AttentionModel
from app.ensemble import ensemble

from app.config import *


class Predictor:

    def __init__(self):

        self.scaler = pickle.load(open(SCALER_PATH, "rb"))
        self.log_model = joblib.load(LOGISTIC_PATH)

        self.ae = Autoencoder().to(DEVICE)
        self.tr = TransformerModel().to(DEVICE)
        self.att = AttentionModel().to(DEVICE)

        self.ae.load_state_dict(
            torch.load(AUTOENCODER_PATH, map_location=DEVICE)
        )

        self.tr.load_state_dict(
            torch.load(TRANSFORMER_PATH, map_location=DEVICE)
        )

        self.att.load_state_dict(
            torch.load(ATTENTION_PATH, map_location=DEVICE)
        )

        self.ae.eval()
        self.tr.eval()
        self.att.eval()

    def predict(self, x):

        x = np.array(x, dtype=np.float32).reshape(1, -1)

        x = np.nan_to_num(x)

        # preprocessing
        x_scaled = self.scaler.transform(x)

        x_tensor = torch.tensor(
            x_scaled,
            dtype=torch.float32
        ).to(DEVICE)

        with torch.no_grad():

            # autoencoder anomaly score
            recon = self.ae(x_tensor)

            ae_score = torch.mean(
                (x_tensor - recon) ** 2
            ).item()

            # logits
            tr_score = self.tr(x_tensor).item()
            att_score = self.att(x_tensor).item()

        # logistic regression probability
        log_score = self.log_model.predict_proba(
            x_scaled
        )[0][1]

        # final ensemble score
        score = ensemble.predict(
            ae_score,
            tr_score,
            att_score,
            log_score
        )

        threshold = 0.25

        return {
            "fraud_probability": float(score),
            "fraud": int(score > threshold),
            "risk": (
                "HIGH" if score > 0.7
                else "MEDIUM" if score > 0.4
                else "LOW"
            )
        }
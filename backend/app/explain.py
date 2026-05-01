import shap
import numpy as np
import torch
from app.predict import Predictor

class Explainer:
    def __init__(self, predictor: Predictor):
        self.predictor = predictor

    def predict_fn(self, x):
        results = []
        for row in x:
            res = self.predictor.predict(row)
            results.append(res["probability"])
        return np.array(results)

    def explain(self, sample):
        background = np.zeros((1, len(sample)))

        explainer = shap.KernelExplainer(self.predict_fn, background)
        shap_values = explainer.shap_values(np.array([sample]))

        return shap_values
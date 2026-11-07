# FraudExAI

**Real-time credit card fraud detection with an ensemble of deep learning models and explainable predictions.**

A FastAPI backend scores card transactions with four models combined into a weighted ensemble, explains each decision with SHAP, and streams live transactions to an Angular banking dashboard over WebSocket.

## Results

Test set of the [Kaggle Credit Card Fraud dataset](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud): 56,962 transactions, of which 98 are fraud (0.17%).

| Model | Precision | Recall | F1 | Frauds caught | False alarms |
|---|---|---|---|---|---|
| Logistic regression | 0.042 | **0.908** | 0.080 | 89 / 98 | 2,047 |
| Autoencoder (anomaly detection) | 0.029 | 0.857 | 0.057 | 84 / 98 | 2,765 |
| Attention network | 0.145 | 0.786 | 0.245 | 77 / 98 | 453 |
| Transformer | **0.548** | 0.867 | **0.672** | 85 / 98 | **70** |
| **Weighted ensemble** | 0.503 | 0.878 | 0.639 | **86 / 98** | 85 |

With fraud this rare, accuracy is meaningless, so models are compared on precision, recall and F1. The transformer is the strongest single model. The ensemble catches one more fraud than the transformer, for 15 more false alarms.

## How it works

- **Models** ([`backend/app/models`](backend/app/models)):
  - a logistic regression baseline;
  - an autoencoder trained on normal transactions only, which flags those it reconstructs badly;
  - an attention network;
  - a transformer.
- **Ensemble** ([`ensemble.py`](backend/app/ensemble.py)): a weighted fusion of the four fraud scores (transformer 0.70, attention 0.15, logistic 0.10, autoencoder 0.05).
- **Explainability** ([`explain.py`](backend/app/explain.py)): SHAP values show which features pushed a transaction towards fraud.
- **API** ([`main.py`](backend/app/main.py)):
  - `GET /health`;
  - `POST /predict` (one transaction);
  - `WebSocket /stream` (live transaction feed).
- **Dashboard** ([`frontend/`](frontend)): Angular app with client and admin views, live fraud alerts, spending-limit alerts, charts and a fraud report form, in English and French.

## Run it

Requirements: Python 3.11+, Node.js 20+, and `creditcard.csv` from Kaggle in `backend/data/`.

```bash
# backend
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python run.py                    # API on http://localhost:8000

# frontend (second terminal)
cd frontend
npm install
npm start                        # dashboard on http://localhost:4200
```

On Windows, `start_project.ps1` starts both and `stop_project.ps1` stops them.

Retrain and re-evaluate the models with `python -m app.train` and `python -m app.eval` (inside `backend/`). Run the API tests with `pytest backend/tests`.

## Stack

Python · PyTorch · scikit-learn · imbalanced-learn · SHAP · FastAPI · WebSocket · Angular · Chart.js

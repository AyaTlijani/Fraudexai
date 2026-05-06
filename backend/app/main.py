from fastapi import FastAPI, WebSocket
from pydantic import BaseModel

from app.predict import Predictor
from app.stream_ws import run_stream

app = FastAPI(title="Fraud Detection System")

model = Predictor()

class Transaction(BaseModel):
    features: list[float]

@app.get("/health")
def health():
    return {"status": "running"}

@app.post("/predict")
def predict(tx: Transaction):
    return model.predict(tx.features)

@app.websocket("/stream")
async def stream_endpoint(websocket: WebSocket):
    await run_stream(websocket)
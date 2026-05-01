from fastapi import FastAPI
from pydantic import BaseModel
from app.predict import Predictor

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
# ==========================================
# LIVE STREAM
# ==========================================

@app.websocket("/stream")
async def stream_endpoint(websocket: WebSocket):
    await run_stream(websocket)


# ==========================================
# HISTORY TABLE DATA
# ==========================================

@app.get("/history")
async def get_history():
  return generate_history()
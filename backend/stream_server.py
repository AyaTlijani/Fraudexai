from fastapi import FastAPI, WebSocket
from app.stream_ws import run_stream

app = FastAPI()

@app.get("/")
def home():
    return {"status": "ok"}

@app.websocket("/stream")
async def stream_endpoint(websocket: WebSocket):
    await run_stream(websocket)
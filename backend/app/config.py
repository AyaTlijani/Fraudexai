import os
import torch


# ====================================
# BASE PATHS
# ====================================

BASE_DIR = os.path.dirname(
    os.path.dirname(__file__)
)

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "creditcard.csv"
)

SAVED = os.path.join(
    BASE_DIR,
    "saved_models"
)

# auto-create folder
os.makedirs(SAVED, exist_ok=True)


# ====================================
# MODEL PATHS
# ====================================

AUTOENCODER_PATH = os.path.join(
    SAVED,
    "autoencoder.pt"
)

TRANSFORMER_PATH = os.path.join(
    SAVED,
    "transformer.pt"
)

ATTENTION_PATH = os.path.join(
    SAVED,
    "attention.pt"
)

LOGISTIC_PATH = os.path.join(
    SAVED,
    "logistic.pkl"
)

SCALER_PATH = os.path.join(
    SAVED,
    "scaler.pkl"
)


# ====================================
# DEVICE
# ====================================

DEVICE = (
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)


# ====================================
# TRAINING
# ====================================

BATCH_SIZE = 512

EPOCHS = 10

LR = 1e-3
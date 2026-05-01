import os
os.environ["LOKY_MAX_CPU_COUNT"] = "4"

import joblib
import torch
import torch.nn as nn

from torch.utils.data import DataLoader
from torch.utils.data import TensorDataset

from app.models.autoencoder import Autoencoder
from app.models.transformer_model import TransformerModel
from app.models.attention_model import AttentionModel
from app.models.logistic_model import train_logistic

from app.preprocess import preprocess
from app.config import *


# ====================================
# TRAIN FUNCTION
# ====================================

def train_model(model, X, y=None, ae=False):

    model = model.to(DEVICE)

    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=LR,
        weight_decay=1e-5
    )

    mse = nn.MSELoss()

    # fraud-sensitive loss
    bce = nn.BCEWithLogitsLoss(
        pos_weight=torch.tensor([20.0]).to(DEVICE)
    )

    X = torch.tensor(X, dtype=torch.float32)

    if y is not None:
        y = torch.tensor(
            y,
            dtype=torch.float32
        )

    dataset = (
        TensorDataset(X)
        if y is None
        else TensorDataset(X, y)
    )

    loader = DataLoader(
        dataset,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=0
    )

    model.train()

    for epoch in range(EPOCHS):

        total_loss = 0

        for batch in loader:

            optimizer.zero_grad()

            # ======================
            # AUTOENCODER
            # ======================
            if ae:

                x = batch[0].to(DEVICE)

                recon = model(x)

                loss = mse(recon, x)

            # ======================
            # CLASSIFIERS
            # ======================
            else:

                x, yb = batch

                x = x.to(DEVICE)
                yb = yb.to(DEVICE)

                logits = model(x)

                loss = bce(logits, yb)

            loss.backward()

            torch.nn.utils.clip_grad_norm_(
                model.parameters(),
                1.0
            )

            optimizer.step()

            total_loss += loss.item()

        avg_loss = total_loss / len(loader)

        print(
            f"Epoch {epoch+1}/{EPOCHS}"
            f" - Loss: {avg_loss:.4f}"
        )

    return model


# ====================================
# MAIN TRAINING
# ====================================

def train_all():

    print("🚀 Preprocessing")

    X_train, X_test, y_train, y_test = preprocess(
        use_smote=True
    )

    print("Shape:", X_train.shape)

    # stability
    X_train = X_train[:50000]
    y_train = y_train[:50000]

    # ====================================
    # AUTOENCODER
    # ====================================

    print("\n🧠 Training Autoencoder")

    ae = train_model(
        Autoencoder(),
        X_train,
        ae=True
    )

    torch.save(
        ae.state_dict(),
        AUTOENCODER_PATH
    )

    # ====================================
    # TRANSFORMER
    # ====================================

    print("\n🧠 Training Transformer")

    tr = train_model(
        TransformerModel(),
        X_train,
        y_train
    )

    torch.save(
        tr.state_dict(),
        TRANSFORMER_PATH
    )

    # ====================================
    # ATTENTION
    # ====================================

    print("\n🧠 Training Attention")

    att = train_model(
        AttentionModel(),
        X_train,
        y_train
    )

    torch.save(
        att.state_dict(),
        ATTENTION_PATH
    )

    # ====================================
    # LOGISTIC REGRESSION
    # ====================================

    print("\n🧠 Training Logistic Regression")

    log_model = train_logistic(
        X_train,
        y_train
    )

    joblib.dump(
        log_model,
        LOGISTIC_PATH
    )

    print("\n🎉 TRAINING COMPLETE")
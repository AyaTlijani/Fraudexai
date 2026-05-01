import pandas as pd
import pickle

from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE

from app.config import *


def load_data():
    df = pd.read_csv(DATA_PATH, sep=",", engine="python")

    if "Class" not in df.columns:
        raise ValueError(f"'Class' column not found. Columns: {df.columns}")

    return df


def preprocess(use_smote=True):
    df = load_data()

    X = df.drop("Class", axis=1).values
    y = df["Class"].values

    # split first (no leakage)
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        stratify=y,
        random_state=42
    )

    # scale only train
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    with open(SCALER_PATH, "wb") as f:
        pickle.dump(scaler, f)

    # SAFE SMOTE (prevents freeze)
    if use_smote:
        sm = SMOTE(random_state=42, sampling_strategy=0.1)
        X_train, y_train = sm.fit_resample(X_train, y_train)

    return X_train, X_test, y_train, y_test
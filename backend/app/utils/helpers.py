import torch
import numpy as np

def to_tensor(x, device="cpu"):
    return torch.tensor(x, dtype=torch.float32, device=device)

def sigmoid(x):
    return 1 / (1 + np.exp(-x))
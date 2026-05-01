import torch
import torch.nn as nn


class TransformerModel(nn.Module):

    def __init__(self, input_dim=30, hidden=32):
        super().__init__()

        # simple projection
        self.embed = nn.Sequential(
            nn.Linear(input_dim, hidden),
            nn.ReLU(),
            nn.LayerNorm(hidden)
        )

        # lightweight feature attention
        self.attention = nn.Sequential(
            nn.Linear(hidden, hidden),
            nn.Tanh(),
            nn.Linear(hidden, hidden),
            nn.Sigmoid()
        )

        self.classifier = nn.Sequential(
            nn.Linear(hidden, 16),
            nn.ReLU(),

            nn.Dropout(0.2),

            nn.Linear(16, 1)
        )

    def forward(self, x):

        # (B, 30)
        x = self.embed(x)

        # feature importance weights
        attn = self.attention(x)

        x = x * attn

        logits = self.classifier(x)

        return logits.squeeze(-1)
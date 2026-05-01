import torch
import torch.nn as nn


class AttentionModel(nn.Module):

    def __init__(self, dim=30, d_model=64):
        super().__init__()

        self.embed = nn.Linear(1, d_model)

        self.attention = nn.MultiheadAttention(
            embed_dim=d_model,
            num_heads=4,
            dropout=0.2,
            batch_first=True
        )

        self.classifier = nn.Sequential(
            nn.Linear(d_model, 64),
            nn.ReLU(),

            nn.Dropout(0.3),

            nn.Linear(64, 32),
            nn.ReLU(),

            nn.Linear(32, 1)
        )

    def forward(self, x):

        # (B, 30)
        x = x.unsqueeze(-1)

        # (B, 30, d_model)
        x = self.embed(x)

        attn_out, _ = self.attention(x, x, x)

        # global pooling
        x = attn_out.mean(dim=1)

        logits = self.classifier(x)

        return logits.squeeze(-1)
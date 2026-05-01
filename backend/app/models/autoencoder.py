import torch
import torch.nn as nn


class Autoencoder(nn.Module):

    def __init__(self, d=30):
        super().__init__()

        self.norm = nn.LayerNorm(d)

        self.encoder = nn.Sequential(
            nn.Linear(d, 64),
            nn.ReLU(),

            nn.Linear(64, 32),
            nn.ReLU(),

            nn.Linear(32, 8)
        )

        self.decoder = nn.Sequential(
            nn.Linear(8, 32),
            nn.ReLU(),

            nn.Linear(32, 64),
            nn.ReLU(),

            nn.Linear(64, d)
        )

    def forward(self, x):

        x = self.norm(x)

        z = self.encoder(x)

        recon = self.decoder(z)

        return recon

    # convert reconstruction error -> fraud probability
    def anomaly_score(self, x, recon):

        err = torch.mean((x - recon) ** 2, dim=1)

        return torch.sigmoid(err)
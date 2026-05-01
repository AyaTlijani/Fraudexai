import numpy as np


class EnsembleFraudDetector:

    def __init__(self, weights=(0.05, 0.70, 0.15, 0.10)):

        # autoencoder, transformer, attention, logistic
        self.w_auto, self.w_trans, self.w_att, self.w_log = weights

    # ---------------------------------
    # SAFE NORMALIZATION
    # ---------------------------------
    def _normalize(self, x):

        x = np.array(x, dtype=np.float32)

        # safer clamp
        x = np.clip(x, -8, 8)

        # normalize to 0–1
        return 1 / (1 + np.exp(-x))

    # ---------------------------------
    # MAIN ENSEMBLE
    # ---------------------------------
    def predict(
        self,
        auto_score,
        trans_logit,
        att_logit,
        log_prob=0.0
    ):

        # autoencoder anomaly
        auto_score = np.clip(auto_score, 0, 5) / 5.0

        # classifier outputs
        trans_score = self._normalize(trans_logit)

        att_score = self._normalize(att_logit)

        log_score = float(log_prob)

        # weighted fusion
        final_score = (
            self.w_auto * auto_score +
            self.w_trans * trans_score +
            self.w_att * att_score +
            self.w_log * log_score
        )

        return float(np.clip(final_score, 0, 1))


# global import-safe instance
ensemble = EnsembleFraudDetector()
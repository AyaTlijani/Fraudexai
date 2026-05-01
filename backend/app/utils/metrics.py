from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

def evaluate(y_true, y_pred, y_prob=None):
    """
    Evaluation for fraud detection models.

    y_true: true labels
    y_pred: binary predictions (0/1)
    y_prob: optional probabilities (for ROC-AUC)
    """

    results = {
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist()
    }

    if y_prob is not None:
        try:
            results["roc_auc"] = roc_auc_score(y_true, y_prob)
        except:
            results["roc_auc"] = None

    return results
from sklearn.linear_model import LogisticRegression


def train_logistic(X_train, y_train):

    model = LogisticRegression(
        max_iter=3000,
        class_weight="balanced",
        solver="lbfgs"
    )

    model.fit(X_train, y_train)

    return model
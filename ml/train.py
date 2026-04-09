"""
Train phishing detection models on UCI Phishing Dataset.
Run this once to generate trained_model.pkl

Dataset: https://archive.ics.uci.edu/dataset/327/phishing+websites
OR use our synthetic dataset generator below for quick testing.

Usage:
    python train.py                    # use synthetic data
    python train.py --dataset data.csv # use real CSV dataset
"""

import sys
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix
from features import extract_features, features_to_vector


def generate_synthetic_data(n=2000):
    """
    Generate synthetic training data when real dataset not available.
    Real accuracy will be lower — use real UCI dataset for production.
    """
    print("⚠️  Using synthetic training data. For better accuracy, use the UCI Phishing Dataset.")
    print("   Download: https://archive.ics.uci.edu/dataset/327/phishing+websites\n")

    phishing_urls = [
        "http://192.168.1.1/paypal-login/verify-account",
        "http://paypa1.com/secure/login/verify",
        "https://secure.update.bank-verify.tk/account/confirm",
        "http://free-prize-winner.click/claim?ref=urgent",
        "https://accounts.secure.google.verify-now.xyz/login",
        "http://login.paypal.com.secure-verify.ru/account",
        "https://support.microsoft.com.fake-update.tk/fix",
        "http://amazon.com.order-confirm.suspicious.cf/track",
    ]

    legit_urls = [
        "https://google.com",
        "https://github.com/user/repo",
        "https://microsoft.com/en-us/surface",
        "https://amazon.com/dp/B08N5WRWNW",
        "https://linkedin.com/in/username",
        "https://stackoverflow.com/questions/12345",
        "https://wikipedia.org/wiki/Phishing",
        "https://youtube.com/watch?v=dQw4w9WgXcQ",
    ]

    rows = []
    labels = []

    rng = np.random.default_rng(42)

    for _ in range(n // 2):
        base = phishing_urls[rng.integers(len(phishing_urls))]
        noise = ''.join(rng.choice(list('abcdefghijklmnop0123456789-'), size=rng.integers(0, 15)))
        url = base + noise
        feat = features_to_vector(extract_features(url))
        rows.append(feat)
        labels.append(1)  # phishing

    for _ in range(n // 2):
        base = legit_urls[rng.integers(len(legit_urls))]
        noise = ''.join(rng.choice(list('abcdefghijklmnop'), size=rng.integers(0, 8)))
        url = base + '/' + noise
        feat = features_to_vector(extract_features(url))
        rows.append(feat)
        labels.append(0)  # legitimate

    return np.array(rows), np.array(labels)


def load_uci_dataset(path: str):
    """Load and parse the UCI phishing dataset CSV."""
    df = pd.read_csv(path)
    # UCI dataset: last column is label (-1=phishing, 1=legitimate)
    # Adjust column name as needed
    label_col = df.columns[-1]
    X_raw = df.drop(columns=[label_col])
    y = (df[label_col] == -1).astype(int)  # 1=phishing, 0=legit
    return X_raw.values, y.values


def train(dataset_path=None):
    print("🧠 PhishGuard ML — Model Training\n")

    if dataset_path:
        print(f"📂 Loading dataset: {dataset_path}")
        X, y = load_uci_dataset(dataset_path)
    else:
        X, y = generate_synthetic_data(n=3000)

    print(f"   Samples: {len(X)} ({sum(y)} phishing, {len(y)-sum(y)} legitimate)")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Train multiple models, pick best
    models = {
        'RandomForest': Pipeline([
            ('clf', RandomForestClassifier(n_estimators=200, max_depth=15, random_state=42, n_jobs=-1))
        ]),
        'GradientBoosting': Pipeline([
            ('clf', GradientBoostingClassifier(n_estimators=150, max_depth=5, random_state=42))
        ]),
        'LogisticRegression': Pipeline([
            ('scaler', StandardScaler()),
            ('clf', LogisticRegression(max_iter=1000, random_state=42))
        ])
    }

    best_model = None
    best_score = 0
    best_name = ''

    print("\n📊 Model comparison:\n")
    for name, model in models.items():
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='f1')
        print(f"   {name:25s} F1: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
        if cv_scores.mean() > best_score:
            best_score = cv_scores.mean()
            best_model = model
            best_name = name

    print(f"\n✅ Best model: {best_name} (F1={best_score:.3f})")

    best_model.fit(X_train, y_train)
    y_pred = best_model.predict(X_test)

    print("\n📈 Test set results:")
    print(classification_report(y_test, y_pred, target_names=['Legitimate', 'Phishing']))

    # Save model
    joblib.dump({'model': best_model, 'name': best_name}, 'trained_model.pkl')
    print("💾 Model saved to trained_model.pkl")

    return best_model, best_name


if __name__ == '__main__':
    dataset = sys.argv[2] if len(sys.argv) > 2 and sys.argv[1] == '--dataset' else None
    train(dataset)

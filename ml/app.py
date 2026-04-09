"""
PhishGuard ML Service — Flask API
Serves the trained phishing detection model.

Start: python app.py
Prod:  gunicorn -w 2 -b 0.0.0.0:5000 app:app
"""

import os
import joblib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from features import extract_features, features_to_vector

app = Flask(__name__)
CORS(app)

# ── Load model ─────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'trained_model.pkl')
model_data = None

def load_model():
    global model_data
    if os.path.exists(MODEL_PATH):
        model_data = joblib.load(MODEL_PATH)
        print(f"✅ Model loaded: {model_data['name']}")
    else:
        print("⚠️  No trained model found. Run: python train.py")
        print("   Predictions will use feature-only heuristic fallback.")

load_model()


# ── Routes ─────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'model_loaded': model_data is not None,
        'model_name': model_data['name'] if model_data else None
    })


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'error': 'url field required'}), 400

    url = data['url'].strip()
    if not url:
        return jsonify({'error': 'url cannot be empty'}), 400

    # Extract features
    features = extract_features(url)
    vector = features_to_vector(features)
    X = np.array([vector])

    if model_data:
        # Use trained model
        model = model_data['model']
        pred = model.predict(X)[0]
        proba = model.predict_proba(X)[0]
        confidence = round(float(proba[pred]) * 100, 1)
        prediction = 'phishing' if pred == 1 else 'legitimate'
        model_name = model_data['name']
    else:
        # Heuristic fallback (no model file)
        phish_signals = (
            features['has_ip'] * 4 +
            (1 - features['has_https']) * 2 +
            features['suspicious_tld'] * 2 +
            min(features['suspicious_keyword_count'], 3) +
            (features['dot_count'] > 3) * 2
        )
        pred = 1 if phish_signals >= 4 else 0
        confidence = min(95, 40 + phish_signals * 8)
        prediction = 'phishing' if pred == 1 else 'legitimate'
        model_name = 'heuristic-fallback'

    return jsonify({
        'url': url,
        'prediction': prediction,
        'confidence': confidence,
        'model': model_name,
        'features': {
            k: v for k, v in features.items()
            if v != 0  # only return non-zero features to keep response clean
        },
        'all_features': features
    })


@app.route('/features', methods=['POST'])
def get_features():
    """Return raw feature breakdown for a URL (useful for debugging)."""
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'error': 'url field required'}), 400

    features = extract_features(data['url'].strip())
    return jsonify({'url': data['url'], 'features': features})


@app.route('/retrain', methods=['POST'])
def retrain():
    """Trigger model retraining (add auth in production!)."""
    try:
        from train import train
        _, name = train()
        load_model()
        return jsonify({'status': 'retrained', 'model': name})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("\n🤖 PhishGuard ML Service")
    print(f"   Running on http://localhost:5000\n")
    app.run(host='0.0.0.0', port=5000, debug=True)

const axios = require('axios');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

async function getMLPrediction(url) {
  try {
    const res = await axios.post(`${ML_URL}/predict`, { url }, { timeout: 8000 });
    return {
      available: true,
      prediction: res.data.prediction,       // "phishing" | "legitimate"
      confidence: res.data.confidence,        // 0–100
      features: res.data.features,            // feature breakdown
      model: res.data.model                   // model name used
    };
  } catch (err) {
    // ML service offline — gracefully degrade
    return {
      available: false,
      reason: err.code === 'ECONNREFUSED'
        ? 'ML service not running (start with: cd ml && python app.py)'
        : err.message
    };
  }
}

module.exports = { getMLPrediction };

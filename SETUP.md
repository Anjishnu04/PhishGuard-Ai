# PhishGuard AI — Setup Guide

## Prerequisites
- Node.js 18+
- Python 3.10+
- API keys (see below)

---

## Step 1 — Get Your API Keys

### Groq (AI)
1. Go to https://console.groq.com
2. Create account → API Keys → New Key
3. Copy key → paste in `backend/.env` as `GROQ_API_KEY`

### VirusTotal (free tier: 500 scans/day)
1. Go to https://www.virustotal.com
2. Sign up → click your avatar → API Key
3. Copy key → paste as `VIRUSTOTAL_API_KEY`

### Google Safe Browsing (free)
1. Go to https://console.cloud.google.com
2. New Project → Enable "Safe Browsing API"
3. Credentials → Create API Key
4. Copy key → paste as `GOOGLE_SAFEBROWSING_KEY`

---

## Step 2 — Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and fill in your API keys
npm run dev
# ✅ Running on http://localhost:4000
```

Test it:
```bash
curl http://localhost:4000/api/health
```

---

## Step 3 — ML Service Setup

```bash
cd ml
pip install -r requirements.txt

# Train the model (takes ~30 seconds with synthetic data)
python train.py

# For better accuracy, use the real UCI dataset:
# Download: https://archive.ics.uci.edu/dataset/327/phishing+websites
# python train.py --dataset path/to/phishing.csv

# Start the service
python app.py
# ✅ Running on http://localhost:5000
```

Test it:
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"url":"http://paypa1.com/login"}'
```

---

## Step 4 — Frontend Setup

```bash
cd frontend
npm install
npm run dev
# ✅ Running on http://localhost:3000
```

Open http://localhost:3000 and scan your first URL!

---

## Step 5 — Deploy to Production

### Frontend → Vercel
```bash
cd frontend
npm install -g vercel
vercel
# Follow prompts, set VITE_API_URL to your backend URL
```

### Backend + ML → Render
1. Push code to GitHub
2. Go to https://render.com → New → Blueprint
3. Connect your repo — it will read `render.yaml` automatically
4. Add environment variables in the Render dashboard

### Or use Docker Compose (all at once)
```bash
# At project root
cp backend/.env.example backend/.env
# Edit backend/.env with your keys
docker-compose up --build
```

---

## API Reference

### POST /api/scan
Scan a URL for phishing signals.

**Request:**
```json
{ "url": "https://example.com" }
```

**Response:**
```json
{
  "url": "https://example.com",
  "score": 72,
  "verdict": "Dangerous",
  "severity": "danger",
  "rules": {
    "score": 65,
    "flags": [...],
    "scoreLog": [...],
    "meta": { "host": "...", "tld": "...", "subdomainCount": 2 }
  },
  "virusTotal": {
    "malicious": 12,
    "suspicious": 3,
    "total": 72,
    "detectionRate": 21
  },
  "safeBrowsing": {
    "isMalicious": true,
    "threats": ["SOCIAL_ENGINEERING"],
    "label": "Phishing/Social Engineering"
  },
  "ml": {
    "prediction": "phishing",
    "confidence": 91.4,
    "model": "RandomForest"
  },
  "aiExplanation": "This URL appears dangerous because..."
}
```

### POST /api/chat
Send a message to the AI security assistant.

**Request:**
```json
{
  "message": "Is this URL safe?",
  "scanContext": { "url": "...", "score": 72, "verdict": "Dangerous", "flags": [...] },
  "history": [{ "role": "user", "content": "..." }, ...]
}
```

**Response:**
```json
{ "reply": "Based on the scan results..." }
```

### GET /api/health
Check which services are configured and running.

**Response:**
```json
{
  "status": "ok",
  "services": {
    "virustotal": true,
    "safeBrowsing": true,
    "groq": true,
    "ml": true
  }
}
```

---

## Architecture

```
┌─────────────────────────────────────┐
│   React Frontend  (Vite + Tailwind) │
│   localhost:3000                    │
└──────────────────┬──────────────────┘
                   │ /api/*
┌──────────────────▼──────────────────┐
│   Express Backend (Node.js)         │
│   localhost:4000                    │
│                                     │
│  ┌──────────┐  ┌──────────────────┐ │
│  │Rule      │  │  External APIs   │ │
│  │Engine    │  │  • VirusTotal    │ │
│  │(instant) │  │  • Safe Browsing │ │
│  └──────────┘  └──────────────────┘ │
│                                     │
│  ┌──────────┐  ┌──────────────────┐ │
│  │  Groq    │  │  ML Service      │ │
│  │   AI     │  │  (Python Flask)  │ │
│  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────┐
│   Flask ML Service (Python)         │
│   localhost:5000                    │
│   • Feature extraction (20 signals) │
│   • Random Forest / Gradient Boost  │
│   • Logistic Regression fallback    │
└─────────────────────────────────────┘
```

## Score Calculation

Final score = Rule engine score + API adjustments:
- VirusTotal malicious detections → up to +30
- Google Safe Browsing flagged → +25
- ML model predicts phishing → up to +20
- Capped at 100

| Score | Verdict    |
|-------|------------|
| 0–29  | Safe       |
| 30–64 | Suspicious |
| 65+   | Dangerous  |

# PhishGuard AI — Full Stack Phishing Detection

```
phishguard/
├── frontend/          React + Tailwind CSS
├── backend/           Node.js + Express API
├── ml/                Python Flask ML service
└── docs/              Architecture & API docs
```

## Quick Start

### 1. Backend (Node.js)
```bash
cd backend
npm install
cp .env.example .env        # fill in your API keys
npm run dev                 # runs on :4000
```

### 2. ML Service (Python)
```bash
cd ml
pip install -r requirements.txt
python app.py               # runs on :5000
```

### 3. Frontend (React)
```bash
cd frontend
npm install
npm run dev                 # runs on :3000
```

## API Keys needed
- `VIRUSTOTAL_API_KEY`   → https://virustotal.com (free tier)
- `GOOGLE_SAFEBROWSING_KEY` → https://console.cloud.google.com
- `GROQ_API_KEY`   → https://console.groq.com

## Architecture
```
React Frontend (3000)
        ↓
Express Backend (4000)
    ↙       ↘
VirusTotal   Flask ML (5000)
Google Safe  Rule Engine
Browsing API Groq AI
```

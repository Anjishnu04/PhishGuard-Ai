require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const scanRouter = require('./routes/scan');
const chatRouter = require('./routes/chat');
const healthRouter = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Security Middleware ──────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(morgan('dev'));

// ─── Rate Limiting ────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 30,                    // 30 requests per minute per IP
  message: { error: 'Too many requests, please slow down.' }
});
app.use('/api/', limiter);

// ─── Routes ───────────────────────────────────────────
app.use('/api/scan', scanRouter);
app.use('/api/chat', chatRouter);
app.use('/api/health', healthRouter);

// ─── Error Handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🛡️  PhishGuard backend running on http://localhost:${PORT}`);
  console.log(`   URLScan.io:     ${process.env.URLSCAN_API_KEY ? '✅ configured' : '❌ missing key'}`);
  console.log('   URLHaus:        ✅ available (no key needed)');
  console.log(`   Groq:           ${process.env.GROQ_API_KEY ? '✅ configured' : '❌ missing key'}`);
  console.log(`   ML Service:     ${process.env.ML_SERVICE_URL}\n`);
});

module.exports = app;

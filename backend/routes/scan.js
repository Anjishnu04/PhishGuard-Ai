const express = require('express');
const router = express.Router();
const validUrl = require('valid-url');

const { analyzeRules } = require('../services/ruleEngine');
const { scanWithURLScan } = require('../services/urlScan');
const { checkURLHaus } = require('../services/urlHaus');
const { getMLPrediction } = require('../services/mlService');
const { generateExplanation } = require('../services/aiService');

// POST /api/scan
router.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  const trimmed = url.trim();

  // Basic URL format check
  if (!validUrl.isWebUri(trimmed)) {
    return res.status(400).json({ error: 'Invalid URL format. Include http:// or https://' });
  }

  try {
    const safeRuleResult = {
      score: 0,
      flags: [],
      scoreLog: [],
      meta: {
        host: null,
        protocol: null,
        path: null,
        query: null,
        tld: null,
        subdomainCount: 0
      }
    };

    const serviceUnavailable = (reason) => ({ available: false, reason });

    // ── Run all checks in parallel ──────────────────
    const [ruleResult, urlScan, urlHaus, mlResult] = await Promise.all([
      Promise.resolve()
        .then(() => analyzeRules(trimmed))
        .catch((err) => {
          console.error('[scan] Rule engine error:', err.message);
          return safeRuleResult;
        }),
      scanWithURLScan(trimmed).catch((err) => serviceUnavailable(err.message)),
      checkURLHaus(trimmed).catch((err) => serviceUnavailable(err.message)),
      getMLPrediction(trimmed).catch((err) => serviceUnavailable(err.message))
    ]);

    // ── Adjust final score based on external APIs ───
    let finalScore = ruleResult.score;

    if (urlScan.available && urlScan.malicious) {
      finalScore = Math.min(100, finalScore + 25);
    }

    if (urlHaus.available && urlHaus.found) {
      finalScore = Math.min(100, finalScore + 30);
    }

    if (mlResult.available && mlResult.prediction === 'phishing') {
      const mlBoost = Math.round((mlResult.confidence / 100) * 20);
      finalScore = Math.min(100, finalScore + mlBoost);
    }

    finalScore = Math.round(finalScore);

    let verdict, severity;
    if (finalScore < 30) { verdict = 'Safe'; severity = 'safe'; }
    else if (finalScore < 65) { verdict = 'Suspicious'; severity = 'warning'; }
    else { verdict = 'Dangerous'; severity = 'danger'; }

    // ── Generate AI explanation ─────────────────────
    const aiExplanation = await generateExplanation({
      url: trimmed,
      ruleResult: { ...ruleResult, score: finalScore, verdict },
      urlScan,
      urlHaus,
      mlResult
    });

    // ── Compile response ────────────────────────────
    res.json({
      url: trimmed,
      score: finalScore,
      verdict,
      severity,
      scannedAt: new Date().toISOString(),

      // Rule engine results
      rules: {
        score: ruleResult.score,
        flags: ruleResult.flags,
        scoreLog: ruleResult.scoreLog,
        meta: ruleResult.meta
      },

      // External API results
      urlScan: urlScan.available ? {
        malicious: urlScan.malicious,
        verdict: urlScan.verdict,
        tags: urlScan.tags,
        screenshot: urlScan.screenshot,
        country: urlScan.country,
        ip: urlScan.ip,
        server: urlScan.server,
        reportURL: urlScan.reportURL,
        cached: urlScan.cached || false
      } : { available: false, reason: urlScan.reason },

      urlHaus: urlHaus.available ? {
        found: urlHaus.found,
        status: urlHaus.status,
        threat: urlHaus.threat,
        tags: urlHaus.tags,
        dateAdded: urlHaus.dateAdded,
        urlhausReference: urlHaus.urlhausReference,
        blacklists: urlHaus.blacklists
      } : { available: false, reason: urlHaus.reason },

      ml: mlResult.available ? {
        prediction: mlResult.prediction,
        confidence: mlResult.confidence,
        features: mlResult.features,
        model: mlResult.model
      } : { available: false, reason: mlResult.reason },

      aiExplanation: aiExplanation.available
        ? aiExplanation.text
        : null
    });

  } catch (err) {
    console.error('[/api/scan] Error:', err);
    res.status(500).json({ error: 'Scan failed', message: err.message });
  }
});

module.exports = router;

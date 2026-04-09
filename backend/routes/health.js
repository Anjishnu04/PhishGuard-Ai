const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
  const services = {
    urlScan: !!process.env.URLSCAN_API_KEY,
    urlHaus: true,
    groq: !!process.env.GROQ_API_KEY,
    ml: false
  };

  // Check ML service
  try {
    await axios.get(`${process.env.ML_SERVICE_URL || 'http://localhost:5000'}/health`, { timeout: 2000 });
    services.ml = true;
  } catch {}

  res.json({
    status: 'ok',
    version: '1.0.0',
    services,
    uptime: Math.floor(process.uptime())
  });
});

module.exports = router;

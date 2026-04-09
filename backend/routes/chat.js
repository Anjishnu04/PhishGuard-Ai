const express = require('express');
const router = express.Router();
const { chatResponse } = require('../services/aiService');

// POST /api/chat
router.post('/', async (req, res) => {
  const { message, scanContext, history } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  if (message.length > 500) {
    return res.status(400).json({ error: 'Message too long (max 500 chars)' });
  }

  try {
    const result = await chatResponse({
      message: message.trim(),
      scanContext: scanContext || null,
      history: (history || []).slice(-10)  // keep last 10 messages for context
    });

    if (!result.available) {
      return res.status(503).json({ error: 'AI service unavailable', reason: result.reason });
    }

    res.json({ reply: result.text });
  } catch (err) {
    console.error('[/api/chat] Error:', err);
    res.status(500).json({ error: 'Chat failed', message: err.message });
  }
});

module.exports = router;

const axios = require('axios');
const NodeCache = require('node-cache');

const URLSCAN_BASE = 'https://urlscan.io/api/v1';
const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL, 10) || 3600 });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getCacheKey(url) {
  return 'urlscan:' + Buffer.from(url).toString('base64').slice(0, 40);
}

function parseDateCandidate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function computeDomainAgeDays(page = {}) {
  const candidates = [
    page.domainCreated,
    page.domainCreatedAt,
    page.registrationDate,
    page.registeredAt,
    page.whoisCreatedDate
  ];

  const created = candidates
    .map(parseDateCandidate)
    .find(Boolean);

  if (!created) return null;

  const ageMs = Date.now() - created.getTime();
  if (ageMs < 0) return null;
  return Math.floor(ageMs / (1000 * 60 * 60 * 24));
}

async function fetchURLScanResult(uuid, headers) {
  const maxAttempts = 5; // 1 initial + 4 retries

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const res = await axios.get(`${URLSCAN_BASE}/result/${uuid}/`, {
        headers,
        timeout: 15000
      });
      return res.data;
    } catch (err) {
      const status = err.response?.status;
      if (status === 404 && attempt < maxAttempts - 1) {
        await sleep(3000);
        continue;
      }
      if (status === 404) {
        return null;
      }
      throw err;
    }
  }

  return null;
}

async function scanWithURLScan(url) {
  if (!process.env.URLSCAN_API_KEY) {
    return { available: false, reason: 'No API key configured' };
  }

  const cacheKey = getCacheKey(url);
  const cached = cache.get(cacheKey);
  if (cached) return { ...cached, cached: true };

  const headers = {
    'API-Key': process.env.URLSCAN_API_KEY,
    'Content-Type': 'application/json'
  };

  try {
    const scanRes = await axios.post(
      `${URLSCAN_BASE}/scan`,
      { url, visibility: 'public' },
      { headers, timeout: 15000 }
    );

    const uuid = scanRes.data?.uuid;
    if (!uuid) {
      return { available: false, reason: 'URLScan did not return a scan ID' };
    }

    // URLScan needs a short warm-up before the result endpoint becomes available.
    await sleep(10000);

    const result = await fetchURLScanResult(uuid, { 'API-Key': process.env.URLSCAN_API_KEY });
    if (!result) {
      return { available: false, reason: 'URLScan result not ready yet' };
    }

    const overall = result.verdicts?.overall || {};
    const page = result.page || {};

    const payload = {
      available: true,
      verdict: typeof overall.score === 'number' ? overall.score : 0,
      malicious: !!overall.malicious,
      tags: Array.isArray(overall.tags) ? overall.tags : [],
      screenshot: result.task?.screenshotURL || null,
      country: page.country || null,
      server: page.server || null,
      ip: page.ip || null,
      asn: page.asn || null,
      tlsIssuer: page.tlsIssuer || null,
      domainAge: computeDomainAgeDays(page),
      reportURL: `https://urlscan.io/result/${uuid}`
    };

    cache.set(cacheKey, payload);
    return payload;
  } catch (err) {
    const status = err.response?.status;
    const message = String(err.response?.data?.message || err.message || '').toLowerCase();

    if (status === 400) {
      if (message.includes('private') || message.includes('internal') || message.includes('localhost')) {
        return { available: false, reason: 'Private/internal URL — URLScan skipped' };
      }
      return { available: false, reason: 'Invalid URL or private domain' };
    }

    if (status === 429) {
      return { available: false, reason: 'Rate limit exceeded (5000/day free)' };
    }

    return { available: false, reason: err.message };
  }
}

module.exports = { scanWithURLScan };
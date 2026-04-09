const axios = require('axios');
const NodeCache = require('node-cache');

const URLHAUS_API = 'https://urlhaus-api.abuse.ch/v1/url/';
const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL, 10) || 3600 });

function getCacheKey(url) {
  return 'urlhaus:' + Buffer.from(url).toString('base64').slice(0, 40);
}

async function checkURLHaus(url) {
  const cacheKey = getCacheKey(url);
  const cached = cache.get(cacheKey);
  if (cached) return { ...cached, cached: true };

  try {
    const params = new URLSearchParams();
    params.append('url', url);

    const res = await axios.post(URLHAUS_API, params, {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'PhishGuard/1.0'
      },
      timeout: 12000
    });

    const data = res.data || {};
    const found = data.query_status === 'is_listed';

    const payload = {
      available: true,
      found,
      status: data.url_status || 'unknown',
      threat: data.threat || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      dateAdded: data.date_added || null,
      urlhausReference: data.urlhaus_reference || null,
      blacklists: {
        surbl: data.blacklists?.surbl,
        spamhaus: data.blacklists?.spamhaus_dbl
      }
    };

    cache.set(cacheKey, payload);
    return payload;
  } catch (err) {
    return { available: false, reason: err.message };
  }
}

module.exports = { checkURLHaus };

// Rule-based phishing detection engine
// Returns score contributions and flag details

const SUSPICIOUS_KEYWORDS = [
  'verify','secure','update','login','bank','paypal','account',
  'password','confirm','free','prize','win','urgent','alert',
  'suspended','billing','invoice','support','signin','validate',
  'credential','authenticate','limited','expire','immediately'
];

const SUSPICIOUS_TLDS = new Set([
  '.tk','.ml','.ga','.cf','.gq','.ru','.xyz','.top',
  '.click','.loan','.work','.party','.review','.bid',
  '.download','.stream','.gdn','.racing'
]);

const TRUSTED_DOMAINS = new Set([
  'google.com','github.com','microsoft.com','apple.com','amazon.com',
  'facebook.com','twitter.com','linkedin.com','youtube.com',
  'instagram.com','wikipedia.org','reddit.com','netflix.com'
]);

const HOMOGLYPHS = [
  ['paypa1','paypal'],['g00gle','google'],['arnazon','amazon'],
  ['micros0ft','microsoft'],['app1e','apple'],['faceb0ok','facebook'],
  ['netfl1x','netflix'],['bankofamerlca','bankofamerica'],
  ['tw1tter','twitter'],['1nstagram','instagram']
];

function parseURL(raw) {
  try {
    const u = new URL(raw);
    return { protocol: u.protocol, host: u.hostname, path: u.pathname, query: u.search, valid: true };
  } catch {
    const host = raw.replace(/https?:\/\//i,'').split('/')[0];
    return {
      protocol: raw.toLowerCase().startsWith('https') ? 'https:' : 'http:',
      host, path: '/', query: '', valid: false
    };
  }
}

function analyzeRules(raw) {
  const url = raw.toLowerCase();
  const { protocol, host, path, query } = parseURL(raw);
  const scoreLog = [];
  const flags = [];
  let score = 0;

  const add = (label, pts, flag) => {
    score += pts;
    scoreLog.push({ label, pts });
    if (flag) flags.push(flag);
  };

  // 1. HTTPS
  if (protocol !== 'https:') {
    add('No HTTPS', 20, {
      type: 'danger', title: 'No HTTPS',
      desc: 'Connection is unencrypted. Passwords and data can be intercepted.'
    });
  } else {
    add('HTTPS present', 0, {
      type: 'safe', title: 'HTTPS',
      desc: 'Encrypted connection detected.'
    });
  }

  // 2. Raw IP
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    add('Raw IP address', 35, {
      type: 'danger', title: 'IP Address URL',
      desc: 'Uses a numeric IP instead of a domain name — strongest phishing signal.'
    });
  }

  // 3. URL length
  if (raw.length > 100) {
    add(`Long URL (${raw.length} chars)`, 15, {
      type: 'warning', title: 'Very Long URL',
      desc: `${raw.length} characters — attackers pad URLs to hide malicious destinations.`
    });
  } else if (raw.length > 75) {
    add(`Moderate URL length (${raw.length})`, 8, {
      type: 'warning', title: 'Long URL',
      desc: `${raw.length} chars — slightly above average.`
    });
  }

  // 4. Suspicious keywords
  const found = SUSPICIOUS_KEYWORDS.filter(k => url.includes(k));
  if (found.length >= 3) {
    add(`${found.length} suspicious keywords`, 25, {
      type: 'danger', title: 'Multiple Alarm Keywords',
      desc: `Found: "${found.slice(0,5).join('", "')}" — classic social engineering vocabulary.`
    });
  } else if (found.length > 0) {
    add(`Keyword match (${found.length})`, found.length * 6, {
      type: 'warning', title: 'Suspicious Keywords',
      desc: `Found: ${found.join(', ')}`
    });
  }

  // 5. Subdomains
  const dots = (host.match(/\./g) || []).length;
  if (dots >= 4) {
    add(`Deep subdomains (${dots} levels)`, 22, {
      type: 'danger', title: 'Deep Subdomain Nesting',
      desc: `${dots} levels of subdomains — the real domain is buried to deceive users.`
    });
  } else if (dots === 3) {
    add('3 subdomains', 10, {
      type: 'warning', title: 'Extra Subdomains',
      desc: 'Unusual nesting. Verify the root domain carefully.'
    });
  }

  // 6. Suspicious TLD
  const tld = '.' + host.split('.').pop();
  if (SUSPICIOUS_TLDS.has(tld)) {
    add(`Suspicious TLD (${tld})`, 15, {
      type: 'warning', title: 'Risky TLD',
      desc: `"${tld}" is commonly used for free/disposable phishing domains.`
    });
  }

  // 7. Brand impersonation
  const hit = HOMOGLYPHS.find(([fake]) => host.includes(fake));
  if (hit) {
    add('Brand impersonation', 32, {
      type: 'danger', title: 'Brand Impersonation',
      desc: `Domain mimics "${hit[1]}" using character substitution (${hit[0]}).`
    });
  }

  // 8. @ symbol
  if (raw.includes('@')) {
    add('@ symbol in URL', 22, {
      type: 'danger', title: '@ Redirect Trick',
      desc: '@ causes browsers to ignore everything before it — used to fake trusted URLs.'
    });
  }

  // 9. Hyphens
  const hyphens = (host.match(/-/g) || []).length;
  if (hyphens > 3) {
    add(`Excess hyphens (${hyphens})`, 10, {
      type: 'warning', title: 'Many Hyphens',
      desc: `${hyphens} hyphens in domain — common in fake brand sites.`
    });
  }

  // 10. Query params
  const qParams = query ? query.split('&').length : 0;
  if (qParams > 5) {
    add(`Many query params (${qParams})`, 8, {
      type: 'warning', title: 'Excessive Parameters',
      desc: `${qParams} query parameters — may be tracking or obfuscation.`
    });
  }

  // 11. Path obfuscation
  if (path.includes('//')) {
    add('Path obfuscation', 8, {
      type: 'warning', title: 'Path Obfuscation',
      desc: 'Double slashes in path — used to confuse URL parsers.'
    });
  }

  // 12. Trusted domain whitelist (reduces score)
  const rootDomain = host.split('.').slice(-2).join('.');
  if (TRUSTED_DOMAINS.has(rootDomain)) {
    add('Trusted domain', -35, {
      type: 'safe', title: 'Trusted Domain',
      desc: `${rootDomain} matches a major verified provider.`
    });
  }

  score = Math.min(100, Math.max(0, Math.round(score)));

  let verdict, severity;
  if (score < 30) { verdict = 'Safe'; severity = 'safe'; }
  else if (score < 65) { verdict = 'Suspicious'; severity = 'warning'; }
  else { verdict = 'Dangerous'; severity = 'danger'; }

  return {
    score, verdict, severity, flags, scoreLog,
    meta: { host, protocol, path, query, tld, subdomainCount: dots }
  };
}

module.exports = { analyzeRules, parseURL };

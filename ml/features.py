"""
Feature extraction for phishing URL detection.
These 20 features are based on the UCI Phishing Dataset + research papers.
"""

import re
import tldextract
from urllib.parse import urlparse, parse_qs


SUSPICIOUS_KEYWORDS = [
    'verify', 'secure', 'update', 'login', 'bank', 'paypal', 'account',
    'password', 'confirm', 'free', 'prize', 'win', 'urgent', 'alert',
    'suspended', 'billing', 'invoice', 'support', 'signin', 'validate'
]

SUSPICIOUS_TLDS = {
    'tk', 'ml', 'ga', 'cf', 'gq', 'xyz', 'top', 'click',
    'loan', 'work', 'party', 'review', 'bid', 'download', 'stream'
}

SHORTENERS = {
    'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly',
    'is.gd', 'buff.ly', 'adf.ly', 'bit.do'
}


def extract_features(url: str) -> dict:
    """
    Extract 20 numerical features from a URL.
    Returns dict with feature names and values.
    All values are 0 or 1 (binary) or numerical counts.
    """
    url = url.strip()
    url_lower = url.lower()

    try:
        parsed = urlparse(url)
        ext = tldextract.extract(url)
        host = parsed.netloc or ''
        path = parsed.path or ''
        query = parsed.query or ''
        params = parse_qs(query)
    except Exception:
        return _zero_features()

    features = {}

    # ── Structural features ────────────────────────────
    # 1. URL length
    features['url_length'] = len(url)

    # 2. Has HTTPS
    features['has_https'] = 1 if parsed.scheme == 'https' else 0

    # 3. Has IP address as host
    features['has_ip'] = 1 if re.match(r'^(\d{1,3}\.){3}\d{1,3}$', host) else 0

    # 4. Number of dots in host
    features['dot_count'] = host.count('.')

    # 5. Number of hyphens in host
    features['hyphen_count'] = host.count('-')

    # 6. Subdomain depth
    features['subdomain_depth'] = len(ext.subdomain.split('.')) if ext.subdomain else 0

    # 7. Has @ symbol
    features['has_at'] = 1 if '@' in url else 0

    # 8. Has double slash in path
    features['has_double_slash'] = 1 if '//' in path else 0

    # 9. Path depth (number of / segments)
    features['path_depth'] = len([p for p in path.split('/') if p])

    # 10. Number of query parameters
    features['query_param_count'] = len(params)

    # ── Keyword features ───────────────────────────────
    # 11. Suspicious keyword count
    features['suspicious_keyword_count'] = sum(1 for k in SUSPICIOUS_KEYWORDS if k in url_lower)

    # 12. Has brand keyword (paypal, amazon, etc.)
    brand_keywords = ['paypal', 'amazon', 'google', 'microsoft', 'apple', 'facebook', 'netflix', 'bank']
    features['has_brand_keyword'] = 1 if any(b in url_lower for b in brand_keywords) else 0

    # ── Domain features ────────────────────────────────
    # 13. TLD is suspicious
    features['suspicious_tld'] = 1 if ext.suffix in SUSPICIOUS_TLDS else 0

    # 14. Domain length
    features['domain_length'] = len(ext.domain) if ext.domain else 0

    # 15. Is URL shortener
    features['is_shortener'] = 1 if f"{ext.domain}.{ext.suffix}" in SHORTENERS else 0

    # 16. Has port in URL
    features['has_port'] = 1 if parsed.port else 0

    # 17. Digit ratio in domain (lots of numbers = suspicious)
    domain_str = ext.domain or ''
    features['digit_ratio'] = round(sum(c.isdigit() for c in domain_str) / max(len(domain_str), 1), 3)

    # ── Entropy / obfuscation ──────────────────────────
    # 18. URL entropy (high entropy = random-looking = suspicious)
    features['url_entropy'] = round(_entropy(url), 3)

    # 19. Hex encoding present (%XX)
    features['has_hex_encoding'] = 1 if re.search(r'%[0-9a-fA-F]{2}', url) else 0

    # 20. Special char ratio
    special = sum(1 for c in url if c in '!#$&\'()*+,/:;=?@[]~')
    features['special_char_ratio'] = round(special / max(len(url), 1), 3)

    return features


def features_to_vector(features: dict) -> list:
    """Convert features dict to ordered list for ML model."""
    FEATURE_ORDER = [
        'url_length', 'has_https', 'has_ip', 'dot_count', 'hyphen_count',
        'subdomain_depth', 'has_at', 'has_double_slash', 'path_depth',
        'query_param_count', 'suspicious_keyword_count', 'has_brand_keyword',
        'suspicious_tld', 'domain_length', 'is_shortener', 'has_port',
        'digit_ratio', 'url_entropy', 'has_hex_encoding', 'special_char_ratio'
    ]
    return [features.get(f, 0) for f in FEATURE_ORDER]


def _entropy(s: str) -> float:
    import math
    if not s:
        return 0.0
    freq = {}
    for c in s:
        freq[c] = freq.get(c, 0) + 1
    n = len(s)
    return -sum((count/n) * math.log2(count/n) for count in freq.values())


def _zero_features() -> dict:
    return {k: 0 for k in [
        'url_length', 'has_https', 'has_ip', 'dot_count', 'hyphen_count',
        'subdomain_depth', 'has_at', 'has_double_slash', 'path_depth',
        'query_param_count', 'suspicious_keyword_count', 'has_brand_keyword',
        'suspicious_tld', 'domain_length', 'is_shortener', 'has_port',
        'digit_ratio', 'url_entropy', 'has_hex_encoding', 'special_char_ratio'
    ]}

// Q-SHIELD Heuristic Analysis Module
// Provides detailed, categorized threat breakdown with color-coded severity

export interface HeuristicFlag {
  id: string;
  label: string;
  description: string;
  severity: 'high' | 'warning' | 'clean';
  category: string;
}

// Known legitimate brands for typosquatting detection
const BRAND_DOMAINS: Record<string, string[]> = {
  google: ['google.com', 'gmail.com', 'youtube.com'],
  microsoft: ['microsoft.com', 'outlook.com', 'live.com', 'office.com'],
  apple: ['apple.com', 'icloud.com'],
  amazon: ['amazon.com', 'aws.amazon.com'],
  paypal: ['paypal.com'],
  facebook: ['facebook.com', 'fb.com'],
  instagram: ['instagram.com'],
  twitter: ['twitter.com', 'x.com'],
  netflix: ['netflix.com'],
  bank: ['chase.com', 'wellsfargo.com', 'bankofamerica.com'],
};

const URL_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
  'buff.ly', 'adf.ly', 'rb.gy', 'shorturl.at', 'cutt.ly', 'v.gd',
  'j.mp', 'tr.im', 'short.to', 'wp.me', 'lnkd.in', 'db.tt',
];

const SUSPICIOUS_TLDS = [
  '.xyz', '.top', '.work', '.click', '.link', '.info',
  '.online', '.site', '.website', '.space', '.tech',
  '.gq', '.ml', '.cf', '.ga', '.tk', '.buzz', '.rest',
];

const PHISHING_KEYWORDS = [
  'login', 'signin', 'verify', 'secure', 'account', 'update',
  'confirm', 'suspended', 'alert', 'urgent', 'free', 'winner',
  'prize', 'claim', 'bank', 'payment', 'password', 'credential',
];

/**
 * Compute Levenshtein distance for typosquatting detection
 */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

/**
 * Run full heuristic analysis on a URL, returning categorized flags
 */
export function runHeuristicAnalysis(url: string, expandedUrl?: string | null): HeuristicFlag[] {
  const flags: HeuristicFlag[] = [];
  const urlToCheck = expandedUrl || url;

  try {
    const urlObj = new URL(urlToCheck);
    const hostname = urlObj.hostname.toLowerCase();
    const fullPath = urlObj.pathname + urlObj.search + urlObj.hash;

    // 1. Suspicious TLD
    const matchedTld = SUSPICIOUS_TLDS.find(tld => hostname.endsWith(tld));
    if (matchedTld) {
      flags.push({
        id: 'suspicious-tld',
        label: 'Suspicious TLD',
        description: `Domain uses high-risk TLD "${matchedTld}" commonly associated with phishing campaigns.`,
        severity: 'warning',
        category: 'Domain',
      });
    }

    // 2. URL Shortener
    const isShortener = URL_SHORTENERS.some(s => hostname === s || hostname.endsWith('.' + s));
    if (isShortener) {
      flags.push({
        id: 'url-shortener',
        label: expandedUrl ? 'URL Shortener Detected & Expanded' : 'URL Shortener Detected',
        description: expandedUrl
          ? `Shortened URL resolved to: ${expandedUrl}`
          : 'Shortened URL hides the true destination. Could not expand.',
        severity: expandedUrl ? 'warning' : 'high',
        category: 'Redirect',
      });
    }

    // 3. Typosquatting
    const baseDomain = hostname.replace(/^www\./, '').split('.').slice(0, -1).join('.');
    for (const [brand, domains] of Object.entries(BRAND_DOMAINS)) {
      for (const legit of domains) {
        const legitBase = legit.split('.')[0];
        if (baseDomain !== legitBase && baseDomain.includes(brand.substring(0, 4))) {
          const dist = levenshtein(baseDomain, legitBase);
          if (dist > 0 && dist <= 3) {
            flags.push({
              id: 'typosquatting',
              label: 'Possible Typosquatting',
              description: `Domain "${hostname}" closely resembles "${legit}" (edit distance: ${dist}). Likely impersonation attempt.`,
              severity: 'high',
              category: 'Domain',
            });
            break;
          }
        }
      }
    }

    // 4. Hidden Redirects (multiple path segments with redirect-like params)
    if (fullPath.includes('redirect') || fullPath.includes('url=') || fullPath.includes('goto=') || fullPath.includes('next=') || fullPath.includes('redir=')) {
      flags.push({
        id: 'hidden-redirect',
        label: 'Hidden Redirects',
        description: 'URL contains redirect parameters that may forward to a different destination after initial load.',
        severity: 'high',
        category: 'Redirect',
      });
    }

    // 5. IP address instead of domain
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      flags.push({
        id: 'ip-address',
        label: 'Raw IP Address',
        description: 'URL uses a numeric IP address instead of a domain name, a common phishing tactic to evade blocklists.',
        severity: 'high',
        category: 'Domain',
      });
    }

    // 6. Excessive subdomains
    const subCount = hostname.split('.').length - 2;
    if (subCount > 2) {
      flags.push({
        id: 'excessive-subdomains',
        label: 'Excessive Subdomains',
        description: `${subCount} subdomain levels detected. Attackers use deep subdomains to mimic legitimate URLs.`,
        severity: 'warning',
        category: 'Domain',
      });
    }

    // 7. No HTTPS
    if (urlObj.protocol === 'http:') {
      flags.push({
        id: 'no-https',
        label: 'Insecure Connection',
        description: 'URL uses unencrypted HTTP. Any data sent can be intercepted by attackers.',
        severity: 'warning',
        category: 'Security',
      });
    }

    // 8. Non-standard port
    if (urlObj.port && !['80', '443', ''].includes(urlObj.port)) {
      flags.push({
        id: 'non-standard-port',
        label: 'Non-Standard Port',
        description: `Port ${urlObj.port} is unusual for web traffic and may indicate a rogue server.`,
        severity: 'warning',
        category: 'Network',
      });
    }

    // 9. Punycode / homograph
    if (hostname.startsWith('xn--')) {
      flags.push({
        id: 'punycode',
        label: 'Homograph Attack',
        description: 'Domain uses internationalized characters (Punycode) that can visually mimic legitimate domains.',
        severity: 'high',
        category: 'Domain',
      });
    }

    // 10. Phishing keywords in path
    const kwMatches = PHISHING_KEYWORDS.filter(kw => fullPath.toLowerCase().includes(kw));
    if (kwMatches.length > 0) {
      flags.push({
        id: 'phishing-keywords',
        label: 'Phishing Keywords',
        description: `Path contains suspicious terms: ${kwMatches.join(', ')}. Common in credential-harvesting pages.`,
        severity: kwMatches.length >= 2 ? 'high' : 'warning',
        category: 'Content',
      });
    }

    // 11. Data URI or javascript
    if (urlToCheck.startsWith('data:') || urlToCheck.startsWith('javascript:')) {
      flags.push({
        id: 'dangerous-scheme',
        label: 'Dangerous URI Scheme',
        description: 'URL uses a data: or javascript: scheme which can execute arbitrary code.',
        severity: 'high',
        category: 'Security',
      });
    }

    // If nothing found, add a clean flag
    if (flags.length === 0) {
      flags.push({
        id: 'clean',
        label: 'No Threats Detected',
        description: 'Heuristic analysis found no suspicious indicators in this URL.',
        severity: 'clean',
        category: 'Overall',
      });
    }

  } catch {
    flags.push({
      id: 'invalid-url',
      label: 'Invalid URL Format',
      description: 'The URL could not be parsed. This may indicate a malformed or obfuscated link.',
      severity: 'high',
      category: 'Format',
    });
  }

  return flags;
}

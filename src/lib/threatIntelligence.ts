// Q-SHIELD Threat Intelligence Module
// This module simulates real-world security checks that would be performed
// against threat intelligence databases like VirusTotal, Google Safe Browsing, etc.

// Known URL shortener services that could mask malicious links
const URL_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
  'buff.ly', 'adf.ly', 'j.mp', 'tr.im', 'cli.gs', 'short.to',
  'budurl.com', 'ping.fm', 'post.ly', 'just.as', 'bkite.com',
  'snipr.com', 'fic.kr', 'loopt.us', 'doiop.com', 'short.ie',
  'kl.am', 'wp.me', 'rubyurl.com', 'om.ly', 'to.ly', 'bit.do',
  'lnkd.in', 'db.tt', 'qr.ae', 'cur.lv', 'ity.im', 'q.gs',
  'po.st', 'bc.vc', 'twitthis.com', 'u.telestr.me', 'v.gd',
  'rb.gy', 'shorturl.at'
];

// Simulated malicious domain patterns
// In production, these would be fetched from threat intelligence APIs
const MALICIOUS_PATTERNS = [
  'login-secure', 'account-verify', 'update-payment',
  'confirm-identity', 'security-alert', 'suspended-account',
  'verify-now', 'urgent-action', 'free-prize', 'winner-claim',
  'bank-update', 'paypal-secure', 'amazon-verify', 'microsoft-login',
  'google-verify', 'apple-confirm', 'facebook-secure', 'instagram-verify'
];

// Suspicious TLDs often used in phishing
const SUSPICIOUS_TLDS = [
  '.xyz', '.top', '.work', '.click', '.link', '.info',
  '.online', '.site', '.website', '.space', '.tech',
  '.gq', '.ml', '.cf', '.ga', '.tk', '.buzz'
];

export interface ThreatAnalysis {
  isSafe: boolean;
  threatLevel: 'safe' | 'suspicious' | 'malicious';
  threatScore: number; // 0-100, higher = more dangerous
  threats: string[];
  recommendations: string[];
  originalUrl: string;
  expandedUrl: string | null;
  domain: string;
  isShortened: boolean;
  scanDuration: number;
}

/**
 * SECURITY LOGIC: URL Shortener Detection
 * Shortened URLs are a common phishing vector because they hide the true destination.
 * This function checks if the URL uses a known shortener service.
 */
export function isUrlShortened(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return URL_SHORTENERS.some(shortener => 
      hostname === shortener || hostname.endsWith('.' + shortener)
    );
  } catch {
    return false;
  }
}

/**
 * SECURITY LOGIC: URL Expansion Simulation
 * In production, this would make HTTP HEAD requests to follow redirects
 * and reveal the true destination URL.
 */
export async function expandUrl(url: string): Promise<string> {
  // Simulate network delay for URL expansion
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (isUrlShortened(url)) {
    // Simulate expanding to a revealed URL
    // In production: fetch with redirect: 'manual' and follow Location headers
    const simulatedDestinations = [
      'https://legitimate-bank.com/account',
      'https://phishing-site.xyz/login-secure-bank',
      'https://malware-download.click/free-software',
      'https://genuine-shop.com/products',
      'https://secure-paypal-verify.tk/confirm'
    ];
    return simulatedDestinations[Math.floor(Math.random() * simulatedDestinations.length)];
  }
  
  return url;
}

/**
 * SECURITY LOGIC: Domain Analysis
 * Extracts and analyzes the domain for suspicious characteristics
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * SECURITY LOGIC: Phishing Pattern Detection
 * Analyzes URL for common phishing indicators:
 * 1. Suspicious keywords in path/subdomain
 * 2. Lookalike domains (homograph attacks)
 * 3. Suspicious TLDs
 * 4. IP addresses instead of domains
 * 5. Excessive subdomains
 */
function analyzeUrlPatterns(url: string): { threats: string[]; score: number } {
  const threats: string[] = [];
  let score = 0;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const fullUrl = url.toLowerCase();
    
    // Check for suspicious keywords in URL
    MALICIOUS_PATTERNS.forEach(pattern => {
      if (fullUrl.includes(pattern)) {
        threats.push(`Suspicious keyword detected: "${pattern}"`);
        score += 25;
      }
    });
    
    // Check for suspicious TLDs
    SUSPICIOUS_TLDS.forEach(tld => {
      if (hostname.endsWith(tld)) {
        threats.push(`High-risk TLD detected: "${tld}"`);
        score += 20;
      }
    });
    
    // Check for IP address as hostname (common in phishing)
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      threats.push('URL uses IP address instead of domain name');
      score += 30;
    }
    
    // Check for excessive subdomains (e.g., secure.login.bank.attacker.com)
    const subdomainCount = hostname.split('.').length - 2;
    if (subdomainCount > 2) {
      threats.push(`Excessive subdomains detected (${subdomainCount})`);
      score += 15;
    }
    
    // Check for HTTP (not HTTPS)
    if (urlObj.protocol === 'http:') {
      threats.push('Insecure HTTP connection (no encryption)');
      score += 10;
    }
    
    // Check for suspicious port
    if (urlObj.port && !['80', '443', ''].includes(urlObj.port)) {
      threats.push(`Non-standard port detected: ${urlObj.port}`);
      score += 15;
    }
    
    // Check for punycode (potential homograph attack)
    if (hostname.startsWith('xn--')) {
      threats.push('Punycode domain detected (possible homograph attack)');
      score += 35;
    }
    
  } catch {
    threats.push('Invalid URL format');
    score += 50;
  }
  
  return { threats, score: Math.min(score, 100) };
}

/**
 * SECURITY LOGIC: VirusTotal Simulation
 * In production, this would query the VirusTotal API to check:
 * - Domain reputation
 * - Historical malware associations
 * - Community votes
 * - Detection by multiple antivirus engines
 */
async function simulateVirusTotalCheck(domain: string): Promise<{
  malicious: number;
  suspicious: number;
  clean: number;
  timeout: number;
}> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Simulate scan results
  // In production: POST to https://www.virustotal.com/api/v3/urls
  const isMaliciousDomain = MALICIOUS_PATTERNS.some(p => domain.includes(p)) ||
                           SUSPICIOUS_TLDS.some(tld => domain.endsWith(tld));
  
  if (isMaliciousDomain) {
    return {
      malicious: Math.floor(Math.random() * 30) + 40, // 40-70 engines
      suspicious: Math.floor(Math.random() * 10) + 5,
      clean: Math.floor(Math.random() * 20) + 10,
      timeout: Math.floor(Math.random() * 5)
    };
  }
  
  return {
    malicious: 0,
    suspicious: Math.floor(Math.random() * 3),
    clean: Math.floor(Math.random() * 30) + 60,
    timeout: Math.floor(Math.random() * 5)
  };
}

/**
 * MAIN SECURITY FUNCTION: Comprehensive Threat Analysis
 * This is the core interception logic that:
 * 1. Captures the URL from QR code
 * 2. Checks if URL is shortened and expands it
 * 3. Analyzes URL patterns for phishing indicators
 * 4. Queries threat intelligence (simulated)
 * 5. Provides a risk assessment and recommendations
 */
export async function analyzeThreat(url: string): Promise<ThreatAnalysis> {
  const startTime = Date.now();
  const threats: string[] = [];
  let totalScore = 0;
  
  // Step 1: Check if URL is shortened
  const isShortened = isUrlShortened(url);
  if (isShortened) {
    threats.push('Shortened URL detected - true destination hidden');
    totalScore += 15;
  }
  
  // Step 2: Expand shortened URL to reveal true destination
  const expandedUrl = isShortened ? await expandUrl(url) : null;
  const urlToAnalyze = expandedUrl || url;
  
  // Step 3: Extract domain for analysis
  const domain = extractDomain(urlToAnalyze);
  
  // Step 4: Analyze URL patterns
  const patternAnalysis = analyzeUrlPatterns(urlToAnalyze);
  threats.push(...patternAnalysis.threats);
  totalScore += patternAnalysis.score;
  
  // Step 5: Query threat intelligence (simulated VirusTotal)
  const vtResults = await simulateVirusTotalCheck(domain);
  
  if (vtResults.malicious > 0) {
    threats.push(`${vtResults.malicious} security vendors flagged this URL as malicious`);
    totalScore += Math.min(vtResults.malicious * 2, 50);
  }
  
  if (vtResults.suspicious > 0) {
    threats.push(`${vtResults.suspicious} security vendors marked this as suspicious`);
    totalScore += vtResults.suspicious * 3;
  }
  
  // Cap score at 100
  totalScore = Math.min(totalScore, 100);
  
  // Determine threat level
  let threatLevel: 'safe' | 'suspicious' | 'malicious';
  if (totalScore >= 50) {
    threatLevel = 'malicious';
  } else if (totalScore >= 20) {
    threatLevel = 'suspicious';
  } else {
    threatLevel = 'safe';
  }
  
  // Generate recommendations based on findings
  const recommendations: string[] = [];
  
  if (threatLevel === 'malicious') {
    recommendations.push('DO NOT open this link');
    recommendations.push('Report this QR code to security authorities');
    recommendations.push('If you shared any information, change passwords immediately');
  } else if (threatLevel === 'suspicious') {
    recommendations.push('Exercise caution before proceeding');
    recommendations.push('Verify the sender of this QR code');
    recommendations.push('Do not enter personal information');
  } else {
    recommendations.push('URL appears safe to visit');
    recommendations.push('Always verify before entering sensitive data');
  }
  
  const scanDuration = Date.now() - startTime;
  
  return {
    isSafe: threatLevel === 'safe',
    threatLevel,
    threatScore: totalScore,
    threats,
    recommendations,
    originalUrl: url,
    expandedUrl,
    domain,
    isShortened,
    scanDuration
  };
}

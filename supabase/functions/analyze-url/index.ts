import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Q-SHIELD backend analysis
// SECURITY LOGIC:
//  1. Static payload inspection (obfuscated JS, embedded credentials, redirect params)
//  2. WHOIS/RDAP domain age check (< 30 days => "Newly Registered Domain" penalty)
//  3. External reputation (VirusTotal / Google Safe Browsing) with strict fallback
// The function NEVER throws to the client: any failure degrades to offline heuristics.

interface Finding {
  id: string;
  label: string;
  description: string;
  severity: 'high' | 'warning' | 'clean';
  category: string;
  penalty: number;
}

const OBFUSCATION_PATTERNS: Array<[RegExp, string]> = [
  [/javascript:/i, 'Inline javascript: scheme'],
  [/vbscript:/i, 'Inline vbscript: scheme'],
  [/data:text\/html/i, 'Inline data:text/html payload'],
  [/eval\s*\(/i, 'eval() call'],
  [/atob\s*\(/i, 'base64 decoding (atob)'],
  [/document\.(cookie|write)/i, 'DOM/cookie access'],
  [/fromCharCode/i, 'String.fromCharCode obfuscation'],
  [/%3cscript/i, 'Encoded <script> tag'],
];

const REDIRECT_PARAMS = ['redirect', 'redir', 'url', 'goto', 'next', 'return', 'continue', 'dest', 'target'];

function inspectPayload(raw: string): Finding[] {
  const findings: Finding[] = [];

  for (const [re, label] of OBFUSCATION_PATTERNS) {
    if (re.test(raw)) {
      findings.push({
        id: 'obfuscated-payload',
        label: 'Obfuscated Script Payload',
        description: `QR payload contains executable content: ${label}.`,
        severity: 'high',
        category: 'Payload',
        penalty: 60,
      });
      break;
    }
  }

  // Embedded credentials: http://user:pass@domain.com
  if (/^[a-z][a-z0-9+.-]*:\/\/[^/@\s]+:[^/@\s]*@/i.test(raw)) {
    findings.push({
      id: 'embedded-credentials',
      label: 'Embedded Credentials',
      description: 'URL embeds a username/password before the host. Classic tactic to disguise the real domain.',
      severity: 'high',
      category: 'Payload',
      penalty: 45,
    });
  }

  try {
    const u = new URL(raw);
    for (const [key, value] of u.searchParams.entries()) {
      if (REDIRECT_PARAMS.includes(key.toLowerCase()) && value.length > 0) {
        findings.push({
          id: 'suspicious-redirect',
          label: 'Suspicious Redirect Parameter',
          description: `Parameter "${key}" forwards to "${value}" after load.`,
          severity: 'high',
          category: 'Redirect',
          penalty: 30,
        });
        break;
      }
    }
    if (/%2f%2f|%3a%2f%2f/i.test(u.search)) {
      findings.push({
        id: 'encoded-redirect',
        label: 'Encoded Redirect Target',
        description: 'Query string contains a URL-encoded address, often used to smuggle a second destination.',
        severity: 'warning',
        category: 'Redirect',
        penalty: 15,
      });
    }
  } catch {
    // non-URL payload handled by caller
  }

  return findings;
}

async function checkDomainAge(domain: string): Promise<{
  available: boolean;
  registeredAt: string | null;
  ageDays: number | null;
  finding: Finding | null;
}> {
  const empty = { available: false, registeredAt: null, ageDays: null, finding: null };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/rdap+json' },
    });
    clearTimeout(timer);
    if (!res.ok) return empty;
    const data = await res.json();
    const events: Array<{ eventAction?: string; eventDate?: string }> = data?.events ?? [];
    const reg = events.find((e) => e.eventAction === 'registration')?.eventDate;
    if (!reg) return empty;

    const ageDays = Math.floor((Date.now() - new Date(reg).getTime()) / 86_400_000);
    let finding: Finding | null = null;
    if (ageDays < 30) {
      finding = {
        id: 'newly-registered-domain',
        label: 'Newly Registered Domain',
        description: `Domain was registered ${ageDays} day(s) ago. Phishing infrastructure is typically days old.`,
        severity: 'high',
        category: 'Domain',
        penalty: 35,
      };
    } else if (ageDays < 180) {
      finding = {
        id: 'young-domain',
        label: 'Young Domain',
        description: `Domain is only ${ageDays} days old.`,
        severity: 'warning',
        category: 'Domain',
        penalty: 10,
      };
    }
    return { available: true, registeredAt: reg, ageDays, finding };
  } catch {
    return empty;
  }
}

async function checkVirusTotal(url: string): Promise<{ available: boolean; malicious: number; suspicious: number }> {
  const key = Deno.env.get('VIRUSTOTAL_API_KEY');
  if (!key) return { available: false, malicious: 0, suspicious: 0 };
  try {
    const id = btoa(url).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(`https://www.virustotal.com/api/v3/urls/${id}`, {
      headers: { 'x-apikey': key },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { available: false, malicious: 0, suspicious: 0 };
    const data = await res.json();
    const stats = data?.data?.attributes?.last_analysis_stats ?? {};
    return {
      available: true,
      malicious: Number(stats.malicious ?? 0),
      suspicious: Number(stats.suspicious ?? 0),
    };
  } catch {
    return { available: false, malicious: 0, suspicious: 0 };
  }
}

async function checkSafeBrowsing(url: string): Promise<{ available: boolean; hit: boolean; threatType?: string }> {
  const key = Deno.env.get('GOOGLE_SAFE_BROWSING_API_KEY');
  if (!key) return { available: false, hit: false };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        client: { clientId: 'q-shield', clientVersion: '1.0.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return { available: false, hit: false };
    const data = await res.json();
    const match = data?.matches?.[0];
    return { available: true, hit: Boolean(match), threatType: match?.threatType };
  } catch {
    return { available: false, hit: false };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const url = typeof body?.url === 'string' ? body.url.trim() : '';
    if (!url || url.length > 2048) {
      return new Response(JSON.stringify({ error: 'A valid "url" string (max 2048 chars) is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const findings = inspectPayload(url);

    let domain = '';
    try {
      domain = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      findings.push({
        id: 'unparseable-payload',
        label: 'Unparseable Payload',
        description: 'The QR payload is not a well-formed URL and may be obfuscated.',
        severity: 'high',
        category: 'Payload',
        penalty: 40,
      });
    }

    const [age, vt, gsb] = await Promise.all([
      domain ? checkDomainAge(domain) : Promise.resolve({ available: false, registeredAt: null, ageDays: null, finding: null }),
      checkVirusTotal(url),
      checkSafeBrowsing(url),
    ]);

    if (age.finding) findings.push(age.finding);

    if (vt.available && vt.malicious > 0) {
      findings.push({
        id: 'virustotal-malicious',
        label: 'Flagged by Security Vendors',
        description: `${vt.malicious} VirusTotal engine(s) flagged this URL as malicious.`,
        severity: 'high',
        category: 'Reputation',
        penalty: Math.min(vt.malicious * 10, 60),
      });
    }
    if (gsb.available && gsb.hit) {
      findings.push({
        id: 'safe-browsing-hit',
        label: 'Google Safe Browsing Hit',
        description: `Listed by Google Safe Browsing as ${gsb.threatType}.`,
        severity: 'high',
        category: 'Reputation',
        penalty: 60,
      });
    }

    const penalty = Math.min(findings.reduce((sum, f) => sum + f.penalty, 0), 100);

    return new Response(
      JSON.stringify({
        ok: true,
        domain,
        findings,
        penalty,
        domainAge: { available: age.available, registeredAt: age.registeredAt, ageDays: age.ageDays },
        intel: {
          virusTotal: vt,
          safeBrowsing: gsb,
          mode: vt.available || gsb.available ? 'live' : 'offline-fallback',
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('analyze-url failed:', error);
    // STRICT FALLBACK: never break the scan flow.
    return new Response(
      JSON.stringify({ ok: false, findings: [], penalty: 0, intel: { mode: 'offline-fallback' } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

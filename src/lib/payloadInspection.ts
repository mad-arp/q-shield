// Q-SHIELD Static Payload Inspection (client-side, offline capable)
// SECURITY LOGIC: runs BEFORE any network call so a hostile payload is
// classified even with no connectivity and no API keys.
import type { HeuristicFlag } from './heuristicAnalysis';

export interface PayloadFinding extends HeuristicFlag {
  penalty: number;
}

const OBFUSCATION_PATTERNS: Array<[RegExp, string]> = [
  [/^\s*javascript:/i, 'javascript: scheme'],
  [/^\s*vbscript:/i, 'vbscript: scheme'],
  [/^\s*data:text\/html/i, 'data:text/html payload'],
  [/eval\s*\(/i, 'eval() call'],
  [/atob\s*\(/i, 'base64 decoding (atob)'],
  [/document\.(cookie|write)/i, 'DOM/cookie access'],
  [/fromCharCode/i, 'String.fromCharCode obfuscation'],
  [/%3cscript/i, 'encoded <script> tag'],
];

const REDIRECT_PARAMS = ['redirect', 'redir', 'url', 'goto', 'next', 'return', 'continue', 'dest', 'target'];

/**
 * Inspect the raw QR payload string for executable content,
 * embedded credentials and smuggled redirect destinations.
 */
export function inspectPayload(raw: string): PayloadFinding[] {
  const findings: PayloadFinding[] = [];
  if (!raw) return findings;

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

  if (/^[a-z][a-z0-9+.-]*:\/\/[^/@\s]+:[^/@\s]*@/i.test(raw)) {
    findings.push({
      id: 'embedded-credentials',
      label: 'Embedded Credentials',
      description: 'URL embeds a username/password before the host — used to disguise the real domain.',
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
          description: `Parameter "${key}" forwards to "${value}" after the page loads.`,
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
    findings.push({
      id: 'unparseable-payload',
      label: 'Unparseable Payload',
      description: 'The QR payload is not a well-formed URL and may be deliberately obfuscated.',
      severity: 'high',
      category: 'Payload',
      penalty: 40,
    });
  }

  return findings;
}

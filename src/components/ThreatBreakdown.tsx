import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { HeuristicFlag } from '@/lib/heuristicAnalysis';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ThreatBreakdownProps {
  flags: HeuristicFlag[];
}

const severityConfig = {
  high: {
    icon: ShieldAlert,
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    text: 'text-destructive',
    tag: 'bg-destructive text-destructive-foreground',
    label: 'HIGH THREAT',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    text: 'text-warning',
    tag: 'bg-warning text-warning-foreground',
    label: 'WARNING',
  },
  clean: {
    icon: ShieldCheck,
    bg: 'bg-safe/10',
    border: 'border-safe/30',
    text: 'text-safe',
    tag: 'bg-safe text-safe-foreground',
    label: 'CLEAN',
  },
};

/** Educational explanations for each heuristic flag type */
const educationalTooltips: Record<string, string> = {
  'suspicious-tld':
    'Top-Level Domains (TLDs) like .xyz, .tk, or .click are cheap or free to register, making them popular with attackers who create disposable phishing sites.',
  'url-shortener':
    'URL shorteners (bit.ly, tinyurl, etc.) hide the real destination. Attackers use them to bypass email filters and trick users into clicking malicious links.',
  'typosquatting':
    'Typosquatting is when attackers register domains that look like popular brands (e.g., "g00gle" instead of "google") to steal credentials from users who don\'t notice the subtle difference.',
  'hidden-redirect':
    'Hidden redirects use URL parameters like "?redirect=" to bounce you through a legitimate-looking page before landing on a malicious one — often used to bypass security filters.',
  'ip-address':
    'Legitimate websites use domain names (e.g., google.com), not raw IP addresses. Phishing sites often use IPs to avoid domain-based blocklists.',
  'excessive-subdomains':
    'Attackers add fake subdomains like "secure.login.bank.evil.com" to make URLs appear trustworthy. Only the last two parts (evil.com) are the real domain.',
  'no-https':
    'HTTP sends data unencrypted — anyone on the same network can intercept passwords and personal info. Legitimate sites use HTTPS (padlock icon).',
  'non-standard-port':
    'Web traffic normally uses port 80 (HTTP) or 443 (HTTPS). Unusual ports may indicate a rogue server set up to steal data.',
  'punycode':
    'Homograph attacks use Unicode characters that look identical to Latin letters (e.g., Cyrillic "а" vs Latin "a") to create visually identical but different domain names.',
  'phishing-keywords':
    'Words like "login", "verify", "suspended", and "urgent" are psychological triggers attackers use to create panic and rush victims into entering credentials.',
  'dangerous-scheme':
    'data: and javascript: URIs can execute code directly in your browser without loading a webpage, potentially stealing cookies or session tokens.',
  'clean':
    'No known threat indicators were found. The URL passed all heuristic checks, but always exercise caution with unfamiliar sites.',
  'invalid-url':
    'The URL could not be parsed by standard parsers. This may indicate intentional obfuscation to bypass security tools.',
};

const ThreatBreakdown = ({ flags }: ThreatBreakdownProps) => {
  if (!flags.length) return null;

  return (
    <div className="w-full max-w-md">
      <h3 className="font-display text-sm text-primary mb-3 tracking-wide">
        HEURISTIC BREAKDOWN ({flags.length})
      </h3>
      <div className="space-y-2">
        {flags.map((flag, index) => {
          const config = severityConfig[flag.severity];
          const Icon = config.icon;
          const tooltip = educationalTooltips[flag.id];

          return (
            <motion.div
              key={flag.id + index}
              className={`${config.bg} border ${config.border} rounded-lg p-3`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <div className="flex items-start gap-2">
                <Icon className={`w-4 h-4 ${config.text} mt-0.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${config.tag}`}>
                      {config.label}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      [{flag.category}]
                    </span>
                    {tooltip && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted/50 hover:bg-muted transition-colors">
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-[280px] bg-card border-border text-foreground text-xs leading-relaxed p-3 font-mono"
                        >
                          <p className="font-semibold text-primary mb-1">What is this?</p>
                          <p className="text-muted-foreground">{tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <p className={`text-sm font-mono font-semibold ${config.text} mb-0.5`}>
                    {flag.label}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {flag.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ThreatBreakdown;

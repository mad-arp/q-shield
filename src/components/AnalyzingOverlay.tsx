import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

interface AnalyzingOverlayProps {
  url: string;
  stage: 'expanding' | 'analyzing' | 'checking';
}

const TERMINAL_LINES = [
  '> Initializing Q-SHIELD intercept protocol...',
  '> Establishing secure tunnel ████████ OK',
  '> Parsing target URL structure...',
  '> Extracting domain fingerprint...',
  '> Running TLD reputation check...',
  '> Scanning URL path for obfuscation patterns...',
  '> Checking against phishing signature database...',
  '> Analyzing SSL certificate chain...',
  '> Querying threat intelligence feeds...',
  '> Cross-referencing known malicious domains...',
  '> Decrypting redirect chain...',
  '> Evaluating typosquatting probability...',
  '> Computing heuristic threat score...',
  '> Compiling analysis report...',
];

const STAGE_MAP: Record<string, string> = {
  expanding: 'EXPANDING SHORTENED URL',
  analyzing: 'ANALYZING URL PATTERNS',
  checking: 'QUERYING THREAT INTEL DB',
};

const TerminalLine = ({ text, delay }: { text: string; delay: number }) => {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        idx.current += 1;
        setDisplayed(text.slice(0, idx.current));
        if (idx.current >= text.length) clearInterval(interval);
      }, 18);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return (
    <div className="font-mono text-xs text-primary/80 whitespace-nowrap overflow-hidden">
      {displayed}
      {displayed.length < text.length && (
        <motion.span
          className="inline-block w-2 h-3.5 bg-primary ml-0.5 align-middle"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </div>
  );
};

const AnalyzingOverlay = ({ url, stage }: AnalyzingOverlayProps) => {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines(prev => {
        if (prev >= TERMINAL_LINES.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // Radar sweep angle
  const [sweep, setSweep] = useState(0);
  useEffect(() => {
    const raf = setInterval(() => setSweep(s => (s + 3) % 360), 16);
    return () => clearInterval(raf);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background/98 backdrop-blur-md flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Cyber Radar */}
      <div className="relative mb-8 w-40 h-40">
        {/* Radar circles */}
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="absolute rounded-full border border-primary/20"
            style={{
              width: `${i * 33}%`,
              height: `${i * 33}%`,
              top: `${50 - i * 16.5}%`,
              left: `${50 - i * 16.5}%`,
            }}
          />
        ))}
        {/* Cross lines */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/15" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/15" />
        {/* Sweep */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-1/2 h-px origin-left"
          style={{
            background: 'linear-gradient(90deg, hsl(var(--primary)), transparent)',
            rotate: `${sweep}deg`,
            transformOrigin: '0% 50%',
          }}
        />
        {/* Glow behind sweep */}
        <motion.div
          className="absolute top-1/2 left-1/2 origin-left"
          style={{
            width: '50%',
            height: '50%',
            background: `conic-gradient(from ${sweep - 30}deg at 0% 0%, hsl(var(--primary) / 0.15), transparent 30deg)`,
            transformOrigin: '0% 0%',
          }}
        />
        {/* Center shield */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Shield className="w-8 h-8 text-primary" />
          </motion.div>
        </div>
        {/* Random blips */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary"
            style={{
              top: `${30 + i * 18}%`,
              left: `${25 + i * 22}%`,
            }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.7 }}
          />
        ))}
      </div>

      {/* Stage label */}
      <motion.div
        className="flex items-center gap-2 mb-2"
        key={stage}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.span
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
        <span className="font-display text-sm text-primary tracking-widest text-glow">
          {STAGE_MAP[stage]}
        </span>
      </motion.div>

      <p className="text-muted-foreground text-xs font-mono mb-6 max-w-xs text-center truncate px-4">
        {url}
      </p>

      {/* Terminal output */}
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-3 overflow-hidden max-h-56 overflow-y-auto">
        <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-border">
          <span className="w-2 h-2 rounded-full bg-destructive" />
          <span className="w-2 h-2 rounded-full bg-warning" />
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground font-mono ml-2">q-shield://threat-scanner</span>
        </div>
        <div className="space-y-1">
          {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
            <TerminalLine key={i} text={line} delay={0} />
          ))}
          {visibleLines < TERMINAL_LINES.length && (
            <motion.span
              className="inline-block w-2 h-3.5 bg-primary"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyzingOverlay;

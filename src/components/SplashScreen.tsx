import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<'logo' | 'text' | 'exit'>('logo');

  useEffect(() => {
    const logoTimer = setTimeout(() => setPhase('text'), 800);
    const textTimer = setTimeout(() => setPhase('exit'), 2000);
    const exitTimer = setTimeout(() => onComplete(), 2500);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'exit' && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent"
              initial={{ y: '-100%' }}
              animate={{ y: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ height: '200%' }}
            />
          </div>

          {/* Grid background */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />

          {/* Shield Logo */}
          <motion.div
            className="relative"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Outer glow */}
            <motion.div
              className="absolute inset-0 blur-3xl bg-primary/30 rounded-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: [0, 0.5, 0.3] }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />

            {/* Shield SVG */}
            <motion.svg
              width="120"
              height="140"
              viewBox="0 0 120 140"
              fill="none"
              className="relative z-10"
            >
              {/* Shield outline with draw animation */}
              <motion.path
                d="M60 10L10 35V70C10 100 35 125 60 135C85 125 110 100 110 70V35L60 10Z"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
              
              {/* Shield fill */}
              <motion.path
                d="M60 10L10 35V70C10 100 35 125 60 135C85 125 110 100 110 70V35L60 10Z"
                fill="hsl(var(--primary) / 0.1)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              />

              {/* QR Code pattern inside shield */}
              <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                {/* Top-left QR corner */}
                <rect x="30" y="45" width="12" height="12" fill="hsl(var(--primary))" rx="1" />
                <rect x="33" y="48" width="6" height="6" fill="hsl(var(--background))" rx="0.5" />
                <rect x="35" y="50" width="2" height="2" fill="hsl(var(--primary))" />
                
                {/* Top-right QR corner */}
                <rect x="78" y="45" width="12" height="12" fill="hsl(var(--primary))" rx="1" />
                <rect x="81" y="48" width="6" height="6" fill="hsl(var(--background))" rx="0.5" />
                <rect x="83" y="50" width="2" height="2" fill="hsl(var(--primary))" />
                
                {/* Bottom-left QR corner */}
                <rect x="30" y="85" width="12" height="12" fill="hsl(var(--primary))" rx="1" />
                <rect x="33" y="88" width="6" height="6" fill="hsl(var(--background))" rx="0.5" />
                <rect x="35" y="90" width="2" height="2" fill="hsl(var(--primary))" />
                
                {/* Center pattern */}
                <rect x="50" y="60" width="4" height="4" fill="hsl(var(--primary))" />
                <rect x="58" y="60" width="4" height="4" fill="hsl(var(--primary))" />
                <rect x="66" y="60" width="4" height="4" fill="hsl(var(--primary))" />
                <rect x="54" y="68" width="4" height="4" fill="hsl(var(--primary))" />
                <rect x="62" y="68" width="4" height="4" fill="hsl(var(--primary))" />
                <rect x="50" y="76" width="4" height="4" fill="hsl(var(--primary))" />
                <rect x="58" y="76" width="4" height="4" fill="hsl(var(--primary))" />
                <rect x="66" y="76" width="4" height="4" fill="hsl(var(--primary))" />
              </motion.g>

              {/* Pulse rings */}
              <motion.circle
                cx="60"
                cy="75"
                r="45"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                fill="none"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [0.8, 1.2], opacity: [0.5, 0] }}
                transition={{ delay: 1, duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
              />
            </motion.svg>
          </motion.div>

          {/* Text */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={phase === 'text' ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1 
              className="text-3xl font-display font-bold tracking-[0.3em] text-primary"
              initial={{ letterSpacing: '0.5em', opacity: 0 }}
              animate={{ letterSpacing: '0.3em', opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Q-SHIELD
            </motion.h1>
            <motion.p 
              className="text-xs text-muted-foreground font-mono mt-2 tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              THREAT DETECTION ACTIVE
            </motion.p>
            
            {/* Loading dots */}
            <motion.div 
              className="flex justify-center gap-1 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Corner brackets */}
          <div className="absolute top-8 left-8 w-8 h-8 border-l-2 border-t-2 border-primary/30" />
          <div className="absolute top-8 right-8 w-8 h-8 border-r-2 border-t-2 border-primary/30" />
          <div className="absolute bottom-8 left-8 w-8 h-8 border-l-2 border-b-2 border-primary/30" />
          <div className="absolute bottom-8 right-8 w-8 h-8 border-r-2 border-b-2 border-primary/30" />

          {/* Version tag */}
          <motion.div
            className="absolute bottom-8 text-xs font-mono text-muted-foreground/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            v1.0.0 // SECURE
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;

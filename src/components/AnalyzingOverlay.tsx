import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Scan, Clock } from 'lucide-react';

interface AnalyzingOverlayProps {
  url: string;
  stage: 'expanding' | 'analyzing' | 'checking';
}

const AnalyzingOverlay = ({ url, stage }: AnalyzingOverlayProps) => {
  const stages = [
    { id: 'expanding', label: 'EXPANDING SHORTENED URL', icon: Scan },
    { id: 'analyzing', label: 'ANALYZING URL PATTERNS', icon: AlertTriangle },
    { id: 'checking', label: 'QUERYING THREAT INTELLIGENCE', icon: Shield },
  ];
  
  const currentIndex = stages.findIndex(s => s.id === stage);
  
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background/98 backdrop-blur-md flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Animated shield */}
      <motion.div
        className="relative mb-12"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
          <Shield className="w-12 h-12 text-primary" />
        </div>
        
        {/* Scanning ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Outer pulses */}
        <motion.div
          className="absolute inset-0 rounded-full border border-primary"
          animate={{ scale: [1, 2], opacity: [0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
      
      {/* Status text */}
      <motion.h2
        className="font-display text-2xl text-primary text-glow tracking-wider mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        INTERCEPTING URL
      </motion.h2>
      
      <p className="text-muted-foreground text-sm font-mono mb-8 max-w-xs text-center truncate px-4">
        {url}
      </p>
      
      {/* Progress stages */}
      <div className="space-y-3 w-full max-w-sm">
        {stages.map((s, index) => {
          const Icon = s.icon;
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex;
          
          return (
            <motion.div
              key={s.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                isActive 
                  ? 'border-primary bg-primary/10' 
                  : isComplete 
                  ? 'border-primary/50 bg-primary/5' 
                  : 'border-border bg-card/50'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : isComplete 
                  ? 'bg-primary/50 text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {isActive ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Clock className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              
              <span className={`font-mono text-xs tracking-wide ${
                isActive ? 'text-primary' : isComplete ? 'text-primary/70' : 'text-muted-foreground'
              }`}>
                {s.label}
              </span>
              
              {isActive && (
                <motion.div
                  className="ml-auto flex gap-1"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default AnalyzingOverlay;

import { motion } from 'framer-motion';
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'secure' | 'scanning' | 'threat' | 'warning';
  size?: 'sm' | 'md' | 'lg';
}

const StatusIndicator = ({ status, size = 'md' }: StatusIndicatorProps) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };
  
  const iconSizes = {
    sm: 32,
    md: 48,
    lg: 64
  };
  
  const statusConfig = {
    secure: {
      icon: ShieldCheck,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      glowClass: 'pulse-glow',
      label: 'SYSTEM SECURE'
    },
    scanning: {
      icon: Shield,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      glowClass: '',
      label: 'SCANNING...'
    },
    threat: {
      icon: ShieldX,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      glowClass: 'pulse-danger',
      label: 'THREAT DETECTED'
    },
    warning: {
      icon: ShieldAlert,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      glowClass: '',
      label: 'CAUTION ADVISED'
    }
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div 
        className={`relative ${sizeClasses[size]} rounded-full ${config.bgColor} border-2 border-current ${config.color} flex items-center justify-center ${config.glowClass}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Outer ring animation */}
        {status === 'secure' && (
          <>
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-primary"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-primary"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
          </>
        )}
        
        {status === 'threat' && (
          <motion.div 
            className="absolute inset-0 rounded-full border-2 border-destructive"
            animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
        
        {status === 'scanning' && (
          <motion.div 
            className="absolute inset-0 rounded-full border-2 border-warning"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        )}
        
        <Icon size={iconSizes[size]} className={config.color} />
      </motion.div>
      
      <motion.span 
        className={`font-display text-sm tracking-widest ${config.color} text-glow`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {config.label}
      </motion.span>
    </div>
  );
};

export default StatusIndicator;

import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { HeuristicFlag } from '@/lib/heuristicAnalysis';

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

import { motion } from 'framer-motion';
import { Shield, AlertTriangle, ExternalLink, X, ChevronRight, Clock, Link2, Globe } from 'lucide-react';
import { ThreatAnalysis } from '@/lib/threatIntelligence';
import { Button } from '@/components/ui/button';

interface AnalysisResultProps {
  result: ThreatAnalysis;
  onClose: () => void;
  onOpenLink?: () => void;
}

const AnalysisResult = ({ result, onClose, onOpenLink }: AnalysisResultProps) => {
  const isSafe = result.threatLevel === 'safe';
  const isMalicious = result.threatLevel === 'malicious';
  
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background/98 backdrop-blur-md overflow-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Animated background effect */}
      {isMalicious && (
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute inset-0 bg-destructive/5"
            animate={{ opacity: [0.05, 0.1, 0.05] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      )}
      
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground"
      >
        <X className="w-6 h-6" />
      </Button>
      
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        {/* Main status icon */}
        <motion.div
          className={`relative mb-8 ${isSafe ? 'text-safe' : isMalicious ? 'text-destructive' : 'text-warning'}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          {/* Glow rings */}
          <motion.div 
            className={`absolute inset-0 rounded-full border-2 ${isSafe ? 'border-safe' : isMalicious ? 'border-destructive' : 'border-warning'}`}
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 128, height: 128, marginLeft: -16, marginTop: -16 }}
          />
          
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
            isSafe ? 'bg-safe/20 pulse-glow' : isMalicious ? 'bg-destructive/20 pulse-danger' : 'bg-warning/20'
          }`}>
            {isSafe ? (
              <Shield className="w-12 h-12" />
            ) : (
              <AlertTriangle className="w-12 h-12" />
            )}
          </div>
        </motion.div>
        
        {/* Status title */}
        <motion.h1
          className={`font-display text-3xl tracking-wider mb-2 text-glow ${
            isSafe ? 'text-safe' : isMalicious ? 'text-destructive' : 'text-warning'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isSafe ? 'URL VERIFIED' : isMalicious ? 'THREAT DETECTED' : 'CAUTION ADVISED'}
        </motion.h1>
        
        {/* Threat score */}
        <motion.div
          className="flex items-center gap-2 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-muted-foreground text-sm font-mono">THREAT SCORE:</span>
          <span className={`font-display text-xl ${
            result.threatScore < 20 ? 'text-safe' : result.threatScore < 50 ? 'text-warning' : 'text-destructive'
          }`}>
            {result.threatScore}/100
          </span>
        </motion.div>
        
        {/* URL info card */}
        <motion.div
          className="w-full max-w-md bg-card border border-border rounded-lg p-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="space-y-3">
            {/* Original URL */}
            <div className="flex items-start gap-3">
              <Link2 className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-1">ORIGINAL URL</p>
                <p className="text-sm font-mono text-foreground break-all">
                  {result.originalUrl}
                </p>
              </div>
            </div>
            
            {/* Expanded URL (if shortened) */}
            {result.expandedUrl && (
              <div className="flex items-start gap-3">
                <ChevronRight className="w-4 h-4 text-warning mt-1 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-warning mb-1">EXPANDED DESTINATION</p>
                  <p className="text-sm font-mono text-foreground break-all">
                    {result.expandedUrl}
                  </p>
                </div>
              </div>
            )}
            
            {/* Domain */}
            <div className="flex items-start gap-3">
              <Globe className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-1">DOMAIN</p>
                <p className="text-sm font-mono text-foreground">{result.domain}</p>
              </div>
            </div>
            
            {/* Scan duration */}
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Scanned in {result.scanDuration}ms
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* Threats detected */}
        {result.threats.length > 0 && (
          <motion.div
            className="w-full max-w-md mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="font-display text-sm text-destructive mb-3 tracking-wide">
              THREATS DETECTED ({result.threats.length})
            </h3>
            <div className="space-y-2">
              {result.threats.map((threat, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground bg-destructive/10 border border-destructive/20 rounded px-3 py-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <span>{threat}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Recommendations */}
        <motion.div
          className="w-full max-w-md mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="font-display text-sm text-muted-foreground mb-3 tracking-wide">
            RECOMMENDATIONS
          </h3>
          <div className="space-y-2">
            {result.recommendations.map((rec, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <ChevronRight className={`w-4 h-4 ${isSafe ? 'text-safe' : 'text-warning'}`} />
                <span className="text-foreground">{rec}</span>
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* Action buttons */}
        <motion.div
          className="flex gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            variant="outline"
            onClick={onClose}
            className="border-muted-foreground/50"
          >
            Close
          </Button>
          
          {isSafe && onOpenLink && (
            <Button
              onClick={onOpenLink}
              className="bg-safe text-safe-foreground hover:bg-safe/90"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Link
            </Button>
          )}
          
          {!isSafe && !isMalicious && onOpenLink && (
            <Button
              variant="outline"
              onClick={onOpenLink}
              className="border-warning text-warning hover:bg-warning/10"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Proceed Anyway
            </Button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AnalysisResult;

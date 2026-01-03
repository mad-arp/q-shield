import { motion } from 'framer-motion';
import { History, Trash2, ExternalLink, Shield, ShieldX, ShieldAlert, Clock } from 'lucide-react';
import { ScanRecord, getScanHistory, clearScanHistory, deleteScanRecord } from '@/lib/scanHistory';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface ScanHistoryProps {
  onSelectRecord: (record: ScanRecord) => void;
}

const ScanHistory = ({ onSelectRecord }: ScanHistoryProps) => {
  const [history, setHistory] = useState<ScanRecord[]>([]);
  
  useEffect(() => {
    loadHistory();
  }, []);
  
  const loadHistory = () => {
    setHistory(getScanHistory());
  };
  
  const handleClearHistory = () => {
    clearScanHistory();
    loadHistory();
  };
  
  const handleDeleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteScanRecord(id);
    loadHistory();
  };
  
  const getThreatIcon = (level: string) => {
    switch (level) {
      case 'safe':
        return <Shield className="w-5 h-5 text-safe" />;
      case 'malicious':
        return <ShieldX className="w-5 h-5 text-destructive" />;
      default:
        return <ShieldAlert className="w-5 h-5 text-warning" />;
    }
  };
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };
  
  if (history.length === 0) {
    return (
      <motion.div
        className="text-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground font-mono text-sm">NO SCAN HISTORY</p>
        <p className="text-muted-foreground/60 text-xs mt-2">
          Scanned QR codes will appear here
        </p>
      </motion.div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <span className="font-display text-sm text-primary tracking-wide">
            SCAN HISTORY
          </span>
          <span className="text-xs text-muted-foreground">({history.length})</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearHistory}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Clear All
        </Button>
      </div>
      
      {/* History list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {history.map((record, index) => (
          <motion.div
            key={record.id}
            className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-primary/50 transition-colors group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectRecord(record)}
          >
            <div className="flex items-start gap-3">
              {getThreatIcon(record.result.threatLevel)}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-foreground truncate">
                  {record.result.domain}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {record.url}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    record.result.threatLevel === 'safe' 
                      ? 'bg-safe/20 text-safe'
                      : record.result.threatLevel === 'malicious'
                      ? 'bg-destructive/20 text-destructive'
                      : 'bg-warning/20 text-warning'
                  }`}>
                    {record.result.threatLevel.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(record.scannedAt)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => handleDeleteRecord(record.id, e)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ScanHistory;

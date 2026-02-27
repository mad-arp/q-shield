import { motion } from 'framer-motion';
import { History, Trash2, ExternalLink, Shield, ShieldX, ShieldAlert, Clock, Download, FileJson, FileText, Search, Filter } from 'lucide-react';
import { ScanRecord, getScanHistory, clearScanHistory, deleteScanRecord, exportHistoryAsCSV, exportHistoryAsJSON, downloadFile } from '@/lib/scanHistory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ScanHistoryProps {
  onSelectRecord: (record: ScanRecord) => void;
}

type ThreatFilter = 'all' | 'safe' | 'suspicious' | 'malicious';

const ScanHistory = ({ onSelectRecord }: ScanHistoryProps) => {
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [threatFilter, setThreatFilter] = useState<ThreatFilter>('all');
  
  useEffect(() => {
    loadHistory();
  }, []);
  
  const loadHistory = () => {
    setHistory(getScanHistory());
  };

  const filteredHistory = useMemo(() => {
    return history.filter(record => {
      const matchesSearch = searchQuery === '' || 
        record.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.result.domain.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = threatFilter === 'all' || record.result.threatLevel === threatFilter;
      return matchesSearch && matchesFilter;
    });
  }, [history, searchQuery, threatFilter]);
  
  const handleClearHistory = () => {
    clearScanHistory();
    loadHistory();
  };
  
  const handleDeleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteScanRecord(id);
    loadHistory();
  };

  const handleExportCSV = () => {
    const csv = exportHistoryAsCSV();
    downloadFile(csv, `qshield-scan-history-${Date.now()}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = exportHistoryAsJSON();
    downloadFile(json, `qshield-scan-history-${Date.now()}.json`, 'application/json');
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

  const filterLabels: Record<ThreatFilter, string> = {
    all: 'ALL',
    safe: 'SAFE',
    suspicious: 'SUSPICIOUS',
    malicious: 'MALICIOUS',
  };

  const filterColors: Record<ThreatFilter, string> = {
    all: 'text-primary',
    safe: 'text-safe',
    suspicious: 'text-warning',
    malicious: 'text-destructive',
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
          <span className="text-xs text-muted-foreground">({filteredHistory.length})</span>
        </div>
        
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary hover:bg-primary/10 text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer font-mono text-xs">
                <FileText className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJSON} className="cursor-pointer font-mono text-xs">
                <FileJson className="w-4 h-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by URL or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border font-mono text-xs h-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`border-border font-mono text-xs h-9 ${filterColors[threatFilter]}`}
            >
              <Filter className="w-3 h-3 mr-1" />
              {filterLabels[threatFilter]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            {(Object.keys(filterLabels) as ThreatFilter[]).map((key) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setThreatFilter(key)}
                className={`cursor-pointer font-mono text-xs ${threatFilter === key ? 'bg-primary/20' : ''} ${filterColors[key]}`}
              >
                {filterLabels[key]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* History list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {filteredHistory.length === 0 ? (
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground font-mono text-xs">NO MATCHING RESULTS</p>
          </motion.div>
        ) : (
          filteredHistory.map((record, index) => (
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
          ))
        )}
      </div>
    </div>
  );
};

export default ScanHistory;

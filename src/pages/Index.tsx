import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Shield, Activity, AlertTriangle, History, Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusIndicator from '@/components/StatusIndicator';
import QRScanner from '@/components/QRScanner';
import AnalyzingOverlay from '@/components/AnalyzingOverlay';
import AnalysisResult from '@/components/AnalysisResult';
import ScanHistory from '@/components/ScanHistory';
import { analyzeThreat, ThreatAnalysis, isUrlShortened } from '@/lib/threatIntelligence';
import { saveScanToHistory, getScanStatistics, ScanRecord } from '@/lib/scanHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeStage, setAnalyzeStage] = useState<'expanding' | 'analyzing' | 'checking'>('expanding');
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ThreatAnalysis | null>(null);
  const [stats, setStats] = useState(getScanStatistics());
  
  useEffect(() => {
    setStats(getScanStatistics());
  }, [analysisResult]);
  
  const handleScan = async (url: string) => {
    setCurrentUrl(url);
    setIsAnalyzing(true);
    
    // Simulate progressive analysis stages
    setAnalyzeStage('expanding');
    
    // Check if URL is shortened to determine analysis flow
    const isShortened = isUrlShortened(url);
    
    if (isShortened) {
      await new Promise(r => setTimeout(r, 1000));
    }
    
    setAnalyzeStage('analyzing');
    await new Promise(r => setTimeout(r, 800));
    
    setAnalyzeStage('checking');
    
    // Perform actual threat analysis
    const result = await analyzeThreat(url);
    
    // Save to history
    saveScanToHistory(result);
    
    setIsAnalyzing(false);
    setAnalysisResult(result);
    setStats(getScanStatistics());
  };
  
  const handleOpenLink = () => {
    if (analysisResult) {
      window.open(analysisResult.expandedUrl || analysisResult.originalUrl, '_blank');
    }
  };
  
  const handleSelectHistoryRecord = (record: ScanRecord) => {
    setAnalysisResult(record.result);
  };
  
  const handleCloseResult = () => {
    setAnalysisResult(null);
    setCurrentUrl(null);
  };
  
  return (
    <div className="min-h-screen bg-background matrix-bg scanline">
      {/* Header */}
      <motion.header 
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary flex items-center justify-center pulse-glow">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl tracking-wider text-primary text-glow">
                Q-SHIELD
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                QR PHISHING INTERCEPTOR
              </p>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </motion.header>
      
      {/* Main content */}
      <main className="container px-4 py-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-card border border-border">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono tracking-wide"
            >
              <Activity className="w-4 h-4 mr-2" />
              DASHBOARD
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono tracking-wide"
            >
              <History className="w-4 h-4 mr-2" />
              HISTORY
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            {/* Status section */}
            <motion.section 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StatusIndicator status="secure" size="lg" />
            </motion.section>
            
            {/* Scan button */}
            <motion.section 
              className="text-center mb-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                variant="scan"
                size="xl"
                onClick={() => setIsScannerOpen(true)}
                className="relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
                <QrCode className="w-6 h-6 mr-2" />
                SCAN QR CODE
              </Button>
              
              <p className="text-muted-foreground text-sm mt-4 font-mono">
                Intercept & analyze before opening
              </p>
            </motion.section>
            
            {/* Stats grid */}
            <motion.section
              className="grid grid-cols-2 gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground font-mono">TOTAL SCANS</span>
                </div>
                <p className="text-3xl font-mono font-bold text-foreground">{stats.totalScans}</p>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-xs text-muted-foreground font-mono">THREATS BLOCKED</span>
                </div>
                <p className="text-3xl font-mono font-bold text-destructive">{stats.blockedThreats}</p>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground font-mono">SAFE</span>
                </div>
                <p className="text-3xl font-mono font-bold text-primary">{stats.safeCount}</p>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-xs text-muted-foreground font-mono">SUSPICIOUS</span>
                </div>
                <p className="text-3xl font-mono font-bold text-warning">{stats.suspiciousCount}</p>
              </div>
            </motion.section>
            
            {/* Info section */}
            <motion.section
              className="bg-card border border-border rounded-lg p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <h3 className="font-display text-sm text-primary mb-3 tracking-wide">
                PROTECTION FEATURES
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  URL shortener detection & expansion
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Phishing pattern recognition
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Threat intelligence database check
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Real-time URL interception
                </li>
              </ul>
            </motion.section>
          </TabsContent>
          
          <TabsContent value="history">
            <ScanHistory onSelectRecord={handleSelectHistoryRecord} />
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-4 mt-auto">
        <div className="container px-4 text-center">
          <p className="text-xs text-muted-foreground font-mono">
            Q-SHIELD v1.0 • QUISHING DETECTION SYSTEM
          </p>
        </div>
      </footer>
      
      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />
      
      {/* Analyzing Overlay */}
      <AnimatePresence>
        {isAnalyzing && currentUrl && (
          <AnalyzingOverlay url={currentUrl} stage={analyzeStage} />
        )}
      </AnimatePresence>
      
      {/* Analysis Result */}
      <AnimatePresence>
        {analysisResult && (
          <AnalysisResult
            result={analysisResult}
            onClose={handleCloseResult}
            onOpenLink={handleOpenLink}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;

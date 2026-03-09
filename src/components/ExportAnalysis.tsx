import { Share2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThreatAnalysis } from '@/lib/threatIntelligence';
import { HeuristicFlag } from '@/lib/heuristicAnalysis';
import { generateThreatReportPDF } from '@/lib/pdfReport';
import { toast } from 'sonner';

interface ExportAnalysisProps {
  result: ThreatAnalysis;
  heuristics: HeuristicFlag[];
}

const ExportAnalysis = ({ result, heuristics }: ExportAnalysisProps) => {
  const handleQuickShare = async () => {
    const text = [
      `🛡️ Q-SHIELD Threat Report`,
      ``,
      `URL: ${result.originalUrl}`,
      `Status: ${result.threatLevel.toUpperCase()}`,
      `Threat Score: ${result.threatScore}/100`,
      `Domain: ${result.domain}`,
      `Scanned: ${new Date().toLocaleString()}`,
      ``,
      result.threatLevel === 'safe'
        ? '✅ URL verified safe'
        : `⚠️ ${result.threats.length} threat(s) detected`,
    ].join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Q-SHIELD Report', text });
        toast.success('Shared successfully');
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          // Fallback to clipboard
          await navigator.clipboard.writeText(text);
          toast.success('Copied to clipboard');
        }
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard (sharing not supported)');
    }
  };

  const handleDownloadPDF = () => {
    try {
      generateThreatReportPDF(result, heuristics);
      toast.success('PDF report downloaded');
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="w-full max-w-md">
      <h3 className="font-display text-sm text-primary mb-3 tracking-wide">
        EXPORT ANALYSIS
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="cyber"
          className="flex flex-col items-center gap-1.5 h-auto py-3"
          onClick={handleQuickShare}
        >
          <Share2 className="w-5 h-5" />
          <span className="text-xs">Share Summary</span>
        </Button>
        <Button
          variant="cyber"
          className="flex flex-col items-center gap-1.5 h-auto py-3"
          onClick={handleDownloadPDF}
        >
          <FileText className="w-5 h-5" />
          <span className="text-xs">Download PDF</span>
        </Button>
      </div>
    </div>
  );
};

export default ExportAnalysis;

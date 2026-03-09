import { useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScanFromFileProps {
  onScan: (url: string) => void;
}

const ACCEPTED_TYPES = '.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.pdf,.ppt,.pptx,.tiff,.tif';

const ScanFromFile = ({ onScan }: ScanFromFileProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const scanner = new Html5Qrcode('qr-file-reader-hidden');
      try {
        const result = await scanner.scanFileV2(file, true);
        onScan(result.decodedText);
      } catch {
        setError('No QR code found in the selected file. Try a clearer image.');
      } finally {
        scanner.clear();
      }
    } catch {
      setError('Could not process this file. Try a different image format.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="border-primary/50 text-primary hover:bg-primary/10 font-mono tracking-wide"
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <ImagePlus className="w-5 h-5 mr-2" />
        )}
        {isProcessing ? 'SCANNING...' : 'UPLOAD QR IMAGE'}
      </Button>
      <p className="text-muted-foreground text-xs font-mono">
        PNG, JPG, PDF, PPT & more
      </p>
      {error && (
        <p className="text-destructive text-xs font-mono text-center max-w-xs">{error}</p>
      )}
      <div id="qr-file-reader-hidden" className="hidden" />
    </div>
  );
};

export default ScanFromFile;

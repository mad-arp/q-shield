import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera as CameraPlugin } from '@capacitor/camera';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Scan, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeedback } from '@/hooks/useFeedback';
import { isNativePlatform } from '@/lib/capacitor';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (url: string) => void;
}

const QRScanner = ({ isOpen, onClose, onScan }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { feedback } = useFeedback();

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      initializeScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    try {
      setError(null);

      // On native platforms, request camera permission via Capacitor first
      if (isNativePlatform()) {
        const permission = await CameraPlugin.requestPermissions({ permissions: ['camera'] });
        if (permission.camera === 'denied') {
          setError('Camera permission denied. Please enable it in your device settings.');
          return;
        }
      }

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          feedback('scan');
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        () => {
          // QR scan error - ignore, keep scanning
        }
      );
      
      setIsScanning(true);
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Camera access denied. Please allow camera permissions.');
    }
  };

  const handleScanFromGallery = async () => {
    try {
      // Use Capacitor Camera to pick image from gallery
      const image = await CameraPlugin.pickImages({ limit: 1 });
      if (image.photos.length > 0) {
        const photo = image.photos[0];
        if (photo.webPath) {
          const scanner = new Html5Qrcode('qr-reader-hidden');
          try {
            const blob = await fetch(photo.webPath).then(r => r.blob());
            const file = new File([blob], 'qr-image.jpg', { type: blob.type });
            const result = await scanner.scanFileV2(file, true);
            feedback('scan');
            onScan(result.decodedText);
            onClose();
          } catch {
            setError('No QR code found in the selected image.');
          } finally {
            scanner.clear();
          }
        }
      }
    } catch (e) {
      // User cancelled or error
      console.error('Gallery scan error:', e);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
    }
    scannerRef.current = null;
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Camera className="w-6 h-6 text-primary" />
              <span className="font-display text-lg tracking-wide text-primary">
                QR SCANNER
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Scanner Area */}
          <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] p-4">
            <motion.div
              className="relative w-full max-w-sm aspect-square rounded-lg overflow-hidden border-2 border-primary border-glow"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* QR Reader Container */}
              <div id="qr-reader" className="w-full h-full" />

              {/* Scanning overlay */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-primary" />
                  <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-primary" />
                  <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-primary" />
                  <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-primary" />
                  
                  <motion.div
                    className="absolute left-4 right-4 h-0.5 bg-primary shadow-[0_0_10px_hsl(120_100%_50%)]"
                    animate={{ top: ['15%', '85%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              )}
            </motion.div>

            {/* Status */}
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {error ? (
                <p className="text-destructive">{error}</p>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Scan className="w-5 h-5 animate-pulse" />
                    <span className="font-mono text-sm">SCANNING FOR QR CODE...</span>
                  </div>
                  <p className="text-muted-foreground text-xs max-w-xs">
                    Position QR code within the frame. URL will be intercepted and analyzed before opening.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Scan from Gallery button (native only) */}
            {isNativePlatform() && (
              <motion.div
                className="mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  variant="outline"
                  onClick={handleScanFromGallery}
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  <ImagePlus className="w-4 h-4 mr-2" />
                  SCAN FROM GALLERY
                </Button>
              </motion.div>
            )}

            {/* Hidden element for file scanning */}
            <div id="qr-reader-hidden" className="hidden" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QRScanner;

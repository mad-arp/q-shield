import { useState } from 'react';
import { Eye, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';

interface SafePreviewProps {
  url: string;
}

/**
 * Isolated sandbox preview: the destination page is rendered by a remote
 * headless browser and only a flat screenshot reaches the device.
 */
const SafePreview = ({ url }: SafePreviewProps) => {
  const [loading, setLoading] = useState(false);
  const [shot, setShot] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const capture = async () => {
    if (!/^https?:\/\//i.test(url)) {
      setError('Only http(s) destinations can be previewed.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('safe-preview', { body: { url } });
      if (fnError || !data?.screenshot) {
        setError('Sandbox preview unavailable for this destination.');
      } else {
        setShot(data.screenshot);
        setTitle(data.title ?? null);
      }
    } catch {
      setError('Sandbox preview unavailable for this destination.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Accordion type="single" collapsible className="bg-card border border-border rounded-lg px-4">
        <AccordionItem value="preview" className="border-0">
          <AccordionTrigger className="font-display text-sm tracking-wide hover:no-underline">
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              SANDBOX VISUAL PREVIEW
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <p className="text-xs text-muted-foreground font-mono mb-3">
              Rendered in an isolated remote browser. Your device never loads the page.
            </p>

            {!shot && (
              <Button size="sm" variant="outline" onClick={capture} disabled={loading} className="font-mono">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                {loading ? 'CAPTURING...' : 'CAPTURE SAFE PREVIEW'}
              </Button>
            )}

            {error && (
              <p className="text-xs font-mono text-warning flex items-center gap-2 mt-2">
                <ShieldAlert className="w-4 h-4" /> {error}
              </p>
            )}

            {shot && (
              <div className="mt-2 space-y-2">
                {title && <p className="text-xs font-mono text-muted-foreground break-all">{title}</p>}
                <img
                  src={shot}
                  alt={`Sandboxed screenshot of ${url}`}
                  loading="lazy"
                  className="w-full rounded border border-border"
                />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default SafePreview;

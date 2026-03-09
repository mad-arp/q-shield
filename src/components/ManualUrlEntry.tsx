import { useState } from 'react';
import { Link, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ManualUrlEntryProps {
  onSubmit: (url: string) => void;
  isAnalyzing?: boolean;
}

const ManualUrlEntry = ({ onSubmit, isAnalyzing }: ManualUrlEntryProps) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    // Basic URL validation - allow with or without protocol
    let finalUrl = trimmed;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    try {
      new URL(finalUrl);
      setError(null);
      onSubmit(finalUrl);
      setUrl('');
    } catch {
      setError('Please enter a valid URL');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Enter URL to analyze..."
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(null); }}
            className="pl-9 bg-card border-border font-mono text-xs h-10"
            disabled={isAnalyzing}
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={!url.trim() || isAnalyzing}
          className="h-10 font-mono tracking-wide"
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>
      {error && (
        <p className="text-destructive text-xs font-mono mt-1 ml-1">{error}</p>
      )}
    </form>
  );
};

export default ManualUrlEntry;

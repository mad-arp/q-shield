import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Send, Loader2, Webhook as WebhookIcon } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface WebhookConfig {
  id: string;
  webhook_url: string;
  label: string | null;
  enabled: boolean;
  min_level: string;
}

const schema = z.object({
  webhook_url: z.string().trim().url({ message: 'Enter a valid URL' }).max(500)
    .refine((v) => v.startsWith('https://'), { message: 'Webhook must use https://' }),
  label: z.string().trim().max(60).optional(),
});

const Webhooks = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<WebhookConfig[]>([]);
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [minLevel, setMinLevel] = useState('suspicious');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth', { replace: true });
  }, [authLoading, user, navigate]);

  const load = async () => {
    const { data, error } = await supabase
      .from('webhook_configs')
      .select('id, webhook_url, label, enabled, min_level')
      .order('created_at', { ascending: false });
    if (!error) setRows(data ?? []);
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ webhook_url: url, label });
    if (!parsed.success) {
      toast({ title: 'Invalid webhook', description: parsed.error.issues[0].message, variant: 'destructive' });
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('webhook_configs').insert({
      user_id: user!.id,
      webhook_url: parsed.data.webhook_url,
      label: parsed.data.label || null,
      min_level: minLevel,
    });
    setBusy(false);
    if (error) {
      toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
      return;
    }
    setUrl('');
    setLabel('');
    load();
    toast({ title: 'Webhook added', description: 'Alerts will be dispatched automatically.' });
  };

  const toggle = async (row: WebhookConfig, enabled: boolean) => {
    await supabase.from('webhook_configs').update({ enabled }).eq('id', row.id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('webhook_configs').delete().eq('id', id);
    load();
  };

  const test = async (row: WebhookConfig) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('dispatch-alert', {
      body: {
        url: 'https://q-shield.test/webhook-check',
        threatLevel: 'malicious',
        threatScore: 92,
        threats: ['Q-SHIELD webhook connectivity test'],
        testWebhookUrl: row.webhook_url,
      },
    });
    setBusy(false);
    const ok = !error && data?.results?.[0]?.ok;
    toast({
      title: ok ? 'Test alert delivered' : 'Test alert failed',
      description: ok ? 'Your endpoint accepted the payload.' : 'The endpoint did not accept the alert.',
      variant: ok ? undefined : 'destructive',
    });
  };

  return (
    <div className="min-h-dvh bg-background matrix-bg">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center gap-3 h-16 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <WebhookIcon className="w-5 h-5 text-primary" />
            <h1 className="font-display text-lg tracking-wider text-primary">SIEM & WEBHOOK ALERTS</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-2xl">
        <p className="text-xs font-mono text-muted-foreground mb-6">
          Suspicious or dangerous scans are pushed as JSON to every enabled endpoint
          (Discord, Slack or a generic SIEM collector).
        </p>

        <form onSubmit={add} className="bg-card border border-border rounded-lg p-4 space-y-4 mb-8">
          <div className="space-y-2">
            <Label htmlFor="hook-url" className="font-mono text-xs">WEBHOOK URL (HTTPS)</Label>
            <Input id="hook-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://discord.com/api/webhooks/..." className="font-mono text-xs" maxLength={500} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hook-label" className="font-mono text-xs">LABEL</Label>
              <Input id="hook-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="SOC channel" className="font-mono text-xs" maxLength={60} />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs">MINIMUM LEVEL</Label>
              <Select value={minLevel} onValueChange={setMinLevel}>
                <SelectTrigger className="font-mono text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="suspicious">Suspicious &amp; above</SelectItem>
                  <SelectItem value="malicious">Dangerous only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={busy} className="font-mono tracking-wide">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            ADD ENDPOINT
          </Button>
        </form>

        <div className="space-y-3">
          {rows.length === 0 && (
            <p className="text-xs font-mono text-muted-foreground text-center py-8">No endpoints configured yet.</p>
          )}
          {rows.map((row) => (
            <div key={row.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm text-foreground truncate">{row.label || 'Endpoint'}</p>
                <p className="font-mono text-[11px] text-muted-foreground truncate">{row.webhook_url}</p>
                <p className="font-mono text-[11px] text-warning mt-1">Triggers on: {row.min_level}</p>
              </div>
              <Switch checked={row.enabled} onCheckedChange={(v) => toggle(row, v)} aria-label="Enable endpoint" />
              <Button variant="ghost" size="icon" onClick={() => test(row)} disabled={busy} aria-label="Send test alert">
                <Send className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => remove(row.id)} aria-label="Delete endpoint">
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Webhooks;

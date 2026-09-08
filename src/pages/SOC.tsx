import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ScanRow {
  id: string;
  url: string;
  domain: string | null;
  threat_level: string;
  threat_score: number;
  source: string;
  created_at: string;
  user_id: string;
}

const LEVEL_COLORS: Record<string, string> = {
  safe: 'hsl(var(--primary))',
  suspicious: 'hsl(var(--warning))',
  malicious: 'hsl(var(--destructive))',
};

const SOC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [rows, setRows] = useState<ScanRow[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate('/auth', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('scans')
      .select('id, url, domain, threat_level, threat_score, source, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(500)
      .then(({ data }) => setRows(data ?? []));
  }, [user]);

  const totals = useMemo(() => ({
    total: rows.length,
    safe: rows.filter((r) => r.threat_level === 'safe').length,
    suspicious: rows.filter((r) => r.threat_level === 'suspicious').length,
    malicious: rows.filter((r) => r.threat_level === 'malicious').length,
  }), [rows]);

  const trend = useMemo(() => {
    const days: Record<string, { date: string; safe: number; suspicious: number; malicious: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      days[d] = { date: d.slice(5), safe: 0, suspicious: 0, malicious: 0 };
    }
    rows.forEach((r) => {
      const key = r.created_at.slice(0, 10);
      const bucket = days[key];
      if (bucket && bucket[r.threat_level as 'safe'] !== undefined) {
        (bucket as any)[r.threat_level] += 1;
      }
    });
    return Object.values(days);
  }, [rows]);

  const distribution = useMemo(() => ([
    { name: 'Safe', value: totals.safe, key: 'safe' },
    { name: 'Suspicious', value: totals.suspicious, key: 'suspicious' },
    { name: 'Dangerous', value: totals.malicious, key: 'malicious' },
  ].filter((d) => d.value > 0)), [totals]);

  return (
    <div className="min-h-dvh bg-background matrix-bg">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center gap-3 h-16 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            <div>
              <h1 className="font-display text-lg tracking-wider text-primary">SECURITY OPERATIONS CENTER</h1>
              <p className="text-[11px] font-mono text-muted-foreground">
                {isAdmin ? 'ANALYST VIEW — GLOBAL TELEMETRY' : 'STANDARD USER VIEW — YOUR ACTIVITY'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'TOTAL SCANS', value: totals.total, icon: Activity, tone: 'text-foreground' },
            { label: 'SAFE', value: totals.safe, icon: ShieldCheck, tone: 'text-primary' },
            { label: 'SUSPICIOUS', value: totals.suspicious, icon: AlertTriangle, tone: 'text-warning' },
            { label: 'DANGEROUS', value: totals.malicious, icon: ShieldAlert, tone: 'text-destructive' },
          ].map((card) => (
            <div key={card.label} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className={`w-4 h-4 ${card.tone}`} />
                <span className="text-xs text-muted-foreground font-mono">{card.label}</span>
              </div>
              <p className={`text-3xl font-mono font-bold ${card.tone}`}>{card.value}</p>
            </div>
          ))}
        </section>

        <section className="grid lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4 lg:col-span-2">
            <h2 className="font-display text-sm tracking-wide text-muted-foreground mb-4">THREAT DISTRIBUTION OVER TIME</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                  <Area type="monotone" dataKey="safe" stackId="1" stroke={LEVEL_COLORS.safe} fill={LEVEL_COLORS.safe} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="suspicious" stackId="1" stroke={LEVEL_COLORS.suspicious} fill={LEVEL_COLORS.suspicious} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="malicious" stackId="1" stroke={LEVEL_COLORS.malicious} fill={LEVEL_COLORS.malicious} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="font-display text-sm tracking-wide text-muted-foreground mb-4">CLASSIFICATION MIX</h2>
            <div className="h-64">
              {distribution.length === 0 ? (
                <p className="text-xs font-mono text-muted-foreground">No scans recorded yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                      {distribution.map((d) => (
                        <Cell key={d.key} fill={LEVEL_COLORS[d.key]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        <section className="bg-card border border-border rounded-lg p-4">
          <h2 className="font-display text-sm tracking-wide text-muted-foreground mb-4">
            {isAdmin ? 'GLOBAL AUDIT LOG' : 'YOUR AUDIT LOG'}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-2 pr-4">TIME</th>
                  <th className="text-left py-2 pr-4">URL</th>
                  <th className="text-left py-2 pr-4">DOMAIN</th>
                  <th className="text-left py-2 pr-4">LEVEL</th>
                  <th className="text-left py-2 pr-4">SCORE</th>
                  <th className="text-left py-2">SOURCE</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No scan records yet.</td></tr>
                )}
                {rows.slice(0, 100).map((r) => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-4 max-w-[280px] truncate">{r.url}</td>
                    <td className="py-2 pr-4">{r.domain}</td>
                    <td className="py-2 pr-4 uppercase" style={{ color: LEVEL_COLORS[r.threat_level] }}>{r.threat_level}</td>
                    <td className="py-2 pr-4">{r.threat_score}</td>
                    <td className="py-2">{r.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SOC;

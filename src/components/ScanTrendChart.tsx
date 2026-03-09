import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getScanHistory } from '@/lib/scanHistory';
import { TrendingUp } from 'lucide-react';

interface ScanTrendChartProps {
  refreshKey?: number;
}

const ScanTrendChart = ({ refreshKey }: ScanTrendChartProps) => {
  const data = useMemo(() => {
    const history = getScanHistory();
    if (history.length === 0) return [];

    // Group scans by day for last 7 days
    const now = new Date();
    const days: { date: string; safe: number; suspicious: number; malicious: number; total: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      const dayscans = history.filter(r => {
        const sd = new Date(r.scannedAt).toISOString().split('T')[0];
        return sd === key;
      });

      days.push({
        date: label,
        safe: dayscans.filter(s => s.result.threatLevel === 'safe').length,
        suspicious: dayscans.filter(s => s.result.threatLevel === 'suspicious').length,
        malicious: dayscans.filter(s => s.result.threatLevel === 'malicious').length,
        total: dayscans.length,
      });
    }

    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (data.length === 0 || data.every(d => d.total === 0)) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="font-display text-xs text-primary tracking-wide">SCAN TRENDS (7 DAYS)</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(120, 100%, 50%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(120, 100%, 50%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSuspicious" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(45, 100%, 50%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(45, 100%, 50%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorMalicious" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0, 100%, 50%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(0, 100%, 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(120, 100%, 20%)" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fill: 'hsl(120, 30%, 60%)', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: 'hsl(120, 30%, 60%)', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(0, 0%, 6%)',
              border: '1px solid hsl(120, 100%, 20%)',
              borderRadius: '8px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              color: 'hsl(120, 100%, 50%)',
            }}
          />
          <Area type="monotone" dataKey="safe" stackId="1" stroke="hsl(120, 100%, 50%)" fill="url(#colorSafe)" name="Safe" />
          <Area type="monotone" dataKey="suspicious" stackId="1" stroke="hsl(45, 100%, 50%)" fill="url(#colorSuspicious)" name="Suspicious" />
          <Area type="monotone" dataKey="malicious" stackId="1" stroke="hsl(0, 100%, 50%)" fill="url(#colorMalicious)" name="Malicious" />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-2">
        <span className="flex items-center gap-1 text-xs font-mono"><span className="w-2 h-2 rounded-full bg-primary" />Safe</span>
        <span className="flex items-center gap-1 text-xs font-mono"><span className="w-2 h-2 rounded-full bg-warning" />Suspicious</span>
        <span className="flex items-center gap-1 text-xs font-mono"><span className="w-2 h-2 rounded-full bg-destructive" />Malicious</span>
      </div>
    </div>
  );
};

export default ScanTrendChart;

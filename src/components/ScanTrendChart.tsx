import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getScanHistory } from '@/lib/scanHistory';
import { Shield, ShieldX, ShieldAlert, BarChart3 } from 'lucide-react';

const ScanTrendChart = () => {
  const history = useMemo(() => getScanHistory(), []);

  // Build daily trend data for last 14 days
  const trendData = useMemo(() => {
    const days: { date: string; safe: number; suspicious: number; malicious: number }[] = [];
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dayRecords = history.filter(r => {
        const rDate = new Date(r.scannedAt).toISOString().slice(0, 10);
        return rDate === key;
      });

      days.push({
        date: label,
        safe: dayRecords.filter(r => r.result.threatLevel === 'safe').length,
        suspicious: dayRecords.filter(r => r.result.threatLevel === 'suspicious').length,
        malicious: dayRecords.filter(r => r.result.threatLevel === 'malicious').length,
      });
    }
    return days;
  }, [history]);

  // Pie data
  const pieData = useMemo(() => {
    const safe = history.filter(r => r.result.threatLevel === 'safe').length;
    const suspicious = history.filter(r => r.result.threatLevel === 'suspicious').length;
    const malicious = history.filter(r => r.result.threatLevel === 'malicious').length;
    return [
      { name: 'Safe', value: safe, color: 'hsl(120, 100%, 50%)' },
      { name: 'Suspicious', value: suspicious, color: 'hsl(45, 100%, 50%)' },
      { name: 'Malicious', value: malicious, color: 'hsl(0, 100%, 50%)' },
    ].filter(d => d.value > 0);
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground font-mono text-sm">NO DATA YET</p>
        <p className="text-muted-foreground/60 text-xs mt-2">
          Scan some URLs to see analytics
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <Shield className="w-5 h-5 text-safe mx-auto mb-1" />
          <p className="text-2xl font-mono font-bold text-safe">
            {history.filter(r => r.result.threatLevel === 'safe').length}
          </p>
          <p className="text-xs text-muted-foreground font-mono">SAFE</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <ShieldAlert className="w-5 h-5 text-warning mx-auto mb-1" />
          <p className="text-2xl font-mono font-bold text-warning">
            {history.filter(r => r.result.threatLevel === 'suspicious').length}
          </p>
          <p className="text-xs text-muted-foreground font-mono">SUSPICIOUS</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <ShieldX className="w-5 h-5 text-destructive mx-auto mb-1" />
          <p className="text-2xl font-mono font-bold text-destructive">
            {history.filter(r => r.result.threatLevel === 'malicious').length}
          </p>
          <p className="text-xs text-muted-foreground font-mono">MALICIOUS</p>
        </div>
      </div>

      {/* Trend chart */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-display text-sm text-primary mb-4 tracking-wide">
          THREAT DISTRIBUTION (14 DAYS)
        </h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="gradSafe" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(120, 100%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(120, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradWarn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(45, 100%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(45, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDanger" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 100%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(120, 100%, 20%)" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'hsl(120, 30%, 60%)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: 'hsl(120, 100%, 20%)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'hsl(120, 30%, 60%)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: 'hsl(120, 100%, 20%)' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(0, 0%, 6%)',
                  border: '1px solid hsl(120, 100%, 20%)',
                  borderRadius: '8px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '11px',
                }}
                labelStyle={{ color: 'hsl(120, 100%, 50%)' }}
              />
              <Area type="monotone" dataKey="safe" stroke="hsl(120, 100%, 50%)" fill="url(#gradSafe)" strokeWidth={2} />
              <Area type="monotone" dataKey="suspicious" stroke="hsl(45, 100%, 50%)" fill="url(#gradWarn)" strokeWidth={2} />
              <Area type="monotone" dataKey="malicious" stroke="hsl(0, 100%, 50%)" fill="url(#gradDanger)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-display text-sm text-primary mb-4 tracking-wide">
            OVERALL DISTRIBUTION
          </h3>
          <div className="h-[180px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(0, 0%, 6%)',
                    border: '1px solid hsl(120, 100%, 20%)',
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="text-xs font-mono text-muted-foreground">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanTrendChart;

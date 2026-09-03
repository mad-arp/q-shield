import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// SIEM / Webhook alert dispatch. Runs server-side so hostile CORS policies
// and rate limits never break the scan UI.
const LEVEL_RANK: Record<string, number> = { safe: 0, suspicious: 1, malicious: 2 };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const url = typeof body?.url === 'string' ? body.url.slice(0, 2048) : '';
    const threatLevel = typeof body?.threatLevel === 'string' ? body.threatLevel : '';
    const threatScore = Number.isFinite(body?.threatScore) ? Number(body.threatScore) : 0;
    const threats: string[] = Array.isArray(body?.threats) ? body.threats.slice(0, 25).map(String) : [];
    const testUrl = typeof body?.testWebhookUrl === 'string' ? body.testWebhookUrl : '';

    if (!url || !LEVEL_RANK.hasOwnProperty(threatLevel)) {
      return json({ error: 'url and a valid threatLevel are required' }, 400);
    }

    let targets: Array<{ webhook_url: string; min_level: string }> = [];
    if (testUrl) {
      if (!/^https:\/\/\S+$/i.test(testUrl)) return json({ error: 'Test webhook must be an https URL' }, 400);
      targets = [{ webhook_url: testUrl, min_level: 'safe' }];
    } else {
      const { data, error } = await supabase
        .from('webhook_configs')
        .select('webhook_url, min_level')
        .eq('enabled', true);
      if (error) return json({ error: error.message }, 400);
      targets = data ?? [];
    }

    const payload = {
      source: 'Q-SHIELD',
      event: 'qr_threat_detected',
      url,
      classification: threatLevel,
      risk_score: threatScore,
      indicators: threats,
      detected_at: new Date().toISOString(),
      content: `[Q-SHIELD] ${threatLevel.toUpperCase()} (${threatScore}/100) — ${url}`,
    };

    const results = await Promise.all(
      targets
        .filter((t) => LEVEL_RANK[threatLevel] >= (LEVEL_RANK[t.min_level] ?? 1))
        .map(async (t) => {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(t.webhook_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: controller.signal,
            });
            clearTimeout(timer);
            return { url: t.webhook_url, ok: res.ok, status: res.status };
          } catch (e) {
            return { url: t.webhook_url, ok: false, error: String(e) };
          }
        }),
    );

    return json({ ok: true, dispatched: results.length, results });
  } catch (error) {
    console.error('dispatch-alert failed:', error);
    return json({ error: 'Alert dispatch failed', details: String(error) }, 500);
  }
});

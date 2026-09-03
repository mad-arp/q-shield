import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Isolated sandbox preview: renders the destination page remotely (Firecrawl)
// and returns only a screenshot URL, so the user never touches the hostile page.
const GATEWAY = 'https://connector-gateway.lovable.dev/firecrawl/v2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const body = await req.json().catch(() => ({}));
    const url = typeof body?.url === 'string' ? body.url.trim() : '';
    if (!/^https?:\/\/\S+$/i.test(url) || url.length > 2048) {
      return json({ error: 'A valid http(s) "url" is required' }, 400);
    }

    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!lovableKey || !firecrawlKey) {
      return json({ error: 'Sandbox preview is not configured' }, 503);
    }

    const res = await fetch(`${GATEWAY}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lovableKey}`,
        'X-Connection-Api-Key': firecrawlKey,
      },
      body: JSON.stringify({ url, formats: ['screenshot'], onlyMainContent: true, waitFor: 1500 }),
    });

    if (!res.ok) {
      const details = await res.text();
      console.error(`Firecrawl screenshot failed [${res.status}]: ${details}`);
      return json({ error: 'Sandbox preview failed', status: res.status, details }, res.status);
    }

    const data = await res.json();
    const screenshot = data?.data?.screenshot ?? data?.screenshot ?? null;
    const title = data?.data?.metadata?.title ?? data?.metadata?.title ?? null;
    const statusCode = data?.data?.metadata?.statusCode ?? data?.metadata?.statusCode ?? null;

    if (!screenshot) return json({ error: 'No screenshot returned for this URL' }, 502);

    return json({ ok: true, screenshot, title, statusCode });
  } catch (error) {
    console.error('safe-preview failed:', error);
    return json({ error: 'Sandbox preview failed', details: String(error) }, 500);
  }
});

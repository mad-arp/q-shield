import { supabase } from '@/integrations/supabase/client';
import type { ThreatAnalysis } from './threatIntelligence';
import type { HeuristicFlag } from './heuristicAnalysis';
import { inspectPayload, PayloadFinding } from './payloadInspection';

export interface BackendEnrichment {
  findings: PayloadFinding[];
  penalty: number;
  domainAge: { available: boolean; registeredAt: string | null; ageDays: number | null } | null;
  intelMode: 'live' | 'offline-fallback';
}

/**
 * SECURITY LOGIC: Ask the secure backend for payload heuristics, domain age (RDAP)
 * and external reputation. If the backend is unreachable, rate-limited or missing
 * API keys, we silently fall back to the offline payload inspector — the scan
 * NEVER fails because of the network.
 */
export async function enrichWithBackend(url: string): Promise<BackendEnrichment> {
  const offline = (): BackendEnrichment => {
    const findings = inspectPayload(url);
    return {
      findings,
      penalty: Math.min(findings.reduce((s, f) => s + f.penalty, 0), 100),
      domainAge: null,
      intelMode: 'offline-fallback',
    };
  };

  try {
    const { data, error } = await supabase.functions.invoke('analyze-url', { body: { url } });
    if (error || !data?.ok) return offline();
    return {
      findings: (data.findings ?? []) as PayloadFinding[],
      penalty: Number(data.penalty ?? 0),
      domainAge: data.domainAge ?? null,
      intelMode: data.intel?.mode === 'live' ? 'live' : 'offline-fallback',
    };
  } catch {
    return offline();
  }
}

/** Merge backend findings into the analysis result and re-score. */
export function applyEnrichment(result: ThreatAnalysis, enrichment: BackendEnrichment): ThreatAnalysis {
  const score = Math.min(result.threatScore + enrichment.penalty, 100);
  const threatLevel: ThreatAnalysis['threatLevel'] =
    score >= 50 ? 'malicious' : score >= 20 ? 'suspicious' : 'safe';

  return {
    ...result,
    threatScore: score,
    threatLevel,
    isSafe: threatLevel === 'safe',
    threats: [...result.threats, ...enrichment.findings.map((f) => f.label)],
    backendFindings: enrichment.findings as HeuristicFlag[],
    domainAge: enrichment.domainAge ?? undefined,
    intelMode: enrichment.intelMode,
  };
}

/** Persist the scan to the cloud audit log (best effort — only when signed in). */
export async function persistScan(result: ThreatAnalysis, source: string): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;
    await supabase.from('scans').insert({
      user_id: user.id,
      url: result.originalUrl,
      expanded_url: result.expandedUrl,
      domain: result.domain,
      threat_level: result.threatLevel,
      threat_score: result.threatScore,
      threats: result.threats,
      source,
    });
  } catch {
    // offline / signed out — local history still holds the record
  }
}

/** Fire SIEM/webhook alerts for suspicious or dangerous scans. */
export async function dispatchAlert(result: ThreatAnalysis): Promise<void> {
  if (result.threatLevel === 'safe') return;
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) return;
    await supabase.functions.invoke('dispatch-alert', {
      body: {
        url: result.expandedUrl || result.originalUrl,
        threatLevel: result.threatLevel,
        threatScore: result.threatScore,
        threats: result.threats,
      },
    });
  } catch {
    // never block the UI on webhook delivery
  }
}

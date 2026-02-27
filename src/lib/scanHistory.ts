import { ThreatAnalysis } from './threatIntelligence';

export interface ScanRecord {
  id: string;
  url: string;
  scannedAt: Date;
  result: ThreatAnalysis;
}

const STORAGE_KEY = 'qshield_scan_history';

/**
 * Save a scan record to local storage
 */
export function saveScanToHistory(result: ThreatAnalysis): ScanRecord {
  const record: ScanRecord = {
    id: crypto.randomUUID(),
    url: result.originalUrl,
    scannedAt: new Date(),
    result
  };
  
  const history = getScanHistory();
  history.unshift(record);
  
  // Keep only last 50 records
  const trimmedHistory = history.slice(0, 50);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
  
  return record;
}

/**
 * Get all scan history from local storage
 */
export function getScanHistory(): ScanRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((record: any) => ({
      ...record,
      scannedAt: new Date(record.scannedAt)
    }));
  } catch {
    return [];
  }
}

/**
 * Clear all scan history
 */
export function clearScanHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Delete a specific scan record
 */
export function deleteScanRecord(id: string): void {
  const history = getScanHistory();
  const filtered = history.filter(record => record.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Get statistics from scan history
 */
export function getScanStatistics(): {
  totalScans: number;
  safeCount: number;
  suspiciousCount: number;
  maliciousCount: number;
  blockedThreats: number;
} {
  const history = getScanHistory();
  
  return {
    totalScans: history.length,
    safeCount: history.filter(r => r.result.threatLevel === 'safe').length,
    suspiciousCount: history.filter(r => r.result.threatLevel === 'suspicious').length,
    maliciousCount: history.filter(r => r.result.threatLevel === 'malicious').length,
    blockedThreats: history.filter(r => r.result.threatLevel === 'malicious').length
  };
}

/**
 * Export scan history as CSV
 */
export function exportHistoryAsCSV(): string {
  const history = getScanHistory();
  const headers = ['Date', 'URL', 'Domain', 'Threat Level', 'Threat Score', 'Threats'];
  const rows = history.map(r => [
    r.scannedAt.toISOString(),
    `"${r.url.replace(/"/g, '""')}"`,
    r.result.domain,
    r.result.threatLevel,
    r.result.threatScore.toString(),
    `"${(r.result.threats || []).join('; ').replace(/"/g, '""')}"`
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Export scan history as JSON
 */
export function exportHistoryAsJSON(): string {
  const history = getScanHistory();
  const data = history.map(r => ({
    date: r.scannedAt.toISOString(),
    url: r.url,
    domain: r.result.domain,
    threatLevel: r.result.threatLevel,
    threatScore: r.result.threatScore,
    threats: r.result.threats || [],
    expandedUrl: r.result.expandedUrl || null,
  }));
  return JSON.stringify({ exportDate: new Date().toISOString(), scans: data }, null, 2);
}

/**
 * Download data as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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

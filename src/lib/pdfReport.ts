import jsPDF from 'jspdf';
import { ThreatAnalysis } from './threatIntelligence';
import { HeuristicFlag } from './heuristicAnalysis';

export function generateThreatReportPDF(
  result: ThreatAnalysis,
  heuristics: HeuristicFlag[]
): void {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header bar
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, w, 40, 'F');
  doc.setFillColor(0, 255, 0);
  doc.rect(0, 38, w, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 255, 0);
  doc.text('Q-SHIELD', 14, y + 10);

  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('THREAT ANALYSIS REPORT', 14, y + 18);

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, w - 14, y + 10, { align: 'right' });
  doc.text(`Report ID: ${crypto.randomUUID().slice(0, 8).toUpperCase()}`, w - 14, y + 16, { align: 'right' });

  y = 50;

  // Threat level banner
  const levelColors: Record<string, [number, number, number]> = {
    safe: [0, 200, 0],
    suspicious: [230, 180, 0],
    malicious: [230, 0, 0],
  };
  const [r, g, b] = levelColors[result.threatLevel] || [150, 150, 150];
  doc.setFillColor(r, g, b);
  doc.roundedRect(14, y, w - 28, 20, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `${result.threatLevel.toUpperCase()} — Threat Score: ${result.threatScore}/100`,
    w / 2,
    y + 13,
    { align: 'center' }
  );

  y += 30;

  // URL Info section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 200, 0);
  doc.text('URL INFORMATION', 14, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  const urlLines = doc.splitTextToSize(`Original URL: ${result.originalUrl}`, w - 28);
  doc.text(urlLines, 14, y);
  y += urlLines.length * 5 + 2;

  if (result.expandedUrl) {
    const expanded = doc.splitTextToSize(`Expanded URL: ${result.expandedUrl}`, w - 28);
    doc.text(expanded, 14, y);
    y += expanded.length * 5 + 2;
  }

  doc.text(`Domain: ${result.domain}`, 14, y);
  y += 5;
  doc.text(`Scan Duration: ${result.scanDuration}ms`, 14, y);
  y += 5;
  doc.text(`URL Shortened: ${result.isShortened ? 'Yes' : 'No'}`, 14, y);
  y += 12;

  // Heuristic breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 200, 0);
  doc.text('HEURISTIC BREAKDOWN', 14, y);
  y += 8;

  heuristics.forEach(flag => {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }

    const tagColor: Record<string, [number, number, number]> = {
      high: [220, 40, 40],
      warning: [220, 170, 0],
      clean: [0, 180, 0],
    };
    const [tr, tg, tb] = tagColor[flag.severity] || [150, 150, 150];

    // Tag
    doc.setFillColor(tr, tg, tb);
    doc.roundedRect(14, y - 3, 6, 6, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(`${flag.label} [${flag.category}]`, 24, y + 1);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const desc = doc.splitTextToSize(flag.description, w - 38);
    doc.text(desc, 24, y);
    y += desc.length * 4 + 5;
  });

  y += 5;
  if (y > 260) { doc.addPage(); y = 20; }

  // Recommendations
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 200, 0);
  doc.text('RECOMMENDATIONS', 14, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  result.recommendations.forEach(rec => {
    doc.text(`• ${rec}`, 18, y);
    y += 6;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(10, 10, 10);
    doc.rect(0, doc.internal.pageSize.getHeight() - 15, w, 15, 'F');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Q-SHIELD Threat Analysis Report • Confidential', 14, doc.internal.pageSize.getHeight() - 6);
    doc.text(`Page ${i}/${pageCount}`, w - 14, doc.internal.pageSize.getHeight() - 6, { align: 'right' });
  }

  doc.save(`qshield-report-${Date.now()}.pdf`);
}

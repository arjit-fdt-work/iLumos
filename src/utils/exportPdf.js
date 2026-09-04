import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export Claim Chart directly to a professional PDF document
 */
export async function exportClaimChartToPdf({
  claimChart = [],
  uploadedDocs = [],
  systemPrompt = "",
  patentNumber = "US 10,489,122 B2",
  accusedProduct = "Accused Product",
  title = "Patent Infringement Claim Chart"
}) {
  try {
    // 1. Initialize Landscape A4 Document (297 x 210 mm)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // 2. Header Banner & Title
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 26, 'F');

    // Accent line
    doc.setFillColor(99, 102, 241); // indigo-500
    doc.rect(0, 24.5, pageWidth, 1.5, 'F');

    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text("PATENT INFRINGEMENT CLAIM CHART", margin, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text("iLumos AI Legal Copilot Refinement System  •  Confidential Attorney Work Product", margin, 19);

    // Generation timestamp on top right
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Generated: ${dateStr}`, pageWidth - margin, 12, { align: 'right' });
    doc.text(`Asserted Patent: ${patentNumber}`, pageWidth - margin, 19, { align: 'right' });

    // 3. Case Metadata Box
    let currentY = 32;

    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 22, 1.5, 1.5, 'FD');

    // Metadata items (2-column layout)
    doc.setFontSize(8.5);

    // Left Column
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text("Asserted Patent: ", margin + 4, currentY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(patentNumber, margin + 30, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text("Invention Title: ", margin + 4, currentY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitTitle = doc.splitTextToSize(title, 110);
    doc.text(splitTitle[0] || title, margin + 30, currentY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text("Accused Product: ", margin + 4, currentY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text(accusedProduct, margin + 30, currentY + 18);

    // Right Column
    const rightColX = pageWidth / 2 + 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text("Active Standard: ", rightColX, currentY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const shortPrompt = systemPrompt.length > 80 ? `${systemPrompt.slice(0, 77)}...` : systemPrompt;
    doc.text(shortPrompt || "Phillips plain and ordinary meaning; verbatim citations.", rightColX + 27, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text("Indexed Sources: ", rightColX, currentY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const sourcesStr = (uploadedDocs || []).map(d => d.name).join(", ");
    const shortSources = sourcesStr.length > 70 ? `${sourcesStr.slice(0, 67)}...` : (sourcesStr || "Accused Technical Documentation");
    doc.text(shortSources, rightColX + 27, currentY + 12);

    // Statistics breakdown
    const confirmedCount = claimChart.filter(el => el.status === 'confirmed').length;
    const weakCount = claimChart.filter(el => el.status === 'weak').length;
    const unsupportedCount = claimChart.filter(el => el.status === 'unsupported').length;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text("Element Status: ", rightColX, currentY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 163, 74); // green
    doc.text(`${confirmedCount} Confirmed`, rightColX + 27, currentY + 18);
    doc.setTextColor(217, 119, 6); // amber
    doc.text(` •  ${weakCount} Weak`, rightColX + 50, currentY + 18);
    if (unsupportedCount > 0) {
      doc.setTextColor(220, 38, 38); // red
      doc.text(` •  ${unsupportedCount} Unsupported`, rightColX + 70, currentY + 18);
    }

    currentY += 27;

    // 4. Build Table Rows
    const tableData = claimChart.map((item) => {
      const label = item.label || `Element ${item.elementNumber}`;
      const elementText = `${label.toUpperCase()}\n\n${item.claimElement || ''}`;

      let statusBadge = "[STATUS: CONFIRMED]";
      if (item.status === 'weak') statusBadge = "[STATUS: WEAK / NEEDS HARDWARE SPECS]";
      if (item.status === 'unsupported') statusBadge = "[STATUS: UNSUPPORTED]";

      const reasoningText = `${statusBadge}\n\n${item.aiReasoning || ''}`;

      return [
        elementText,
        item.accusedFeature || '',
        reasoningText
      ];
    });

    // 5. Render 3-Column Table with AutoTable
    autoTable(doc, {
      startY: currentY,
      head: [[
        "Asserted Claim Limitation",
        "Accused Product Feature & Evidentiary Citations",
        "AI Legal Reasoning & Infringement Analysis"
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],      // slate-900
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9.5,
        cellPadding: 4,
        halign: 'left',
        valign: 'middle'
      },
      bodyStyles: {
        textColor: [30, 41, 59],       // slate-800
        fontSize: 8.5,
        cellPadding: 4,
        lineColor: [203, 213, 225],    // slate-300
        lineWidth: 0.25,
        valign: 'top'
      },
      columnStyles: {
        0: { cellWidth: 72 },          // Claim limitation
        1: { cellWidth: 108 },         // Accused feature / evidence
        2: { cellWidth: 89 }           // AI legal reasoning
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]     // subtle slate-50 alternating fill
      },
      margin: { left: margin, right: margin, top: 18, bottom: 16 },
      didParseCell: (data) => {
        // Highlight status tag in Column 3
        if (data.section === 'body' && data.column.index === 2) {
          const raw = String(data.cell.raw || "");
          if (raw.startsWith("[STATUS: CONFIRMED]")) {
            // Keep normal or style
          } else if (raw.startsWith("[STATUS: WEAK")) {
            data.cell.styles.textColor = [180, 83, 9]; // amber-700
          } else if (raw.startsWith("[STATUS: UNSUPPORTED")) {
            data.cell.styles.textColor = [185, 28, 28]; // red-700
          }
        }
      },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        const pageCurrent = data.pageNumber;

        // Running compact header on page 2+
        if (pageCurrent > 1) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(
            `PATENT CLAIM CHART: ${patentNumber} vs. ${accusedProduct}`,
            margin,
            12
          );
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, 14, pageWidth - margin, 14);
        }

        // Footer on all pages
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184); // slate-400
        const footerText = `CONFIDENTIAL — ATTORNEY WORK PRODUCT / PREPARED WITH iLUMOS  |  Page ${pageCurrent} of ${pageCount}`;
        doc.text(
          footerText,
          pageWidth / 2,
          pageHeight - 7,
          { align: 'center' }
        );
      }
    });

    // 6. Output PDF and Save
    const cleanPatent = (patentNumber || "US_Patent").replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanProd = (accusedProduct || "Accused_Product").replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Claim_Chart_${cleanPatent}_${cleanProd}.pdf`;

    if (typeof doc.save === 'function') {
      doc.save(fileName);
    } else if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    return true;
  } catch (err) {
    console.error("PDF generation failed:", err);
    throw err;
  }
}

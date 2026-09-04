import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, BorderStyle, HeadingLevel, AlignmentType, ShadingType } from "docx";
import { saveAs } from "file-saver";

export async function exportClaimChartToDocx({
  claimChart,
  uploadedDocs,
  systemPrompt,
  patentNumber = "US 10,489,122 B2",
  accusedProduct = "Acme Smart Thermostat Pro"
}) {
  try {
    // Generate styled rows for the table
    const tableHeader = new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 3000, type: WidthType.DXA },
          shading: { fill: "1E293B", type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Patent Claim Element", bold: true, color: "FFFFFF", size: 20 })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: 4000, type: WidthType.DXA },
          shading: { fill: "1E293B", type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Accused Product Feature (Evidence)", bold: true, color: "FFFFFF", size: 20 })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: 4000, type: WidthType.DXA },
          shading: { fill: "1E293B", type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "AI Infringement Reasoning & Mapping", bold: true, color: "FFFFFF", size: 20 })
              ]
            })
          ]
        })
      ]
    });

    const tableRows = claimChart.map((item) => {
      // Status color text
      let statusColor = "16A34A"; // green
      let statusBg = "DCFCE7";
      if (item.status === "weak") {
        statusColor = "D97706"; // amber
        statusBg = "FEF3C7";
      } else if (item.status === "unsupported") {
        statusColor = "DC2626"; // red
        statusBg = "FEE2E2";
      }

      return new TableRow({
        children: [
          // Column 1: Claim Element
          new TableCell({
            width: { size: 3000, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: item.label || `Element ${item.elementNumber}`, bold: true, color: "0F172A", size: 19 }),
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Status: [${item.status.toUpperCase()}]`, bold: true, color: statusColor, size: 16 }),
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: item.claimElement, size: 18, color: "1E293B" })
                ]
              })
            ]
          }),

          // Column 2: Accused Product Feature
          new TableCell({
            width: { size: 4000, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: item.accusedFeature, size: 18, color: "0F172A" })
                ]
              })
            ]
          }),

          // Column 3: AI Legal Reasoning
          new TableCell({
            width: { size: 4000, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: item.aiReasoning, size: 18, color: "1E293B" })
                ]
              })
            ]
          })
        ]
      });
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              heading: HeadingLevel.TITLE,
              children: [
                new TextRun({
                  text: "iLumos AI Claim Chart Refinement Report",
                  bold: true,
                  size: 32,
                  color: "1E293B"
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Patent: ", bold: true }),
                new TextRun({ text: patentNumber }),
                new TextRun({ text: "  |  Accused Product: ", bold: true }),
                new TextRun({ text: accusedProduct }),
                new TextRun({ text: "  |  Date: ", bold: true }),
                new TextRun({ text: new Date().toLocaleDateString() })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Analysis Strategy / System Prompt: ", bold: true, color: "475569" }),
                new TextRun({ text: `"${systemPrompt}"`, italics: true, color: "475569" })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Referenced Documents: ", bold: true, color: "475569" }),
                new TextRun({ text: uploadedDocs.map(d => d.name).join(", "), color: "475569" })
              ]
            }),
            new Paragraph({ text: "" }), // Spacing

            new Table({
              width: { size: 11000, type: WidthType.DXA },
              rows: [tableHeader, ...tableRows]
            }),

            new Paragraph({ text: "" }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CONFIDENTIAL — ATTORNEY WORK PRODUCT / PREPARED FOR LITIGATION",
                  italics: true,
                  size: 16,
                  color: "64748B"
                })
              ]
            })
          ]
        }
      ]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `iLumos_Claim_Chart_${patentNumber.replace(/\s+/g, "_")}.docx`);
    return true;
  } catch (error) {
    console.error("Docx generation failed, falling back to styled HTML Word export:", error);
    // Fallback export as Word-compatible HTML format
    exportFallbackWordDoc({ claimChart, uploadedDocs, systemPrompt, patentNumber, accusedProduct });
    return true;
  }
}

function exportFallbackWordDoc({ claimChart, uploadedDocs, systemPrompt, patentNumber, accusedProduct }) {
  const tableRowsHtml = claimChart.map(row => `
    <tr>
      <td style="padding:10px; border:1px solid #cbd5e1; vertical-align:top; width:28%;">
        <strong>${row.label || "Element " + row.elementNumber}</strong><br/>
        <span style="font-size:11px; font-weight:bold; color:${row.status === 'confirmed' ? '#16a34a' : row.status === 'weak' ? '#d97706' : '#dc2626'}">
          [${row.status.toUpperCase()}]
        </span><br/><br/>
        ${row.claimElement}
      </td>
      <td style="padding:10px; border:1px solid #cbd5e1; vertical-align:top; width:36%; white-space:pre-wrap;">
        ${row.accusedFeature}
      </td>
      <td style="padding:10px; border:1px solid #cbd5e1; vertical-align:top; width:36%; white-space:pre-wrap;">
        ${row.aiReasoning}
      </td>
    </tr>
  `).join("");

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>iLumos Claim Chart</title></head>
    <body style="font-family:Arial, sans-serif;">
      <h2 style="color:#1e293b;">iLumos AI Claim Chart Refinement Report</h2>
      <p><strong>Patent:</strong> ${patentNumber} | <strong>Accused:</strong> ${accusedProduct} | <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>System Strategy:</strong> <em>"${systemPrompt}"</em></p>
      <p><strong>Uploaded Docs:</strong> ${uploadedDocs.map(d => d.name).join(", ")}</p>
      <table style="width:100%; border-collapse:collapse; margin-top:20px;">
        <thead>
          <tr style="background-color:#1e293b; color:white;">
            <th style="padding:10px; border:1px solid #334155; text-align:left;">Patent Claim Element</th>
            <th style="padding:10px; border:1px solid #334155; text-align:left;">Accused Product Feature (Evidence)</th>
            <th style="padding:10px; border:1px solid #334155; text-align:left;">AI Legal Reasoning & Mapping</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
      <p style="margin-top:30px; font-size:10pt; color:#64748b; font-style:italic;">CONFIDENTIAL — ATTORNEY WORK PRODUCT</p>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
  saveAs(blob, `iLumos_Claim_Chart_${patentNumber.replace(/\s+/g, "_")}.doc`);
}

import { getSavedVerbs } from "./state.js";
import { TENSE_LABELS, PERSON_ORDER, PERSON_LABELS } from "./api.js";

export async function generatePDF() {
  const saved = getSavedVerbs();
  if (saved.length === 0) return;

  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const orange = [255, 92, 54];
  const darkGray = [40, 40, 40];

  // Header
  doc.setFontSize(22);
  doc.setTextColor(...darkGray);
  doc.text("Meine Konjugationen", pageWidth / 2, 25, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  const today = new Date().toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(today, pageWidth / 2, 33, { align: "center" });

  let yPos = 42;

  for (const verb of saved) {
    // Check if we need a new page (rough estimate: table ~50mm)
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    // Verb title + tense
    doc.setFontSize(14);
    doc.setTextColor(...darkGray);
    doc.text(verb.infinitive, 14, yPos);

    doc.setFontSize(9);
    doc.setTextColor(...orange);
    doc.text(TENSE_LABELS[verb.tense], 14 + doc.getTextWidth(verb.infinitive) + 4, yPos);

    yPos += 3;

    // Conjugation table
    const rows = PERSON_ORDER.map((p) => [PERSON_LABELS[p], verb.conjugations[p]]);

    autoTable(doc, {
      startY: yPos,
      head: [["Pronomen", "Konjugation"]],
      body: rows,
      margin: { left: 14, right: 14 },
      theme: "grid",
      headStyles: {
        fillColor: orange,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: darkGray,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: "italic" },
        1: { cellWidth: "auto", fontStyle: "bold" },
      },
    });

    yPos = doc.lastAutoTable.finalY + 12;
  }

  doc.save("meine-konjugationen.pdf");
}

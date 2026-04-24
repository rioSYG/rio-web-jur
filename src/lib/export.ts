import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import type { Journal } from "@/types/journal";

function normalizeFilenamePart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "journal";
}

function readableDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function normalizePdfText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E\n]+/g, "")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function createMetadataLines(journal: Journal) {
  return [
    `Sumber: ${journal.source.toUpperCase()}`,
    `Jurnal: ${journal.journal || "-"}`,
    `Tanggal publikasi: ${readableDate(journal.publishedDate)}`,
    `Penulis: ${journal.authors.join(", ") || "-"}`,
    `DOI: ${journal.doi || "-"}`,
    `PMID: ${journal.pmid || "-"}`,
    `URL: ${journal.fullTextUrl || journal.landingUrl || journal.url}`,
    journal.accessNote ? `Catatan akses: ${journal.accessNote}` : "",
  ].filter(Boolean);
}

export function createExportFilename(journal: Journal, extension: "pdf" | "docx") {
  return `${normalizeFilenamePart(journal.title)}.${extension}`;
}

export async function generateJournalDocx(journal: Journal) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [new TextRun({ text: journal.title, bold: true })],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: "Ekspor detail jurnal dari Journal Search Hub",
                italics: true,
              }),
            ],
          }),
          ...createMetadataLines(journal).map(
            (line) =>
              new Paragraph({
                spacing: { after: 120 },
                children: [new TextRun(line)],
              })
          ),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 160 },
            children: [new TextRun({ text: "Abstrak", bold: true })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun(journal.abstract || "Abstrak tidak tersedia.")],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 160 },
            children: [new TextRun({ text: "Link Akses", bold: true })],
          }),
          new Paragraph(journal.landingUrl || journal.url),
          ...(journal.fullTextUrl && journal.fullTextUrl !== journal.landingUrl
            ? [new Paragraph(journal.fullTextUrl)]
            : []),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export async function generateJournalPdf(journal: Journal) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(journal.title);
  pdfDoc.setAuthor(journal.authors.join(", "));
  pdfDoc.setSubject(journal.journal || "Journal export");

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([595, 842]);
  const margin = 50;
  const maxWidth = page.getWidth() - margin * 2;
  let cursorY = page.getHeight() - margin;

  const ensureSpace = (minHeight = 32) => {
    if (cursorY > margin + minHeight) {
      return;
    }

    page = pdfDoc.addPage([595, 842]);
    cursorY = page.getHeight() - margin;
  };

  const wrapLines = (text: string, size: number, currentFont: typeof font) => {
    const safeText = normalizePdfText(text) || "-";
    const words = safeText.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const width = currentFont.widthOfTextAtSize(candidate, size);
      if (width <= maxWidth || !currentLine) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  const drawParagraph = (text: string, size = 11, currentFont = font, color = rgb(0.17, 0.24, 0.39)) => {
    const lines = wrapLines(text, size, currentFont);
    for (const line of lines) {
      ensureSpace(size + 6);
      page.drawText(line, {
        x: margin,
        y: cursorY,
        size,
        font: currentFont,
        color,
      });
      cursorY -= size + 6;
    }
    cursorY -= 6;
  };

  drawParagraph(journal.title, 20, boldFont, rgb(0.05, 0.14, 0.33));
  drawParagraph("Ekspor detail jurnal dari Journal Search Hub", 10, font, rgb(0.35, 0.42, 0.54));

  for (const line of createMetadataLines(journal)) {
    drawParagraph(line, 10);
  }

  drawParagraph("Abstrak", 14, boldFont, rgb(0.05, 0.14, 0.33));
  drawParagraph(journal.abstract || "Abstrak tidak tersedia.", 11);

  drawParagraph("Link akses", 14, boldFont, rgb(0.05, 0.14, 0.33));
  drawParagraph(journal.landingUrl || journal.url, 10);
  if (journal.fullTextUrl && journal.fullTextUrl !== journal.landingUrl) {
    drawParagraph(journal.fullTextUrl, 10);
  }

  return pdfDoc.save();
}

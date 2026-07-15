const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const { CATEGORIES } = require("./content");

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const INK = rgb(0.13, 0.13, 0.13);
const MUTED = rgb(0.42, 0.42, 0.42);
const ACCENT = rgb(0.72, 0.2, 0.16);

function wrapText(text, font, size, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function generateReportPdf({ name, category, bookingUrl, senderName, senderContact }) {
  const cat = CATEGORIES[category];
  if (!cat) throw new Error(`Ukendt kategori: ${category}`);

  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const newPage = () => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  };

  const ensureSpace = (needed) => {
    if (y - needed < MARGIN) newPage();
  };

  const drawParagraph = (text, { size = 11, font = regular, color = INK, lineGap = 6, spacingAfter = 14 } = {}) => {
    const lines = wrapText(text, font, size, CONTENT_WIDTH);
    for (const line of lines) {
      ensureSpace(size + lineGap);
      page.drawText(line, { x: MARGIN, y, size, font, color });
      y -= size + lineGap;
    }
    y -= spacingAfter;
  };

  // --- Forside ---
  y -= 60;
  page.drawText("Din Bundniveau-Rapport", {
    x: MARGIN,
    y,
    size: 26,
    font: bold,
    color: INK,
  });
  y -= 40;
  page.drawText(`Udarbejdet til ${name}`, {
    x: MARGIN,
    y,
    size: 14,
    font: regular,
    color: MUTED,
  });
  y -= 70;
  page.drawRectangle({ x: MARGIN, y, width: CONTENT_WIDTH, height: 2, color: ACCENT });
  y -= 40;

  // --- Kategori-resultat ---
  page.drawText("Du er:", { x: MARGIN, y, size: 12, font: regular, color: MUTED });
  y -= 22;
  page.drawText(cat.name, { x: MARGIN, y, size: 22, font: bold, color: ACCENT });
  y -= 34;
  drawParagraph(cat.fullText, { size: 12, lineGap: 7, spacingAfter: 20 });

  // --- Hvad det betyder for dig ---
  ensureSpace(30);
  page.drawText("Hvad det betyder for dig", { x: MARGIN, y, size: 16, font: bold, color: INK });
  y -= 26;
  for (const point of cat.whatItMeans) {
    const lines = wrapText(point, regular, 11.5, CONTENT_WIDTH - 16);
    ensureSpace(lines.length * 17 + 6);
    page.drawText("-", { x: MARGIN, y, size: 11.5, font: bold, color: ACCENT });
    lines.forEach((line, i) => {
      page.drawText(line, { x: MARGIN + 14, y: y - i * 17, size: 11.5, font: regular, color: INK });
    });
    y -= lines.length * 17 + 8;
  }
  y -= 12;

  // --- Næste skridt ---
  ensureSpace(80);
  page.drawText("Næste skridt", { x: MARGIN, y, size: 16, font: bold, color: INK });
  y -= 26;
  drawParagraph(
    "Hvis du vil have hjælp til at omsætte det her til et konkret system, der virker for dig, kan du booke en uforpligtende samtale her:",
    { size: 11.5, lineGap: 6, spacingAfter: 8 }
  );
  page.drawText(bookingUrl, { x: MARGIN, y, size: 11.5, font: bold, color: ACCENT });
  y -= 40;

  // --- Footer ---
  ensureSpace(60);
  page.drawRectangle({ x: MARGIN, y, width: CONTENT_WIDTH, height: 1, color: rgb(0.85, 0.85, 0.85) });
  y -= 20;
  page.drawText(senderName, { x: MARGIN, y, size: 11, font: bold, color: INK });
  y -= 16;
  page.drawText(senderContact, { x: MARGIN, y, size: 10, font: regular, color: MUTED });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

module.exports = { generateReportPdf };

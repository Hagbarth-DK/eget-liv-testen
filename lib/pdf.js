const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const { CATEGORY_CONTENT } = require("./categoryContent");

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const MAX_SCORE = 7;

const INK = rgb(0.13, 0.13, 0.13);
const MUTED = rgb(0.42, 0.42, 0.42);
const ACCENT = rgb(0.72, 0.2, 0.16);
const TRACK = rgb(0.9, 0.87, 0.83);

const DANISH_MONTHS = [
  "januar", "februar", "marts", "april", "maj", "juni",
  "juli", "august", "september", "oktober", "november", "december",
];

function formatDanishDate(date) {
  return `${date.getDate()}. ${DANISH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

async function generateReportPdf({ name, category, scores, bookingUrl, senderName, senderContact }) {
  const cat = CATEGORY_CONTENT[category];
  if (!cat) throw new Error(`Ukendt kategori: ${category}`);

  const cleanName = name.trim();
  const title = `${cleanName}: Sådan ser dit mønster som ${cat.name} ud`;
  const filename = `${slugify(cleanName)}-${slugify(cat.name)}.pdf`;

  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page;
  let y;

  const newPage = () => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
    return page;
  };

  const ensureSpace = (needed) => {
    if (y - needed < MARGIN) newPage();
  };

  const drawParagraph = (text, { size = 11, font = regular, color = INK, lineGap = 6, spacingAfter = 14, x = MARGIN, maxWidth = CONTENT_WIDTH } = {}) => {
    const lines = wrapText(text, font, size, maxWidth);
    for (const line of lines) {
      ensureSpace(size + lineGap);
      page.drawText(line, { x, y, size, font, color });
      y -= size + lineGap;
    }
    y -= spacingAfter;
  };

  const drawHeading = (text, { size = 16, spacingAfter = 20 } = {}) => {
    ensureSpace(size + spacingAfter);
    page.drawText(text, { x: MARGIN, y, size, font: bold, color: INK });
    y -= size + spacingAfter;
  };

  const drawBullets = (items, { size = 11.5, lineGap = 17, spacingAfter = 8 } = {}) => {
    for (const item of items) {
      const lines = wrapText(item, regular, size, CONTENT_WIDTH - 16);
      ensureSpace(lines.length * lineGap + 6);
      page.drawText("-", { x: MARGIN, y, size, font: bold, color: ACCENT });
      lines.forEach((line, i) => {
        page.drawText(line, { x: MARGIN + 14, y: y - i * lineGap, size, font: regular, color: INK });
      });
      y -= lines.length * lineGap + spacingAfter;
    }
  };

  // ==================== SIDE 1 — Forside ====================
  newPage();
  y -= 90;
  const titleLines = wrapText(title, bold, 25, CONTENT_WIDTH);
  for (const line of titleLines) {
    page.drawText(line, { x: MARGIN, y, size: 25, font: bold, color: INK });
    y -= 32;
  }
  y -= 12;
  page.drawText("Din personlige diagnose, baseret på dine egne svar.", {
    x: MARGIN, y, size: 13, font: regular, color: MUTED,
  });
  y -= 30;
  page.drawRectangle({ x: MARGIN, y, width: CONTENT_WIDTH, height: 2, color: ACCENT });
  y -= 24;
  page.drawText(formatDanishDate(new Date()), { x: MARGIN, y, size: 11, font: regular, color: MUTED });

  y = MARGIN + 30;
  page.drawRectangle({ x: MARGIN, y, width: CONTENT_WIDTH, height: 1, color: rgb(0.85, 0.85, 0.85) });
  y -= 20;
  page.drawText(senderName, { x: MARGIN, y, size: 11, font: bold, color: INK });

  // ==================== SIDE 2 — Score-visualisering ====================
  newPage();
  drawHeading("Din score", { spacingAfter: 8 });
  drawParagraph(
    "Hvert af de 7 spørgsmål, du svarede på, gav point til ét af tre mønstre. Sådan fordelte dine svar sig:",
    { size: 12, spacingAfter: 26 }
  );

  const barMaxWidth = 280;
  const barHeight = 18;
  const barLabelWidth = 150;
  const orderedCodes = ["TOP", "SPR", "UDS"];
  const winnerScore = scores[category];

  for (const code of orderedCodes) {
    const isWinner = code === category;
    const score = scores[code] || 0;
    const barWidth = Math.max((score / MAX_SCORE) * barMaxWidth, 2);

    ensureSpace(barHeight + 22);
    const labelFont = isWinner ? bold : regular;
    const labelColor = isWinner ? ACCENT : MUTED;
    page.drawText(CATEGORY_CONTENT[code].name, {
      x: MARGIN, y: y + 4, size: 11, font: labelFont, color: labelColor,
    });

    const barX = MARGIN + barLabelWidth;
    page.drawRectangle({ x: barX, y, width: barMaxWidth, height: barHeight, color: TRACK });
    page.drawRectangle({ x: barX, y, width: barWidth, height: barHeight, color: isWinner ? ACCENT : rgb(0.6, 0.56, 0.52) });
    page.drawText(`${score}/${MAX_SCORE}`, {
      x: barX + barMaxWidth + 10, y: y + 4, size: 11, font: labelFont, color: labelColor,
    });

    y -= barHeight + 22;
  }

  y -= 10;
  drawParagraph(
    `${cat.name} fik flest point i din besvarelse (${winnerScore} ud af ${MAX_SCORE}) — det gør den til dit tydeligste mønster lige nu.`,
    { size: 12, spacingAfter: 10 }
  );

  // ==================== SIDE 3 — Fuld kategori-analyse ====================
  newPage();
  page.drawText("Du er:", { x: MARGIN, y, size: 12, font: regular, color: MUTED });
  y -= 22;
  page.drawText(cat.name, { x: MARGIN, y, size: 22, font: bold, color: ACCENT });
  y -= 34;

  drawParagraph(cat.fullText, { size: 12, lineGap: 7, spacingAfter: 20 });

  drawHeading("Hvorfor det sker", { size: 15, spacingAfter: 14 });
  drawParagraph(cat.whyItHappens, { size: 11.5, lineGap: 6, spacingAfter: 18 });

  drawHeading("Sådan viser mønstret sig i hverdagen", { size: 15, spacingAfter: 14 });
  drawBullets(cat.everydayExamples);

  // ==================== SIDE 4 — Næste skridt (identisk for alle kategorier) ====================
  newPage();
  drawHeading("Næste skridt", { size: 20, spacingAfter: 16 });

  drawParagraph(
    "Din udfordring er ikke motivation. Det har den aldrig været. Det er, at du mangler en mekanisk struktur, der virker, selv på de dage, hvor du ikke gider — og de dage kommer altid.",
    { size: 12, lineGap: 7, spacingAfter: 16 }
  );
  drawParagraph(
    "B.U.N.D. er den struktur. Ikke endnu en motivationsteknik, du glemmer om tre uger. Et system, du bygger én gang, baseret på dit bundniveau i stedet for dit topniveau — så det holder, uanset hvordan dagen ser ud.",
    { size: 12, lineGap: 7, spacingAfter: 20 }
  );

  drawHeading("Testpilot-tilbud", { size: 15, spacingAfter: 12 });
  drawParagraph(
    "Vi tester lige nu B.U.N.D. med 6-8 mennesker. Testpilot-pris: 4.995 kr. Normalpris ved lancering: 15.000-18.000 kr.",
    { size: 11.5, lineGap: 6, spacingAfter: 16 }
  );
  drawParagraph(
    "4.995 kr. er mindre, end du taber på én måned, hvor du udskyder det vigtigste i din forretning. Regn selv efter, hvad de sidste 12 udskudte mandage reelt har kostet dig.",
    { size: 11.5, lineGap: 6, spacingAfter: 16 }
  );
  drawParagraph(
    "Vi lukker for testpilot-pladser, når nummer 8 er booket — ikke en dag senere.",
    { size: 11.5, font: bold, lineGap: 6, spacingAfter: 24 }
  );

  ensureSpace(60);
  page.drawText("Book en samtale, og find ud af om du er en af dem:", { x: MARGIN, y, size: 12, font: bold, color: INK });
  y -= 20;
  page.drawText(bookingUrl, { x: MARGIN, y, size: 12, font: bold, color: ACCENT });
  y -= 40;

  ensureSpace(60);
  page.drawRectangle({ x: MARGIN, y, width: CONTENT_WIDTH, height: 1, color: rgb(0.85, 0.85, 0.85) });
  y -= 20;
  page.drawText(senderName, { x: MARGIN, y, size: 11, font: bold, color: INK });
  y -= 16;
  page.drawText(senderContact, { x: MARGIN, y, size: 10, font: regular, color: MUTED });

  const bytes = await doc.save();
  return { buffer: Buffer.from(bytes), filename, title };
}

module.exports = { generateReportPdf };

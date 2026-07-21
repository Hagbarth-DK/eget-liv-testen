const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const { CATEGORY_CONTENT } = require("./categoryContent");

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 57; // ~20mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const MAX_SCORE = 7;

// §3.6 design-spec farver
const INK = rgb(0x1a / 255, 0x1a / 255, 0x1a / 255); // #1A1A1A
const ACCENT = rgb(0xb3 / 255, 0x12 / 255, 0x1b / 255); // #B3121B
const MUTED = rgb(0x99 / 255, 0x99 / 255, 0x99 / 255); // #999999

const FOOTER_TEXT = "Hagbarth Skjold Andersen — hagbarthandersen.com";

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

async function generateReportPdf({ name, primaryCategory, secondaryCategory, scores, bookingUrl, senderName, senderContact }) {
  const cat = CATEGORY_CONTENT[primaryCategory];
  if (!cat) throw new Error(`Ukendt primær kategori: ${primaryCategory}`);

  const cleanName = name.trim();
  const title = `${cleanName}: Sådan ser dit mønster som ${cat.name} ud`;
  const filename = `${slugify(cleanName)}-${slugify(cat.name)}.pdf`;

  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page;
  let y;

  const drawTinyFooter = () => {
    const size = 8.5;
    const textWidth = regular.widthOfTextAtSize(FOOTER_TEXT, size);
    page.drawText(FOOTER_TEXT, { x: (PAGE_WIDTH - textWidth) / 2, y: 24, size, font: regular, color: MUTED });
  };

  const newPage = () => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
    drawTinyFooter();
    return page;
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

  const drawHeading = (text, { size = 19, spacingAfter = 20, color = ACCENT } = {}) => {
    ensureSpace(size + spacingAfter);
    page.drawText(text, { x: MARGIN, y, size, font: bold, color });
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
  y -= 80;
  const titleLines = wrapText(title, bold, 30, CONTENT_WIDTH);
  for (const line of titleLines) {
    page.drawText(line, { x: MARGIN, y, size: 30, font: bold, color: INK });
    y -= 36;
  }
  y -= 8;
  page.drawText("Din personlige diagnose, baseret på dine egne svar.", {
    x: MARGIN, y, size: 13, font: regular, color: MUTED,
  });
  y -= 26;
  page.drawRectangle({ x: MARGIN, y, width: CONTENT_WIDTH, height: 2, color: ACCENT });
  y -= 34;

  drawParagraph(
    "På side 3 finder du ud af præcis hvorfor — og hvad det helt konkret koster dig, hvis du fortsætter på denne måde.",
    { size: 12, font: bold, lineGap: 6, spacingAfter: 18 }
  );
  drawParagraph(
    "De fleste bliver ved med at leve med samme mønster, i stedet for at se nærmere på det. Du gjorde noget andet — du tog testen. Det er ikke en lille ting. Det er det første, reelle skridt.",
    { size: 12, lineGap: 7, spacingAfter: 10 }
  );

  y = MARGIN + 30;
  page.drawText(formatDanishDate(new Date()), { x: MARGIN, y: y + 20, size: 11, font: regular, color: MUTED });
  page.drawRectangle({ x: MARGIN, y, width: CONTENT_WIDTH, height: 1, color: rgb(0.85, 0.85, 0.85) });
  y -= 20;
  page.drawText(senderName, { x: MARGIN, y, size: 11, font: bold, color: INK });

  // ==================== SIDE 2 — Din score ====================
  newPage();
  drawHeading("Din score", { spacingAfter: 8 });
  drawParagraph(
    "Hvert af de 7 spørgsmål afslørede noget om, hvordan du reagerer, når presset stiger. Sådan fordelte dine svar sig:",
    { size: 12, spacingAfter: 26 }
  );

  const barMaxWidth = 220;
  const barHeight = 16;
  const barLabelWidth = 190;
  const orderedCodes = ["TOP", "SPR", "UDS"];
  const primaryScore = scores[primaryCategory];

  for (const code of orderedCodes) {
    const isPrimary = code === primaryCategory;
    const score = scores[code] || 0;
    const barWidth = Math.max((score / MAX_SCORE) * barMaxWidth, 2);

    ensureSpace(barHeight + 22);
    const labelFont = isPrimary ? bold : regular;
    const labelColor = isPrimary ? ACCENT : MUTED;
    page.drawText(`${CATEGORY_CONTENT[code].name}: ${score}/${MAX_SCORE}`, {
      x: MARGIN, y: y + 3, size: 11, font: labelFont, color: labelColor,
    });

    const barX = MARGIN + barLabelWidth;
    if (isPrimary) {
      page.drawRectangle({ x: barX, y, width: barWidth, height: barHeight, color: ACCENT });
    } else {
      page.drawRectangle({ x: barX, y, width: barWidth, height: barHeight, borderColor: MUTED, borderWidth: 1 });
    }

    y -= barHeight + 22;
  }

  y -= 6;

  if (primaryScore >= 5) {
    drawParagraph(
      `${primaryScore} ud af 7 svar pegede samme vej. Det er ikke tilfældigt. Det er et mønster, der har kørt så længe, at det nu føles som en del af din personlighed. Det er det ikke. Det er et mønster. Og mønstre kan brydes. ${cleanName}, din klareste tendens lige nu er ${cat.name}.`,
      { size: 12, lineGap: 7, spacingAfter: 14 }
    );
  } else {
    drawParagraph(
      `Dit mønster er mindre entydigt end for de fleste, ${cleanName} — men ${cat.name} trådte alligevel tydeligst frem. Det er stadig værd at tage alvorligt: selv et mønster, der ikke dominerer hver dag, er nok til at holde dig fast, når det tæller mest.`,
      { size: 12, lineGap: 7, spacingAfter: 14 }
    );
  }

  if (secondaryCategory && CATEGORY_CONTENT[secondaryCategory]) {
    drawParagraph(CATEGORY_CONTENT[secondaryCategory].secondaryLine, { size: 12, lineGap: 7, spacingAfter: 14 });
  }

  drawParagraph("Vi går i dybden med dit primære mønster på næste side.", { size: 12, font: bold, spacingAfter: 10 });

  // ==================== SIDE 3 — Kategori-analyse (primær) ====================
  newPage();
  drawHeading(`${cleanName}s mønster: ${cat.name}`, { size: 20, spacingAfter: 22 });

  drawHeading("Hvorfor det sker", { size: 15, spacingAfter: 14 });
  drawParagraph(cat.whyItHappens, { size: 11.5, lineGap: 6, spacingAfter: 18 });

  drawHeading("Typiske tegn", { size: 15, spacingAfter: 14 });
  drawBullets(cat.typicalSigns);
  y -= 4;

  drawHeading("Hvad det betyder for dig", { size: 15, spacingAfter: 14 });
  drawParagraph(cat.whatItMeansForYou, { size: 11.5, lineGap: 6, spacingAfter: 10 });

  // ==================== SIDE 4 — Broen fra diagnose til løsning (fælles) ====================
  newPage();
  drawHeading("Broen fra diagnose til løsning", { size: 20, spacingAfter: 16 });

  drawParagraph(
    "Din udfordring er ikke motivation. Det har den aldrig været. Du mangler en mekanisk struktur, der virker, selv på de dage, hvor du ikke gider. Og de dage kommer altid.",
    { size: 12, lineGap: 7, spacingAfter: 14 }
  );
  drawParagraph(
    "B.U.N.D. er den struktur — bygget én gang, baseret på dit bundniveau i stedet for dit topniveau. Ikke endnu en motivationsteknik, du glemmer om tre uger, men noget der holder, uanset hvordan dagen ser ud.",
    { size: 12, lineGap: 7, spacingAfter: 20 }
  );

  drawHeading("Hvorfor B.U.N.D. findes", { size: 15, spacingAfter: 12 });
  drawParagraph(
    "Jeg er systemarkitekt — men ikke af den slags, der bygger it-systemer. Jeg bygger systemer for mennesker. Jeg har altid været optaget af ét spørgsmål: hvorfor gør vi ikke det, vi selv siger, vi vil? Ikke fordi vi mangler motivation og viljestyrke. Men fordi der næsten altid er en kløft mellem, hvad vi beslutter i vores hoved, og hvad vi rent faktisk gør, når det gælder. B.U.N.D. er født af den nysgerrighed — og af mine egne erfaringer med at sige én ting og gøre noget andet. Jeg byggede det, fordi jeg selv havde brug for det.",
    { size: 11.5, lineGap: 6, spacingAfter: 20 }
  );

  drawHeading("Det, mønsteret allerede har kostet dig", { size: 15, spacingAfter: 12 });
  drawParagraph(
    "Tænk tilbage på, hvor længe det her har kørt. Ikke ugen. Månederne. Måske årene. Hver gang du har ventet på den rigtige dag, den der aldrig kom, er der gået tid, du ikke får igen. Uanset hvad du vælger nu, kommer den tid ikke tilbage.",
    { size: 11.5, lineGap: 6, spacingAfter: 20 }
  );

  drawHeading("Det, det vil koste dig, hvis intet ændrer sig", { size: 15, spacingAfter: 12 });
  drawParagraph(
    "Spol frem 12 måneder. Det er en søndag aften igen. Samme notesbog. Samme plan. Samme løfte om, at denne gang bliver anderledes.",
    { size: 11.5, lineGap: 6, spacingAfter: 14 }
  );
  drawParagraph(
    "Forskellen er kun, at du nu har et år mere erfaring i at bryde det løfte. Endnu et år, hvor \"jeg starter mandag\" er blevet sagt, men ikke holdt. Endnu et år, hvor de projekter, du vidste ville rykke dig fremad, stadig ligger som gode intentioner.",
    { size: 11.5, lineGap: 6, spacingAfter: 14 }
  );
  drawParagraph(
    "På papiret er du ikke nødvendigvis dårligere stillet. Men noget andet er sket, langsomt og umærkeligt: du stoler lidt mindre på dig selv, end du gjorde for et år siden. Det er den egentlige pris.",
    { size: 11.5, lineGap: 6, spacingAfter: 14 }
  );
  drawParagraph(
    "Mønstret retter ikke sig selv. Det forstærker sig selv, jo længere det får lov at køre.",
    { size: 11.5, font: bold, lineGap: 6, spacingAfter: 16 }
  );
  drawParagraph(
    "Nu ved du hvorfor. Hvis du er klar til at gøre noget ved det, har jeg stadig en plads til dig på næste side. Hvis ikke, er det også helt OK.",
    { size: 11.5, lineGap: 6, spacingAfter: 10 }
  );

  // ==================== SIDE 5 — Tilbuddet (fælles) ====================
  newPage();
  drawParagraph(
    "Du bliver ikke bare kunde. Du er med til at forme systemet.",
    { size: 15, font: bold, color: ACCENT, spacingAfter: 12 }
  );
  drawParagraph(
    "De 6-8, der kommer med nu, får reel indflydelse på, hvordan B.U.N.D. ser ud, når det lanceres til fuld pris — jeres feedback former funktionerne, strukturen og indholdet.",
    { size: 12, lineGap: 7, spacingAfter: 20 }
  );

  drawHeading("Garantien", { size: 15, spacingAfter: 12 });
  drawParagraph(
    "Følg systemet i 4 uger. Udover en ugentlig undervisning, sender vi dig et kort check-in: har du fulgt systemet denne uge, ja eller nej. Ved uge 4 tager du Bundniveau-Testen igen, og vi holder en personlig samtale sammen, hvor vi ser på resultatet og dine check-ins og finder ud af, om det virker for dig. Gør det ikke, retter vi det sammen — uden ekstra omkostning.",
    { size: 11.5, lineGap: 6, spacingAfter: 20 }
  );

  drawHeading("Testpilot-tilbud", { size: 15, spacingAfter: 12 });
  drawParagraph(
    "Testpilot-pris: 4.995 kr. Normalpris ved lancering: 15.000-18.000 kr.",
    { size: 12, font: bold, lineGap: 6, spacingAfter: 14 }
  );
  drawParagraph(
    "Det er ikke en rabat — det er betaling for at hjælpe med at forfine systemet undervejs. Til gengæld får du adgang, direkte kontakt til mig, og garantien ovenfor, længe før nogen andre kan købe det.",
    { size: 11.5, lineGap: 6, spacingAfter: 14 }
  );
  drawParagraph(
    "Ved at deltage som testpilot accepterer du samtidig, at jeg må bruge din feedback og dine resultater i markedsføring af B.U.N.D. — anonymiseret eller med navn, alt efter hvad vi aftaler sammen.",
    { size: 11.5, lineGap: 6, spacingAfter: 14 }
  );
  drawParagraph(
    "4.995 kr. er mindre, end du taber på én måned, hvor du udskyder det vigtigste i din forretning. Regn selv efter, hvad tiden med dette mønster allerede har kostet dig. Og hvad endnu et år vil koste, hvis intet ændrer sig.",
    { size: 11.5, lineGap: 6, spacingAfter: 14 }
  );
  drawParagraph(
    "Vi lukker for testpilot-pladser, når nummer 8 er booket. Ikke en dag senere.",
    { size: 11.5, font: bold, lineGap: 6, spacingAfter: 20 }
  );

  drawParagraph(
    "Det her er ikke for alle. Leder du efter endnu et quick-fix, eller er du ikke klar til at eksekvere de næste 4 uger, så spar din tid, og min. Men er du færdig med at love dig selv mandage, du alligevel ikke holder, så lad os tale sammen.",
    { size: 11.5, lineGap: 6, spacingAfter: 14 }
  );
  drawParagraph("Hvis ikke nu, hvornår så?", { size: 13, font: bold, spacingAfter: 24 });

  ensureSpace(60);
  page.drawText("Book din optagelsessamtale — vi skal begge se, om det er et match:", {
    x: MARGIN, y, size: 12, font: bold, color: INK,
  });
  y -= 20;
  page.drawText(bookingUrl, { x: MARGIN, y, size: 12, font: bold, color: ACCENT });

  const bytes = await doc.save();
  return { buffer: Buffer.from(bytes), filename, title };
}

module.exports = { generateReportPdf };

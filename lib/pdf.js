const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const { CATEGORY_CONTENT, MIXED_CONTENT, STABLE_CONTENT, secondaryLine } = require("./categoryContent");

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 57; // ~20mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const MAX_SCORE = 7;

// §9 designretning: varm off-white, grafit, dæmpet olivengrøn, diskret mat guld
const PAGE_BG = rgb(0xfa / 255, 0xf7 / 255, 0xf0 / 255); // varm off-white
const INK = rgb(0x36 / 255, 0x36 / 255, 0x36 / 255); // grafit
const ACCENT = rgb(0x6e / 255, 0x75 / 255, 0x54 / 255); // dæmpet olivengrøn
const GOLD = rgb(0xb8 / 255, 0x96 / 255, 0x5a / 255); // diskret mat guld
const MUTED = rgb(0x8c / 255, 0x8c / 255, 0x8c / 255);

const DANISH_MONTHS = [
  "januar", "februar", "marts", "april", "maj", "juni",
  "juli", "august", "september", "oktober", "november", "december",
];

const BUND_LEDS = [
  { letter: "B", action: "Beslut retningen", benefit: "Klarhed over, hvad der vælges — og hvad ikke at vælge koster." },
  { letter: "U", action: "Udvælg de tre nåleflyttende aktiviteter", benefit: "Fokus på de få handlinger, der faktisk skaber fremdrift." },
  { letter: "N", action: "Nedskalér til et minimum, der stadig tæller", benefit: "Kontinuitet på dårlige dage i stedet for fuldt stop." },
  { letter: "D", action: "Driftssikr din hverdag", benefit: "En uge- og dagsstruktur med forhindringsplan, review og genstart." },
];

const AFTER_FOUR_WEEKS = [
  "Et udfyldt T-Kryds med ønsket retning, udbytte og den reelle pris ved ikke at handle.",
  "Tre prioriterede aktiviteter, som du selv har direkte indflydelse på.",
  "Et normalniveau og et minimumsniveau, der gør handling mulig på dårlige dage.",
  "En konkret plan for kendte interne og eksterne forhindringer.",
  "En enkel uge- og dagsstruktur med review og genstartregel.",
];

const WHAT_YOU_GET = [
  "Fire ugentlige moduler med konkrete øvelser og arbejdsark.",
  "T-Krydset og B.U.N.D.-modellen omsat til dit eget mål og din hverdag.",
  "Personlig sparring og direkte feedback undervejs.",
  "Et kort ugentligt check-in, der måler på handling — ikke kun på oplevelse.",
  "En ny Bundniveau-Test og en afsluttende samtale, hvor systemet evalueres og justeres.",
];

const MATCH_CRITERIA = [
  "du har et vigtigt mål, men mangler stabil eksekvering i hverdagen.",
  "du er villig til at vælge få aktiviteter og arbejde med dem i fire uger.",
  "du vil måles på konkret handling og give ærlig feedback.",
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

function getResultTitle(resultType, primaryName, mixedBName) {
  switch (resultType) {
    case "TYDELIGT":
      return primaryName;
    case "TENDENS":
      return `Tendens til ${primaryName}`;
    case "BLANDET":
      return `${primaryName} + ${mixedBName}`;
    default:
      return STABLE_CONTENT.title;
  }
}

async function generateReportPdf({
  name, scores, resultType, primaryCategory, secondaryCategory, mixedCategoryB,
  answerQ3, answerQ5, bookingUrl, senderName,
}) {
  const cleanName = name.trim();
  const primaryContent = primaryCategory ? CATEGORY_CONTENT[primaryCategory] : null;
  const mixedBContent = mixedCategoryB ? CATEGORY_CONTENT[mixedCategoryB] : null;
  const resultTitle = getResultTitle(resultType, primaryContent && primaryContent.name, mixedBContent && mixedBContent.name);

  const emailSubject = `${cleanName}, din Bundniveau-Profil er klar`;
  const filename = `${slugify(cleanName)}-bundniveau-profil.pdf`;

  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  let page;
  let y;

  const newPage = () => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: PAGE_BG });
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

  const drawHeading = (text, { size = 18, spacingAfter = 18, color = ACCENT } = {}) => {
    const lines = wrapText(text, bold, size, CONTENT_WIDTH);
    for (const line of lines) {
      ensureSpace(size + 6);
      page.drawText(line, { x: MARGIN, y, size, font: bold, color });
      y -= size + 6;
    }
    y -= spacingAfter;
  };

  const drawBullets = (items, { size = 11, lineGap = 16, spacingAfter = 8, indent = 14 } = {}) => {
    for (const item of items) {
      const lines = wrapText(item, regular, size, CONTENT_WIDTH - indent);
      ensureSpace(lines.length * lineGap + 6);
      page.drawText("-", { x: MARGIN, y, size, font: bold, color: ACCENT });
      lines.forEach((line, i) => {
        page.drawText(line, { x: MARGIN + indent, y: y - i * lineGap, size, font: regular, color: INK });
      });
      y -= lines.length * lineGap + spacingAfter;
    }
  };

  const drawBox = (drawInner, { paddingY = 16 } = {}) => {
    const boxStartY = y;
    y -= paddingY;
    drawInner();
    const boxEndY = y;
    page.drawRectangle({
      x: MARGIN - 12, y: boxEndY, width: CONTENT_WIDTH + 24, height: boxStartY - boxEndY,
      borderColor: GOLD, borderWidth: 1,
    });
    y -= paddingY;
  };

  // ==================== SIDE 1 — Forside ====================
  newPage();
  y -= 40;
  page.drawText("DIN BUNDNIVEAU-PROFIL", { x: MARGIN, y, size: 11, font: bold, color: GOLD });
  y -= 34;

  const headline = `${cleanName}, dit resultat peger på: ${resultTitle}`;
  const headlineLines = wrapText(headline, bold, 24, CONTENT_WIDTH);
  for (const line of headlineLines) {
    page.drawText(line, { x: MARGIN, y, size: 24, font: bold, color: INK });
    y -= 30;
  }
  y -= 8;
  drawParagraph(
    "Et personligt øjebliksbillede af, hvad der typisk sker mellem beslutning og handling — især når dagen bliver presset, uforudsigelig eller mindre end perfekt.",
    { size: 12, color: MUTED, lineGap: 6, spacingAfter: 20 }
  );

  drawBox(() => {
    drawParagraph(
      "Din profil er baseret på de svar, du netop har givet. Den viser et adfærdsmønster og en tendens — ikke en fast personlighed og ikke en psykologisk vurdering.",
      { size: 10.5, lineGap: 5, spacingAfter: 0 }
    );
  });
  y -= 16;

  drawParagraph(
    "De fleste forsøger at løse problemet ved at presse sig selv hårdere, finde en ny metode eller love sig selv, at næste mandag bliver anderledes. Du stoppede op og undersøgte mønstret. På side 2 ser du din pointfordeling. På side 3 får du forklaringen på dit tydeligste mønster. På side 4 ser du, hvilket fundament der skal på plads, hvis din forandring skal kunne holde på mere end gode dage.",
    { size: 11.5, lineGap: 6, spacingAfter: 10 }
  );

  y = MARGIN + 20;
  page.drawText(`${formatDanishDate(new Date())} · ${senderName}`, { x: MARGIN, y, size: 10, font: regular, color: MUTED });

  // ==================== SIDE 2 — Din pointfordeling ====================
  newPage();
  drawHeading("Din pointfordeling", { spacingAfter: 10 });
  drawParagraph(
    "De syv spørgsmål undersøgte ikke, hvor ambitiøs eller dygtig du er. De undersøgte, hvad du typisk gør, når intentionen møder virkeligheden.",
    { size: 12, spacingAfter: 24 }
  );

  const barMaxWidth = 220;
  const barHeight = 16;
  const barLabelWidth = 190;
  const barTrack = rgb(0xe4 / 255, 0xe0 / 255, 0xd4 / 255);
  const orderedCodes = ["TOP", "SPR", "UDS"];
  const highlighted = new Set([primaryCategory, mixedCategoryB].filter(Boolean));

  // §9 proportionalitetsprincip: alle tre bjælker fyldes ALTID med samme farve,
  // og bredden er strengt proportional med point/7 — uafhængigt af Mønster A/B-omtale.
  // Kun labelteksten (ikke selve bjælken) må fremhæves for det/de omtalte mønstre.
  for (const code of orderedCodes) {
    const isHighlighted = highlighted.has(code);
    const score = scores[code] || 0;
    const barWidth = Math.max((score / MAX_SCORE) * barMaxWidth, 2);

    ensureSpace(barHeight + 20);
    const labelFont = isHighlighted ? bold : regular;
    const labelColor = isHighlighted ? ACCENT : MUTED;
    page.drawText(`${CATEGORY_CONTENT[code].name}: ${score}/${MAX_SCORE}`, {
      x: MARGIN, y: y + 3, size: 11, font: labelFont, color: labelColor,
    });

    const barX = MARGIN + barLabelWidth;
    page.drawRectangle({ x: barX, y, width: barMaxWidth, height: barHeight, color: barTrack });
    page.drawRectangle({ x: barX, y, width: barWidth, height: barHeight, color: ACCENT });
    y -= barHeight + 20;
  }

  y -= 8;

  const primaryScore = primaryCategory ? scores[primaryCategory] : null;
  if (resultType === "TYDELIGT") {
    drawParagraph(
      `${primaryScore} af dine 7 svar pegede på ${primaryContent.name}, og mønstret ligger tydeligt foran de øvrige. Det betyder ikke, at det beskriver dig hele tiden. Det betyder, at det er den strategi, du oftest falder tilbage på, når presset stiger eller hverdagen skrider.`,
      { size: 12, lineGap: 7, spacingAfter: 14 }
    );
  } else if (resultType === "TENDENS") {
    drawParagraph(
      `Dine svar viser en tendens til ${primaryContent.name}. Mønstret styrer ikke nødvendigvis din hverdag, men det dukker ofte nok op til at bremse dig, når noget er vigtigt, svært eller uforudsigeligt.`,
      { size: 12, lineGap: 7, spacingAfter: 14 }
    );
  } else if (resultType === "BLANDET") {
    drawParagraph(
      `Dine svar fordeler sig især mellem ${primaryContent.name} og ${mixedBContent.name}. Det er ikke et modstridende resultat. Det viser, at din reaktion ændrer sig med situationen: Nogle gange hæver du kravene, nogle gange spreder du fokus, og andre gange udsætter du starten. Fællesnævneren er, at du mangler én stabil struktur, der virker på tværs af situationerne.`,
      { size: 12, lineGap: 7, spacingAfter: 14 }
    );
  } else {
    drawParagraph(
      "Ingen af de tre mønstre scorer mere end 1 point. Det tyder på, at du allerede har et forholdsvis stabilt bundniveau og ofte kan justere uden at stoppe helt. Testen kan ikke bevise, at du aldrig går i stå — men den viser, at ét bestemt mønster ikke dominerer dine svar.",
      { size: 12, lineGap: 7, spacingAfter: 14 }
    );
  }

  if (secondaryCategory) {
    drawParagraph(secondaryLine(CATEGORY_CONTENT[secondaryCategory].name), { size: 12, lineGap: 7, spacingAfter: 14 });
  }

  if (answerQ3) {
    drawParagraph(`På en dårlig dag: "${answerQ3}"`, { size: 11.5, font: italic, lineGap: 6, spacingAfter: 6 });
  }
  if (answerQ5) {
    drawParagraph(`Når planen bliver forstyrret: "${answerQ5}"`, { size: 11.5, font: italic, lineGap: 6, spacingAfter: 10 });
  }
  if (answerQ3 || answerQ5) {
    drawParagraph(
      "De to svar vægter ikke mere i pointberegningen end de øvrige. De gør blot dit mønster lettere at genkende i praksis.",
      { size: 10.5, color: MUTED, lineGap: 5, spacingAfter: 10 }
    );
  }

  // ==================== SIDE 3 — Dynamisk mønsteranalyse ====================
  newPage();
  if (resultType === "BLANDET") {
    drawHeading(MIXED_CONTENT.page3Heading, { size: 19, spacingAfter: 18 });
    drawParagraph(MIXED_CONTENT.bodyTemplate(primaryContent.name, mixedBContent.name), { size: 11.5, lineGap: 6, spacingAfter: 16 });
    drawParagraph(MIXED_CONTENT.secondBody, { size: 11.5, lineGap: 6, spacingAfter: 16 });
    drawHeading("Dit første bundniveauskift", { size: 14, spacingAfter: 10 });
    drawParagraph(MIXED_CONTENT.foersteSkift, { size: 11.5, font: italic, lineGap: 6, spacingAfter: 10 });
  } else if (resultType === "STABIL") {
    drawHeading(STABLE_CONTENT.page3Heading, { size: 19, spacingAfter: 18 });
    drawParagraph(STABLE_CONTENT.body1, { size: 11.5, lineGap: 6, spacingAfter: 16 });
    drawParagraph(STABLE_CONTENT.body2, { size: 11.5, lineGap: 6, spacingAfter: 16 });
    drawHeading("Dit første bundniveauskift", { size: 14, spacingAfter: 10 });
    drawParagraph(STABLE_CONTENT.foersteSkift, { size: 11.5, font: italic, lineGap: 6, spacingAfter: 10 });
  } else {
    const c = primaryContent;
    drawHeading(c.page3Heading, { size: 19, spacingAfter: 18 });

    drawHeading("Det testen peger på", { size: 14, spacingAfter: 10 });
    drawParagraph(c.detTestenPegerPaa, { size: 11.5, lineGap: 6, spacingAfter: 16 });

    drawHeading("Sådan ser det ofte ud", { size: 14, spacingAfter: 10 });
    drawParagraph(c.saadanSerDetOftUd, { size: 11.5, lineGap: 6, spacingAfter: 16 });

    drawHeading("Den skjulte pris", { size: 14, spacingAfter: 10 });
    drawParagraph(c.denSkjultePris, { size: 11.5, lineGap: 6, spacingAfter: 16 });

    drawHeading("Det dit system mangler", { size: 14, spacingAfter: 10 });
    drawParagraph(c.detDitSystemMangler, { size: 11.5, lineGap: 6, spacingAfter: 16 });

    drawHeading("Dit første bundniveauskift", { size: 14, spacingAfter: 10 });
    drawParagraph(c.foersteSkift, { size: 11.5, font: italic, lineGap: 6, spacingAfter: 10 });
  }

  // ==================== SIDE 4 — B.U.N.D.-fundamentet ====================
  newPage();
  drawHeading("B.U.N.D. — fundamentet under en transformation, der holder", { size: 19, spacingAfter: 16 });
  drawParagraph(
    "Din profil viser, hvor din eksekveringskæde typisk bryder først. Men én repareret del er ikke nok. En stabil transformation kræver fire forbindelser, der arbejder sammen.",
    { size: 12, lineGap: 7, spacingAfter: 20 }
  );

  drawHeading("Dit første svage led", { size: 14, spacingAfter: 10 });
  const weakLink = resultType === "BLANDET" ? MIXED_CONTENT.weakLink
    : resultType === "STABIL" ? STABLE_CONTENT.weakLink
    : primaryContent.weakLink;
  drawParagraph(weakLink, { size: 11.5, font: bold, color: ACCENT, lineGap: 6, spacingAfter: 20 });

  drawHeading("B.U.N.D. giver dig fire ting", { size: 14, spacingAfter: 12 });
  for (const led of BUND_LEDS) {
    ensureSpace(34);
    page.drawText(`${led.letter} — ${led.action}`, { x: MARGIN, y, size: 11.5, font: bold, color: INK });
    y -= 16;
    drawParagraph(led.benefit, { size: 11, color: MUTED, lineGap: 5, spacingAfter: 10 });
  }
  y -= 6;

  drawBox(() => {
    drawParagraph(
      "Uden B er målet et ønske. Uden U konkurrerer alt om din tid. Uden N bliver den første dårlige dag et stop. Uden D falder systemet fra hinanden, når hverdagen ændrer sig. B.U.N.D. er ikke endnu en motivationsteknik. Det er fundamentet, der gør motivation unødvendig som hovedmotor.",
      { size: 11, font: bold, lineGap: 6, spacingAfter: 0 }
    );
  });
  y -= 16;

  drawHeading("Hvorfor jeg udviklede B.U.N.D.", { size: 14, spacingAfter: 10 });
  drawParagraph(
    "Mit arbejde handler om at omsætte mål, beslutninger og ambitioner til systemer, der kan fungere i virkelige hverdage. Jeg udviklede B.U.N.D., fordi jeg blev ved med at se den samme kløft: Mennesker ved ofte, hvad de bør gøre, men deres plan er kun bygget til de dage, hvor tid, energi og motivation samarbejder. Det er ikke nok at vide mere. Det afgørende er at have en struktur, der fortæller dig, hvad du gør, når du ikke kan gøre det hele. På næste side kan du ansøge om at bygge dit eget B.U.N.D.-system sammen med mig i den kommende testpilot.",
    { size: 11.5, lineGap: 6, spacingAfter: 10 }
  );

  // ==================== SIDE 5 — Tilbuddet ====================
  newPage();
  drawHeading("Ansøg om en af højst 8 testpilotpladser", { size: 20, spacingAfter: 6 });
  page.drawText("The 4-Week Basic System for High Performance", { x: MARGIN, y, size: 13, font: bold, color: GOLD });
  y -= 30;

  drawParagraph(
    "Et fireugers implementeringsforløb, hvor du bygger et personligt system, så du kan gøre det vigtigste mere stabilt — også når dagen ikke er perfekt.",
    { size: 12, lineGap: 7, spacingAfter: 16 }
  );

  const bridgeLine = resultType === "BLANDET" ? MIXED_CONTENT.bridgeLine
    : resultType === "STABIL" ? STABLE_CONTENT.bridgeLine
    : primaryContent.bridgeLine;
  drawParagraph(bridgeLine, { size: 12, font: bold, lineGap: 7, spacingAfter: 20 });

  drawHeading("Efter fire uger står du med", { size: 14, spacingAfter: 10 });
  drawBullets(AFTER_FOUR_WEEKS, { spacingAfter: 6 });
  y -= 10;

  drawHeading("Det får du i testpiloten", { size: 14, spacingAfter: 10 });
  drawBullets(WHAT_YOU_GET, { spacingAfter: 6 });
  y -= 10;

  drawHeading("Pris", { size: 14, spacingAfter: 10 });
  page.drawText("Testpilotpris: 4.995 kr.", { x: MARGIN, y, size: 12, font: bold, color: INK });
  y -= 18;
  page.drawText("Forventet senere lanceringspris: 15.000-18.000 kr.", { x: MARGIN, y, size: 11, font: regular, color: MUTED });
  y -= 26;
  drawParagraph(
    "Testpilotprisen afspejler, at du hjælper med at forfine den endelige struktur gennem konkret og ærlig feedback. Du får til gengæld tættere adgang, direkte sparring og mulighed for at påvirke det færdige system.",
    { size: 11, lineGap: 6, spacingAfter: 16 }
  );

  drawBox(() => {
    drawHeading("Tilpasningsgaranti", { size: 12, spacingAfter: 8, color: INK });
    drawParagraph(
      "Du skal ikke forlade forløbet med et system, du ikke kan bruge. Gennemfører du modulerne og de ugentlige check-ins, men står ved afslutningen stadig med et system, der ikke er konkret og anvendeligt i din hverdag, justerer vi det sammen i den afsluttende samtale — uden ekstra betaling. Garantien gælder systemets anvendelighed, ikke et bestemt økonomisk eller personligt resultat.",
      { size: 10.5, lineGap: 5, spacingAfter: 0 }
    );
  });
  y -= 16;

  drawHeading("Testpiloten er et match, hvis", { size: 13, spacingAfter: 8 });
  drawBullets(MATCH_CRITERIA, { spacingAfter: 6 });
  y -= 6;

  drawParagraph(
    "Den er ikke et match, hvis du primært ønsker inspiration, endnu en metode at læse om eller forventer, at motivationen skal gøre arbejdet for dig.",
    { size: 11, color: MUTED, lineGap: 6, spacingAfter: 16 }
  );

  drawBox(() => {
    drawParagraph(
      "Højst 8 deltagere. Optagelsen lukker, når otte deltagere er godkendt. Som testpilot forventes du at give ærlig feedback. Brug af din udtalelse eller dine resultater i markedsføring sker kun efter en særskilt aftale.",
      { size: 10.5, lineGap: 5, spacingAfter: 0 }
    );
  });
  y -= 16;

  drawParagraph(
    "Book en uforpligtende afklaringssamtale. Samtalen varer 30 minutter. Vi ser på dit mål, dit nuværende mønster og om testpiloten er det rigtige næste skridt for os begge.",
    { size: 11.5, lineGap: 6, spacingAfter: 16 }
  );

  ensureSpace(50);
  page.drawText("BOOK EN AFKLARINGSSAMTALE", { x: MARGIN, y, size: 13, font: bold, color: ACCENT });
  y -= 18;
  page.drawText(bookingUrl, { x: MARGIN, y, size: 11, font: bold, color: ACCENT });
  y -= 30;

  drawParagraph(
    "Ikke at vælge er også et valg. Spørgsmålet er ikke kun, om du kan vente. Det er, hvad endnu et år med det samme mønster vil koste i tabt fremdrift og svækket tillid til dine egne aftaler.",
    { size: 11, font: italic, color: MUTED, lineGap: 6, spacingAfter: 10 }
  );

  const bytes = await doc.save();
  return { buffer: Buffer.from(bytes), filename, subject: emailSubject };
}

module.exports = { generateReportPdf };

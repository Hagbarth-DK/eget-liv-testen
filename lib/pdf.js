const { PDFDocument, rgb, PDFString } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const FONTS = require("./fonts");
const { CATEGORY_CONTENT, getMixedContent, BALANCED_CONTENT, STABLE_CONTENT, secondaryLine } = require("./categoryContent");

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 57; // ~20mm
const BOTTOM = 84; // plads til sidefod
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const MAX_SCORE = 7;

// Designsystem "Hagbarth Skjold Andersen" (Notion, 30/10-2026): navy, blå, gul accent, lys flade
const PAGE_BG = rgb(0xf6 / 255, 0xf4 / 255, 0xef / 255); // surface
const INK = rgb(0x1b / 255, 0x2a / 255, 0x41 / 255); // ink / navy
const NAVY = rgb(0x1b / 255, 0x2a / 255, 0x41 / 255);
const ACCENT = rgb(0x2f / 255, 0x5d / 255, 0x8c / 255); // blue
const GOLD = rgb(0xff / 255, 0xd2 / 255, 0x3f / 255); // gul — kun på navy eller som fyld
const LINE = rgb(0xd3 / 255, 0xcc / 255, 0xbd / 255);
const WHITE = rgb(1, 1, 1);
const MUTED = rgb(0x56 / 255, 0x62 / 255, 0x7a / 255);
const OAK = rgb(0xe6 / 255, 0xdc / 255, 0xc8 / 255); // citater og rolige felter
const ON_NAVY_MUTED = rgb(0xc9 / 255, 0xd1 / 255, 0xde / 255);

const DANISH_MONTHS = [
  "januar", "februar", "marts", "april", "maj", "juni",
  "juli", "august", "september", "oktober", "november", "december",
];

// Fire faste holdepunkter (samme tekst for alle profiler). Arbejdsnavnet for de fire dele bruges ikke i første kontakt (Den røde tråd).
const BUND_LEDS = [
  { action: "Retningen", benefit: "Du får en personlig beslutningsmodel, der samler din ønskede retning, gevinsten ved at handle og prisen ved at lade være. Den hjælper dig i dine daglige valg med at se, om du bevæger dig nærmere målet eller tilbage mod det, du vil væk fra." },
  { action: "De tre vigtigste aktiviteter", benefit: "Du samler dit fokus om de få handlinger, der skaber mest fremdrift." },
  { action: "Et minimum, der stadig tæller", benefit: "Du ved, hvad du skal gøre på en svær dag, så en svær dag ikke bliver til et fuldt stop." },
  { action: "En hverdag, der holder", benefit: "Du får en uge- og dagsstruktur med en plan for forhindringer, ugentlig opfølgning og en klar genstartsregel." },
];

// §12 — "Efter fire uger står du med"
const AFTER_FOUR_WEEKS = [
  "En personlig beslutningsmodel, der samler din ønskede retning, gevinsten ved at handle og prisen ved at lade være – og hjælper dig med at vurdere, om dagens valg fører dig nærmere målet eller tilbage mod det, du vil væk fra.",
  "Tre prioriterede aktiviteter, som du selv har direkte indflydelse på.",
  "Et normalniveau og et minimumsniveau for hver aktivitet, så handling også er mulig på svære dage.",
  "En konkret plan for kendte interne og eksterne forhindringer.",
  "En enkel uge- og dagsstruktur med ugentlig opfølgning og en genstartsregel.",
];

// §12 — "Det får du i testpilotforløbet"
const WHAT_YOU_GET = [
  "Fire ugentlige moduler med konkrete øvelser og arbejdsark.",
  "Din personlige beslutningsmodel og systemet tilpasset dit mål og din hverdag.",
  "Personlig sparring og direkte feedback undervejs.",
  "En kort ugentlig status, der måler på handling – ikke kun på oplevelse.",
  "En ny test og en afsluttende samtale, hvor systemet evalueres og justeres.",
];

const MATCH_CRITERIA = [
  "du har et vigtigt mål, men mangler stabil gennemførelse i hverdagen.",
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

// §5.2/§5.4 — resultattitel, én af 7 mulige
function getResultTitle(resultType, primaryContent, mixedContent) {
  switch (resultType) {
    case "TYDELIGT":
      return `Et tydeligt mønster: ${primaryContent.name}`;
    case "TENDENS":
      return `En tendens til ${primaryContent.name}`;
    case "BLANDET":
      return mixedContent.title;
    case "BALANCERET":
      return BALANCED_CONTENT.title;
    default:
      return STABLE_CONTENT.title;
  }
}

// §5.6 — hvilke kategorier er "i spil" på siden, i visningsrækkefølge
function getCategoriesInPlay(resultType, primaryCategory, secondaryCategory, mixedCategoryB) {
  if (resultType === "BLANDET") return [primaryCategory, mixedCategoryB];
  if (resultType === "BALANCERET") return ["TOP", "SPR", "UDS"];
  if (resultType === "STABIL") return [];
  return secondaryCategory ? [primaryCategory, secondaryCategory] : [primaryCategory];
}

async function generateReportPdf({
  name, scores, resultType, primaryCategory, secondaryCategory, mixedCategoryB,
  quotes, bookingUrl, senderName, applicationDeadline,
}) {
  const cleanName = name.trim();
  const primaryContent = primaryCategory ? CATEGORY_CONTENT[primaryCategory] : null;
  const mixedContent = resultType === "BLANDET" ? getMixedContent(primaryCategory, mixedCategoryB) : null;
  const resultTitle = getResultTitle(resultType, primaryContent, mixedContent);

  const emailSubject = `${cleanName}, din profil er klar`;
  const filename = `${slugify(cleanName)}-din-profil.pdf`;

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Din profil – ${cleanName}`);
  doc.setAuthor(senderName);
  // Designsystemets skrifter: Libre Franklin til overskrifter, Source Sans 3 til tekst.
  const embed = (b64) => doc.embedFont(Buffer.from(b64, "base64"), { subset: true });
  const display = await embed(FONTS.display);
  const regular = await embed(FONTS.regular);
  const semibold = await embed(FONTS.semibold);
  const bold = await embed(FONTS.bold);
  const italic = await embed(FONTS.italic);

  let page;
  let y;
  let pageNo = 0;

  const footer = () => {
    if (pageNo === 1) return;
    page.drawLine({ start: { x: MARGIN, y: 50 }, end: { x: PAGE_WIDTH - MARGIN, y: 50 }, thickness: 0.6, color: LINE });
    page.drawText(senderName, { x: MARGIN, y: 34, size: 9, font: semibold, color: MUTED });
    const right = `Din profil · side ${pageNo}`;
    page.drawText(right, { x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(right, 9), y: 34, size: 9, font: regular, color: MUTED });
  };

  const newPage = () => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pageNo += 1;
    page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: PAGE_BG });
    y = PAGE_HEIGHT - MARGIN;
    footer();
    return page;
  };

  const ensureSpace = (needed) => {
    if (y - needed < BOTTOM) newPage();
  };

  // Afrundet felt (radius 8) som i designsystemet. yTop er feltets overkant.
  const roundedRect = (x, yTop, w, h, color, r = 8) => {
    const path = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
    page.drawSvgPath(path, { x, y: yTop, color });
  };

  const paragraphHeight = (text, { size = 11.5, font = regular, lineGap = 6, maxWidth = CONTENT_WIDTH } = {}) =>
    wrapText(text, font, size, maxWidth).length * (size + lineGap);

  // Afsnit holdes samlet på én side, så ingen side starter midt i en sætning.
  const drawParagraph = (text, { size = 11.5, font = regular, color = INK, lineGap = 6, spacingAfter = 14, x = MARGIN, maxWidth = CONTENT_WIDTH, keep = true } = {}) => {
    const lines = wrapText(text, font, size, maxWidth);
    const total = lines.length * (size + lineGap);
    if (keep && total < PAGE_HEIGHT - MARGIN - BOTTOM) ensureSpace(total);
    for (const line of lines) {
      ensureSpace(size + lineGap);
      page.drawText(line, { x, y, size, font, color });
      y -= size + lineGap;
    }
    y -= spacingAfter;
  };

  const drawKicker = (text, { color = ACCENT, spacingAfter = 8 } = {}) => {
    ensureSpace(40);
    page.drawText(text.toUpperCase(), { x: MARGIN, y, size: 9.5, font: bold, color });
    y -= 9.5 + spacingAfter;
  };

  const drawHeading = (text, { size = 20, spacingAfter = 14, color = INK, font = display } = {}) => {
    const lines = wrapText(text, font, size, CONTENT_WIDTH);
    ensureSpace(lines.length * (size + 5) + 40); // aldrig en overskrift alene nederst på en side
    for (const line of lines) {
      page.drawText(line, { x: MARGIN, y: y - size + 4, size, font, color });
      y -= size + 5;
    }
    y -= spacingAfter;
  };

  const drawBullets = (items, { size = 11.5, lineGap = 6, spacingAfter = 8, indent = 18 } = {}) => {
    for (const item of items) {
      const lines = wrapText(item, regular, size, CONTENT_WIDTH - indent);
      ensureSpace(lines.length * (size + lineGap) + 4);
      page.drawRectangle({ x: MARGIN + 1, y: y + 2, width: 6, height: 6, color: ACCENT });
      lines.forEach((line, i) => {
        page.drawText(line, { x: MARGIN + indent, y: y - i * (size + lineGap), size, font: regular, color: INK });
      });
      y -= lines.length * (size + lineGap) + spacingAfter;
    }
  };

  // Rolig flade (oak) eller navy flade med tekst. Højden måles først, så feltet tegnes bag teksten.
  const drawPanel = (blocks, { fill = OAK, pad = 16 } = {}) => {
    const inner = CONTENT_WIDTH - pad * 2;
    let h = pad * 2;
    for (const b of blocks) h += paragraphHeight(b.text, { ...b, maxWidth: inner }) + (b.spacingAfter || 0);
    ensureSpace(h + 8);
    roundedRect(MARGIN, y + 4, CONTENT_WIDTH, h, fill);
    y -= pad;
    for (const b of blocks) {
      drawParagraph(b.text, { ...b, x: MARGIN + pad, maxWidth: inner, spacingAfter: b.spacingAfter || 0, keep: false });
    }
    y -= pad + 14;
  };

  // Gul knap med navy tekst (designsystemet: én tydelig handling). Klikbar i PDF-læseren.
  const drawCta = (label, sub) => {
    const h = 40;
    ensureSpace(h + 40);
    const w = Math.min(CONTENT_WIDTH, bold.widthOfTextAtSize(label, 13) + 56);
    roundedRect(MARGIN, y, w, h, GOLD);
    page.drawText(label, { x: MARGIN + 28, y: y - 25, size: 13, font: bold, color: NAVY });
    const link = doc.context.obj({
      Type: "Annot", Subtype: "Link", Rect: [MARGIN, y - h, MARGIN + w, y], Border: [0, 0, 0],
      A: { Type: "Action", S: "URI", URI: PDFString.of(bookingUrl) },
    });
    page.node.addAnnot(doc.context.register(link));
    y -= h + 12;
    if (sub) {
      page.drawText(sub, { x: MARGIN, y, size: 9.5, font: regular, color: MUTED });
      y -= 22;
    }
  };
  const bookingShort = bookingUrl.replace(/^https?:\/\//, "");
  const ctaSub = `30 minutter · uforpligtende · ${bookingShort}`;

  // ==================== SIDE 1 — Forside ====================
  newPage();
  const titleLines = wrapText(resultTitle, display, 30, CONTENT_WIDTH - 20);
  const bandHeight = 330 + titleLines.length * 36;
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - bandHeight, width: PAGE_WIDTH, height: bandHeight, color: NAVY });
  // Signatur: "hullerne i osten" som udskårne cirkler i navy-fladen.
  const holes = [[470, 120, 22], [520, 160, 9], [430, 70, 7], [540, 92, 14], [492, 48, 5], [402, 132, 4], [452, 172, 11]];
  for (const [hx, hy, r] of holes) page.drawCircle({ x: hx, y: PAGE_HEIGHT - bandHeight + hy, size: r, color: PAGE_BG });
  y = PAGE_HEIGHT - 72;
  page.drawText("DIN PROFIL", { x: MARGIN, y, size: 10, font: bold, color: GOLD });
  y -= 22;
  page.drawText("Hvor falder dit eget liv igennem?", { x: MARGIN, y, size: 14, font: regular, color: ON_NAVY_MUTED });
  y -= 70;
  page.drawText(`${cleanName},`, { x: MARGIN, y, size: 22, font: semibold, color: WHITE });
  y -= 22;
  page.drawText("dit resultat er", { x: MARGIN, y, size: 15, font: regular, color: ON_NAVY_MUTED });
  y -= 40;
  for (const line of titleLines) {
    page.drawText(line, { x: MARGIN, y, size: 30, font: display, color: WHITE });
    y -= 36;
  }
  y = PAGE_HEIGHT - bandHeight - 40;
  drawParagraph(
    "Et personligt øjebliksbillede af, hvor dit eget liv falder igennem, når jobbet har taget det meste af dagen – og hvad der typisk sker mellem beslutning og handling.",
    { size: 14, font: semibold, lineGap: 7, spacingAfter: 16 }
  );
  drawParagraph(
    "De fleste forsøger at løse problemet ved at presse sig selv hårdere, finde en ny metode eller love sig selv, at næste mandag bliver anderledes. Du stoppede op og undersøgte mønstret. På side 2 ser du din pointfordeling. På side 3 får du forklaringen på, hvad dit resultat betyder. På side 4 ser du, hvilket fundament der skal på plads, hvis din forandring skal kunne holde – også på mindre gode dage.",
    { size: 11.5, lineGap: 6, spacingAfter: 14 }
  );
  drawParagraph(
    "Din profil er baseret på de svar, du netop har givet. Den viser et adfærdsmønster eller en tendens – ikke en fast personlighed og ikke en psykologisk vurdering.",
    { size: 9.5, color: MUTED, lineGap: 4, spacingAfter: 0 }
  );
  page.drawText(senderName, { x: MARGIN, y: 64, size: 14, font: display, color: INK });
  page.drawText(`Life System Architect · ${formatDanishDate(new Date())}`, { x: MARGIN, y: 46, size: 10, font: regular, color: MUTED });

  // ==================== SIDE 2 — Pointfordeling ====================
  newPage();
  drawKicker("Side 2 · Dine svar");
  drawHeading("Din pointfordeling", { size: 24 });
  drawParagraph(
    "De syv spørgsmål undersøgte ikke, hvor ambitiøs eller dygtig du er. De undersøgte, hvad du typisk gør, når intentionen møder virkeligheden.",
    { size: 12.5, lineGap: 7, spacingAfter: 26 }
  );

  const barMaxWidth = CONTENT_WIDTH;
  const barHeight = 12;
  const orderedCodes = ["TOP", "SPR", "UDS"];
  const highlighted = resultType === "BALANCERET"
    ? new Set(orderedCodes)
    : new Set([primaryCategory, mixedCategoryB].filter(Boolean));

  // §15 proportionalitetsprincip: alle tre bjælker fyldes ALTID med samme farve,
  // og bredden er strengt proportional med point/7 — uafhængigt af, hvilke kategorier der omtales.
  // Kun labelteksten (ikke selve bjælken) må fremhæves for det/de omtalte mønstre.
  for (const code of orderedCodes) {
    const isHighlighted = highlighted.has(code);
    const score = scores[code] || 0;
    const barWidth = Math.max((score / MAX_SCORE) * barMaxWidth, 3);
    const label = CATEGORY_CONTENT[code].name;
    const val = `${score} af ${MAX_SCORE}`;
    page.drawText(label, { x: MARGIN, y, size: 12, font: isHighlighted ? bold : regular, color: isHighlighted ? INK : MUTED });
    page.drawText(val, { x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(val, 12), y, size: 12, font: isHighlighted ? bold : regular, color: isHighlighted ? INK : MUTED });
    y -= 12;
    roundedRect(MARGIN, y, barMaxWidth, barHeight, LINE, 6);
    roundedRect(MARGIN, y, Math.max(barWidth, 12), barHeight, ACCENT, 6);
    y -= barHeight + 26;
  }
  y -= 4;

  const primaryScore = primaryCategory ? scores[primaryCategory] : null;
  let page2Text;
  if (resultType === "TYDELIGT") {
    page2Text = `${primaryScore} af dine 7 svar pegede på ${primaryContent.name}, og mønstret ligger tydeligt foran de øvrige. Det betyder ikke, at det beskriver dig hele tiden. Det betyder, at det er den strategi, du oftest falder tilbage på, når presset stiger, eller hverdagen skrider.`;
  } else if (resultType === "TENDENS") {
    page2Text = `Dine svar viser en tendens til ${primaryContent.name}. Mønstret styrer ikke nødvendigvis din hverdag, men det dukker ofte nok op til at bremse dig, når noget er vigtigt, svært eller uforudsigeligt.`;
  } else if (resultType === "BLANDET") {
    page2Text = `Dine svar fordeler sig især mellem ${primaryContent.name} og ${CATEGORY_CONTENT[mixedCategoryB].name}. Det er ikke et modstridende resultat. Det viser, at din reaktion ændrer sig med situationen. Fællesnævneren er, at du har brug for én stabil struktur, der virker på tværs af de to reaktioner.`;
  } else if (resultType === "BALANCERET") {
    page2Text = BALANCED_CONTENT.page2Text;
  } else {
    page2Text = "Ingen af de tre mønstre scorer mere end 1 point. Det tyder på, at du ofte kan justere og fortsætte uden at stoppe helt. Testen kan ikke bevise, at du aldrig går i stå, men den viser, at ét bestemt mønster ikke dominerer dine svar.";
  }
  drawParagraph(page2Text, { size: 12.5, lineGap: 7, spacingAfter: 14 });

  if (secondaryCategory) {
    drawParagraph(secondaryLine(CATEGORY_CONTENT[secondaryCategory].name), { size: 12.5, lineGap: 7, spacingAfter: 14 });
  }

  const categoriesInPlay = getCategoriesInPlay(resultType, primaryCategory, secondaryCategory, mixedCategoryB);
  const shownQuotes = categoriesInPlay
    .map((code) => ({ code, text: quotes && quotes[code] }))
    .filter((q) => q.text); // §5.6 — udelad defensivt, hvis en kategori i spil mangler et scoret svar

  if (shownQuotes.length > 0) {
    y -= 6;
    const blocks = [];
    for (const q of shownQuotes) {
      blocks.push({ text: `Et af dine svar, der peger på ${CATEGORY_CONTENT[q.code].name}:`, size: 10, font: semibold, color: MUTED, lineGap: 4, spacingAfter: 4 });
      blocks.push({ text: `"${q.text}"`, size: 15, font: italic, lineGap: 6, spacingAfter: 10 });
    }
    blocks.push({ text: "Disse svar vægter ikke mere i pointberegningen end de øvrige. De gør blot dit resultat lettere at genkende i praksis.", size: 9.5, color: MUTED, lineGap: 4 });
    drawPanel(blocks);
  }

  // ==================== SIDE 3 — Dynamisk mønsteranalyse ====================
  newPage();
  drawKicker("Side 3 · Dit mønster");
  const section = (title, text) => {
    drawHeading(title, { size: 14, spacingAfter: 6, font: display });
    drawParagraph(text, { size: 11.5, lineGap: 6, spacingAfter: 16 });
  };
  const firstShift = (text) => {
    y -= 4;
    drawPanel([
      { text: "DIT FØRSTE SKIFT", size: 9.5, font: bold, color: ACCENT, lineGap: 4, spacingAfter: 6 },
      { text, size: 12.5, font: italic, lineGap: 6 },
    ]);
  };
  if (resultType === "BLANDET") {
    drawHeading(mixedContent.page3Heading, { size: 22, spacingAfter: 18 });
    section("Hullet: hvor dit eget liv falder igennem", mixedContent.testenPegerPaa);
    section("Den skjulte pris", mixedContent.skjultePris);
    firstShift(mixedContent.foersteSkift);
  } else if (resultType === "BALANCERET") {
    drawHeading(BALANCED_CONTENT.page3Heading, { size: 22, spacingAfter: 18 });
    section("Hullet: hvor dit eget liv falder igennem", BALANCED_CONTENT.testenPegerPaa);
    section("Den skjulte pris", BALANCED_CONTENT.skjultePris);
    firstShift(BALANCED_CONTENT.foersteSkift);
  } else if (resultType === "STABIL") {
    drawHeading(STABLE_CONTENT.page3Heading, { size: 22, spacingAfter: 18 });
    drawParagraph(STABLE_CONTENT.fullText, { size: 11.5, lineGap: 6, spacingAfter: 16 });
    firstShift(STABLE_CONTENT.foersteSkift);
  } else {
    const c = primaryContent;
    drawHeading(c.page3Heading, { size: 22, spacingAfter: 18 });
    section("Hullet: hvor dit eget liv falder igennem", c.detTestenPegerPaa);
    section("Sådan ser det ofte ud", c.saadanSerDetOftUd);
    section("Den skjulte pris", c.denSkjultePris);
    section("Det dit system mangler", c.detDitSystemMangler);
    firstShift(c.foersteSkift);
  }

  // ==================== SIDE 4 — Systemet (Den røde tråd, led 3 og 4) ====================
  newPage();
  drawKicker("Side 4 · Fundamentet");
  drawHeading("Det system, du allerede bruger på jobbet – bygget ind i dit eget liv", { size: 20, spacingAfter: 10 });
  drawParagraph(
    "Din profil viser, hvor dit eget liv typisk falder igennem. Men det er sjældent nok at lappe ét hul. En forandring, der holder, kræver fire dele, der arbejder sammen. Vi starter med kroppen, fordi energien er det, alt andet hviler på.",
    { size: 11.5, lineGap: 6, spacingAfter: 12 }
  );

  const buildPoint = resultType === "BLANDET" ? mixedContent.buildPoint
    : resultType === "BALANCERET" ? BALANCED_CONTENT.buildPoint
    : resultType === "STABIL" ? STABLE_CONTENT.buildPoint
    : primaryContent.buildPoint;
  drawPanel([
    { text: "DIT VIGTIGSTE BYGGEPUNKT", size: 9.5, font: bold, color: ACCENT, lineGap: 4, spacingAfter: 6 },
    { text: buildPoint, size: 12, font: semibold, lineGap: 5 },
  ], { pad: 13 });

  drawHeading("Fire faste holdepunkter", { size: 15, spacingAfter: 10 });
  BUND_LEDS.forEach((led, i) => {
    const textX = MARGIN + 34;
    const lines = wrapText(led.benefit, regular, 10.5, CONTENT_WIDTH - 34);
    ensureSpace(17 + lines.length * 15);
    page.drawCircle({ x: MARGIN + 11, y: y + 4, size: 11, color: NAVY });
    const n = String(i + 1);
    page.drawText(n, { x: MARGIN + 11 - bold.widthOfTextAtSize(n, 11) / 2, y: y, size: 11, font: bold, color: GOLD });
    page.drawText(led.action, { x: textX, y, size: 12, font: bold, color: INK });
    y -= 17;
    drawParagraph(led.benefit, { size: 10.5, color: MUTED, lineGap: 4.5, spacingAfter: 9, x: textX, maxWidth: CONTENT_WIDTH - 34 });
  });
  y -= 2;

  drawPanel([
    { text: "Uden retning er målet et ønske. Uden de tre vigtigste konkurrerer alt om din tid. Uden et minimum bliver den første svære dag et stop. Uden en hverdag, der holder, falder systemet fra hinanden, når hverdagen ændrer sig. Det er ikke endnu en motivationsteknik. Det er fundamentet, der betyder, at motivation ikke behøver at være din hovedmotor.", size: 11, font: semibold, color: WHITE, lineGap: 5 },
  ], { fill: NAVY, pad: 15 });

  drawHeading("Hvorfor jeg byggede systemet", { size: 15, spacingAfter: 6 });
  drawParagraph(
    "30 år med at få systemer til at holde i virksomheder, også når konsulenten er kørt hjem. Jeg har selv stået præcis dér: travl og leverende på jobbet, med resten sat på pause. Det afgørende er at have en struktur, der fortæller dig, hvad du gør, når du ikke kan gøre det hele. På næste side kan du ansøge om en af de otte testpilotpladser og bygge dit eget system sammen med mig.",
    { size: 11, lineGap: 5.5, spacingAfter: 0 }
  );

  // ==================== SIDE 5 — Testpilotforløbet ====================
  newPage();
  drawKicker("Side 5 · Testpilotforløbet");
  drawHeading("Ansøg om en af højst 8 testpilotpladser", { size: 24, spacingAfter: 4 });
  page.drawText("Foundation for High Performance™", { x: MARGIN, y: y - 10, size: 14, font: semibold, color: ACCENT });
  y -= 34;

  drawParagraph(
    "Et fireugers basisforløb, hvor du bygger et personligt system, der hjælper dig med at handle stabilt på det vigtigste – også når dagen ikke er perfekt.",
    { size: 12.5, lineGap: 7, spacingAfter: 14 }
  );

  const bridgeLine = resultType === "BLANDET" ? mixedContent.bridgeLine
    : resultType === "BALANCERET" ? BALANCED_CONTENT.bridgeLine
    : resultType === "STABIL" ? STABLE_CONTENT.bridgeLine
    : primaryContent.bridgeLine;
  drawPanel([{ text: bridgeLine, size: 13, font: semibold, lineGap: 6 }]);

  drawHeading("Efter fire uger står du med", { size: 15, spacingAfter: 10 });
  drawBullets(AFTER_FOUR_WEEKS, { spacingAfter: 7 });
  y -= 10;

  drawHeading("Det får du i testpilotforløbet", { size: 15, spacingAfter: 10 });
  drawBullets(WHAT_YOU_GET, { spacingAfter: 7 });
  y -= 6;

  const deadlineClause = applicationDeadline
    ? `Ansøgningen lukker ${applicationDeadline} eller tidligere, hvis de otte testpilotpladser er besat.`
    : "Ansøgningen lukker, når de otte testpilotpladser er besat.";
  drawParagraph(
    `Højst 8 deltagere. ${deadlineClause} Som testpilot forventes du at give ærlig feedback. Brug af din udtalelse eller dine resultater i markedsføringen sker kun efter en særskilt aftale.`,
    { size: 10.5, color: MUTED, lineGap: 5, spacingAfter: 10 }
  );

  drawParagraph("Prisen og hvordan du kommer med, står på næste side.", { size: 10.5, color: MUTED, spacingAfter: 0 });

  // ==================== SIDE 6 — Pris og optagelse ====================
  newPage();
  drawKicker("Side 6 · Pris og optagelse");
  drawHeading("Pris og optagelse", { size: 22, spacingAfter: 12 });

  // Prisfelt: testpilotprisen over for det fulde forløb (Offer-reglen 31/10-2026: pris kun i PDF og samtale).
  {
    const h = 86;
    ensureSpace(h + 16);
    roundedRect(MARGIN, y, CONTENT_WIDTH, h, NAVY);
    page.drawText("TESTPILOTPRIS", { x: MARGIN + 20, y: y - 26, size: 9.5, font: bold, color: GOLD });
    page.drawText("4.995 kr.", { x: MARGIN + 20, y: y - 56, size: 28, font: display, color: WHITE });
    page.drawText("Til sammenligning: Det fulde forløb kommer til at koste 15.000-18.000 kr.", { x: MARGIN + 20, y: y - 74, size: 10.5, font: regular, color: ON_NAVY_MUTED });
    y -= h + 30;
  }

  drawParagraph(
    "Testpilotprisen afspejler, at du hjælper med at forfine den endelige struktur gennem konkret og ærlig feedback. Du får til gengæld tættere adgang, direkte sparring og mulighed for at påvirke det færdige system.",
    { size: 10.5, lineGap: 5, spacingAfter: 8 }
  );
  drawParagraph(
    "Dette er det første gennemførte testpilotforløb. Derfor findes der endnu ikke en samling af dokumenterede deltagerforløb og før- og efterresultater. Det er netop en del af testpiloternes opgave at hjælpe med at afprøve, dokumentere og forfine systemet. Til gengæld får du en markant lavere pris, tættere personlig sparring og større indflydelse end deltagerne i den senere, færdige version.",
    { size: 10.5, lineGap: 5, spacingAfter: 10 }
  );

  drawPanel([
    { text: "TILPASNINGSGARANTI", size: 9.5, font: bold, color: ACCENT, lineGap: 4, spacingAfter: 6 },
    { text: "Du skal ikke forlade forløbet med et system, du ikke kan bruge. Hvis du gennemfører modulerne og de ugentlige statusopfølgninger, men ved afslutningen stadig står med et system, der ikke er konkret og anvendeligt i din hverdag, justerer vi det sammen i den afsluttende samtale – uden ekstra betaling. Garantien gælder systemets anvendelighed, ikke et bestemt økonomisk eller personligt resultat.", size: 10, lineGap: 4.5 },
  ], { pad: 13 });

  drawHeading("Testpilotforløbet er relevant for dig, hvis", { size: 13, spacingAfter: 6 });
  drawBullets(MATCH_CRITERIA, { size: 10.5, lineGap: 5, spacingAfter: 4 });
  y -= 2;
  drawParagraph(
    "Testpilotforløbet er ikke det rigtige valg for dig, hvis du primært ønsker inspiration, endnu en metode at læse om eller forventer, at motivationen skal gøre arbejdet for dig.",
    { size: 10, color: MUTED, lineGap: 4.5, spacingAfter: 8 }
  );

  drawParagraph(
    "Book en uforpligtende optagelsessamtale. Samtalen varer 30 minutter. Vi ser på dit mål, dit nuværende mønster og på, om testpilotforløbet er det rigtige næste skridt for os begge.",
    { size: 11.5, font: semibold, lineGap: 5.5, spacingAfter: 10 }
  );
  drawCta("Book din optagelsessamtale", ctaSub);

  drawParagraph(
    "Ikke at vælge er også et valg. Spørgsmålet er ikke kun, om du kan vente. Spørgsmålet er, hvad endnu et år med det samme mønster vil koste i tabt fremdrift og svækket tillid til, at du holder dine egne aftaler.",
    { size: 10, font: italic, color: MUTED, lineGap: 4.5, spacingAfter: 0 }
  );

  const bytes = await doc.save();
  return { buffer: Buffer.from(bytes), filename, subject: emailSubject, pages: pageNo };
}

module.exports = { generateReportPdf };

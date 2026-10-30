const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const { CATEGORY_CONTENT, getMixedContent, BALANCED_CONTENT, STABLE_CONTENT, secondaryLine } = require("./categoryContent");

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 57; // ~20mm
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
      borderColor: ACCENT, borderWidth: 1,
    });
    y -= paddingY;
  };

  // ==================== SIDE 1 — Forside ====================
  newPage();
  // Forside: navy felt med titlen i hvidt og ét gult accent (designsystemet)
  const headline = `${cleanName}, dit resultat: ${resultTitle}`;
  const headlineLines = wrapText(headline, bold, 24, CONTENT_WIDTH);
  const bandHeight = 150 + headlineLines.length * 30;
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - bandHeight, width: PAGE_WIDTH, height: bandHeight, color: NAVY });
  y -= 40;
  page.drawText("DIN PROFIL", { x: MARGIN, y, size: 11, font: bold, color: GOLD });
  y -= 22;
  page.drawText("Hvor falder dit eget liv igennem?", { x: MARGIN, y, size: 13, font: regular, color: WHITE });
  y -= 36;
  for (const line of headlineLines) {
    page.drawText(line, { x: MARGIN, y, size: 24, font: bold, color: WHITE });
    y -= 30;
  }
  y = PAGE_HEIGHT - bandHeight - 32;
  drawParagraph(
    "Et personligt øjebliksbillede af, hvor dit eget liv falder igennem, når jobbet har taget det meste af dagen – og hvad der typisk sker mellem beslutning og handling.",
    { size: 12, color: MUTED, lineGap: 6, spacingAfter: 20 }
  );

  drawBox(() => {
    drawParagraph(
      "Din profil er baseret på de svar, du netop har givet. Den viser et adfærdsmønster eller en tendens – ikke en fast personlighed og ikke en psykologisk vurdering.",
      { size: 10.5, lineGap: 5, spacingAfter: 0 }
    );
  });
  y -= 16;

  drawParagraph(
    "De fleste forsøger at løse problemet ved at presse sig selv hårdere, finde en ny metode eller love sig selv, at næste mandag bliver anderledes. Du stoppede op og undersøgte mønstret. På side 2 ser du din pointfordeling. På side 3 får du forklaringen på, hvad dit resultat betyder. På side 4 ser du, hvilket fundament der skal på plads, hvis din forandring skal kunne holde – også på mindre gode dage.",
    { size: 11.5, lineGap: 6, spacingAfter: 10 }
  );

  y = MARGIN + 20;
  page.drawText(`${formatDanishDate(new Date())} · ${senderName}`, { x: MARGIN, y, size: 10, font: regular, color: MUTED });

  // ==================== SIDE 2 — Pointfordeling ====================
  newPage();
  drawHeading("Din pointfordeling", { spacingAfter: 10 });
  drawParagraph(
    "De syv spørgsmål undersøgte ikke, hvor ambitiøs eller dygtig du er. De undersøgte, hvad du typisk gør, når intentionen møder virkeligheden.",
    { size: 12, spacingAfter: 24 }
  );

  const barMaxWidth = 220;
  const barHeight = 16;
  const barLabelWidth = 190;
  const barTrack = LINE;
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
      `${primaryScore} af dine 7 svar pegede på ${primaryContent.name}, og mønstret ligger tydeligt foran de øvrige. Det betyder ikke, at det beskriver dig hele tiden. Det betyder, at det er den strategi, du oftest falder tilbage på, når presset stiger, eller hverdagen skrider.`,
      { size: 12, lineGap: 7, spacingAfter: 14 }
    );
  } else if (resultType === "TENDENS") {
    drawParagraph(
      `Dine svar viser en tendens til ${primaryContent.name}. Mønstret styrer ikke nødvendigvis din hverdag, men det dukker ofte nok op til at bremse dig, når noget er vigtigt, svært eller uforudsigeligt.`,
      { size: 12, lineGap: 7, spacingAfter: 14 }
    );
  } else if (resultType === "BLANDET") {
    drawParagraph(
      `Dine svar fordeler sig især mellem ${primaryContent.name} og ${CATEGORY_CONTENT[mixedCategoryB].name}. Det er ikke et modstridende resultat. Det viser, at din reaktion ændrer sig med situationen. Fællesnævneren er, at du har brug for én stabil struktur, der virker på tværs af de to reaktioner.`,
      { size: 12, lineGap: 7, spacingAfter: 14 }
    );
  } else if (resultType === "BALANCERET") {
    drawParagraph(BALANCED_CONTENT.page2Text, { size: 12, lineGap: 7, spacingAfter: 14 });
  } else {
    drawParagraph(
      "Ingen af de tre mønstre scorer mere end 1 point. Det tyder på, at du ofte kan justere og fortsætte uden at stoppe helt. Testen kan ikke bevise, at du aldrig går i stå, men den viser, at ét bestemt mønster ikke dominerer dine svar.",
      { size: 12, lineGap: 7, spacingAfter: 14 }
    );
  }

  if (secondaryCategory) {
    drawParagraph(secondaryLine(CATEGORY_CONTENT[secondaryCategory].name), { size: 12, lineGap: 7, spacingAfter: 14 });
  }

  const categoriesInPlay = getCategoriesInPlay(resultType, primaryCategory, secondaryCategory, mixedCategoryB);
  const shownQuotes = categoriesInPlay
    .map((code) => ({ code, text: quotes && quotes[code] }))
    .filter((q) => q.text); // §5.6 — udelad defensivt, hvis en kategori i spil mangler et scoret svar

  for (const q of shownQuotes) {
    drawParagraph(`Et af dine svar, der peger på ${CATEGORY_CONTENT[q.code].name}: "${q.text}"`, { size: 11.5, font: italic, lineGap: 6, spacingAfter: 6 });
  }
  if (shownQuotes.length > 0) {
    drawParagraph(
      "Disse svar vægter ikke mere i pointberegningen end de øvrige. De gør blot dit resultat lettere at genkende i praksis.",
      { size: 10.5, color: MUTED, lineGap: 5, spacingAfter: 10 }
    );
  }

  // ==================== SIDE 3 — Dynamisk mønsteranalyse ====================
  newPage();
  if (resultType === "BLANDET") {
    drawHeading(mixedContent.page3Heading, { size: 19, spacingAfter: 18 });
    drawHeading("Hullet: hvor dit eget liv falder igennem", { size: 14, spacingAfter: 10 });
    drawParagraph(mixedContent.testenPegerPaa, { size: 11.5, lineGap: 6, spacingAfter: 16 });
    drawHeading("Den skjulte pris", { size: 14, spacingAfter: 10 });
    drawParagraph(mixedContent.skjultePris, { size: 11.5, lineGap: 6, spacingAfter: 16 });
    drawHeading("Dit første skift", { size: 14, spacingAfter: 10 });
    drawParagraph(mixedContent.foersteSkift, { size: 11.5, font: italic, lineGap: 6, spacingAfter: 10 });
  } else if (resultType === "BALANCERET") {
    drawHeading(BALANCED_CONTENT.page3Heading, { size: 19, spacingAfter: 18 });
    drawHeading("Hullet: hvor dit eget liv falder igennem", { size: 14, spacingAfter: 10 });
    drawParagraph(BALANCED_CONTENT.testenPegerPaa, { size: 11.5, lineGap: 6, spacingAfter: 16 });
    drawHeading("Den skjulte pris", { size: 14, spacingAfter: 10 });
    drawParagraph(BALANCED_CONTENT.skjultePris, { size: 11.5, lineGap: 6, spacingAfter: 16 });
    drawHeading("Dit første skift", { size: 14, spacingAfter: 10 });
    drawParagraph(BALANCED_CONTENT.foersteSkift, { size: 11.5, font: italic, lineGap: 6, spacingAfter: 10 });
  } else if (resultType === "STABIL") {
    drawHeading(STABLE_CONTENT.page3Heading, { size: 19, spacingAfter: 18 });
    drawParagraph(STABLE_CONTENT.fullText, { size: 11.5, lineGap: 6, spacingAfter: 16 });
    drawHeading("Dit første skift", { size: 14, spacingAfter: 10 });
    drawParagraph(STABLE_CONTENT.foersteSkift, { size: 11.5, font: italic, lineGap: 6, spacingAfter: 10 });
  } else {
    const c = primaryContent;
    drawHeading(c.page3Heading, { size: 19, spacingAfter: 18 });

    drawHeading("Hullet: hvor dit eget liv falder igennem", { size: 14, spacingAfter: 10 });
    drawParagraph(c.detTestenPegerPaa, { size: 11.5, lineGap: 6, spacingAfter: 16 });

    drawHeading("Sådan ser det ofte ud", { size: 14, spacingAfter: 10 });
    drawParagraph(c.saadanSerDetOftUd, { size: 11.5, lineGap: 6, spacingAfter: 16 });

    drawHeading("Den skjulte pris", { size: 14, spacingAfter: 10 });
    drawParagraph(c.denSkjultePris, { size: 11.5, lineGap: 6, spacingAfter: 16 });

    drawHeading("Det dit system mangler", { size: 14, spacingAfter: 10 });
    drawParagraph(c.detDitSystemMangler, { size: 11.5, lineGap: 6, spacingAfter: 16 });

    drawHeading("Dit første skift", { size: 14, spacingAfter: 10 });
    drawParagraph(c.foersteSkift, { size: 11.5, font: italic, lineGap: 6, spacingAfter: 10 });
  }

  // ==================== SIDE 4 — Systemet (Den røde tråd, led 3 og 4) ====================
  newPage();
  drawHeading("Det system, du allerede bruger på jobbet – bygget ind i dit eget liv", { size: 19, spacingAfter: 16 });
  drawParagraph(
    "Din profil viser, hvor dit eget liv typisk falder igennem. Men det er sjældent nok at lappe ét hul. En forandring, der holder, kræver fire dele, der arbejder sammen. Vi starter med kroppen, fordi energien er det, alt andet hviler på.",
    { size: 12, lineGap: 7, spacingAfter: 20 }
  );

  drawHeading("Dit vigtigste byggepunkt", { size: 14, spacingAfter: 10 });
  const buildPoint = resultType === "BLANDET" ? mixedContent.buildPoint
    : resultType === "BALANCERET" ? BALANCED_CONTENT.buildPoint
    : resultType === "STABIL" ? STABLE_CONTENT.buildPoint
    : primaryContent.buildPoint;
  drawParagraph(buildPoint, { size: 11.5, font: bold, color: ACCENT, lineGap: 6, spacingAfter: 20 });

  drawHeading("Fire faste holdepunkter", { size: 14, spacingAfter: 12 });
  for (const led of BUND_LEDS) {
    ensureSpace(34);
    page.drawText(led.action, { x: MARGIN, y, size: 11.5, font: bold, color: INK });
    y -= 16;
    drawParagraph(led.benefit, { size: 11, color: MUTED, lineGap: 5, spacingAfter: 10 });
  }
  y -= 6;

  drawBox(() => {
    drawParagraph(
      "Uden retning er målet et ønske. Uden de tre vigtigste konkurrerer alt om din tid. Uden et minimum bliver den første svære dag et stop. Uden en hverdag, der holder, falder systemet fra hinanden, når hverdagen ændrer sig. Det er ikke endnu en motivationsteknik. Det er fundamentet, der betyder, at motivation ikke behøver at være din hovedmotor.",
      { size: 11, font: bold, lineGap: 6, spacingAfter: 0 }
    );
  });
  y -= 16;

  drawHeading("Hvorfor jeg byggede systemet", { size: 14, spacingAfter: 10 });
  drawParagraph(
    "30 år med at få systemer til at holde i virksomheder, også når konsulenten er kørt hjem. Jeg har selv stået præcis dér: travl og leverende på jobbet, med resten sat på pause. Det afgørende er at have en struktur, der fortæller dig, hvad du gør, når du ikke kan gøre det hele. På næste side kan du ansøge om en af de otte testpilotpladser og bygge dit eget system sammen med mig.",
    { size: 11.5, lineGap: 6, spacingAfter: 10 }
  );

  // ==================== SIDE 5 — Testpilotforløbet ====================
  newPage();
  drawHeading("Ansøg om en af højst 8 testpilotpladser", { size: 20, spacingAfter: 6 });
  page.drawText("Foundation for High Performance™", { x: MARGIN, y, size: 13, font: bold, color: ACCENT });
  y -= 30;

  drawParagraph(
    "Et fireugers basisforløb, hvor du bygger et personligt system, der hjælper dig med at handle stabilt på det vigtigste – også når dagen ikke er perfekt.",
    { size: 12, lineGap: 7, spacingAfter: 16 }
  );

  const bridgeLine = resultType === "BLANDET" ? mixedContent.bridgeLine
    : resultType === "BALANCERET" ? BALANCED_CONTENT.bridgeLine
    : resultType === "STABIL" ? STABLE_CONTENT.bridgeLine
    : primaryContent.bridgeLine;
  drawParagraph(bridgeLine, { size: 12, font: bold, lineGap: 7, spacingAfter: 20 });

  drawHeading("Efter fire uger står du med", { size: 14, spacingAfter: 10 });
  drawBullets(AFTER_FOUR_WEEKS, { spacingAfter: 6 });
  y -= 10;

  drawHeading("Det får du i testpilotforløbet", { size: 14, spacingAfter: 10 });
  drawBullets(WHAT_YOU_GET, { spacingAfter: 6 });
  y -= 10;

  drawHeading("Pris", { size: 14, spacingAfter: 10 });
  page.drawText("Testpilotpris: 4.995 kr.", { x: MARGIN, y, size: 12, font: bold, color: INK });
  y -= 18;
  page.drawText("Til sammenligning: Det fulde forløb kommer til at koste 15.000-18.000 kr.", { x: MARGIN, y, size: 11, font: regular, color: MUTED });
  y -= 26;
  drawParagraph(
    "Testpilotprisen afspejler, at du hjælper med at forfine den endelige struktur gennem konkret og ærlig feedback. Du får til gengæld tættere adgang, direkte sparring og mulighed for at påvirke det færdige system.",
    { size: 11, lineGap: 6, spacingAfter: 16 }
  );

  drawParagraph(
    "Dette er det første gennemførte testpilotforløb. Derfor findes der endnu ikke en samling af dokumenterede deltagerforløb og før- og efterresultater. Det er netop en del af testpiloternes opgave at hjælpe med at afprøve, dokumentere og forfine systemet. Til gengæld får du en markant lavere pris, tættere personlig sparring og større indflydelse end deltagerne i den senere, færdige version.",
    { size: 11, lineGap: 6, spacingAfter: 16 }
  );

  drawBox(() => {
    drawHeading("Tilpasningsgaranti", { size: 12, spacingAfter: 8, color: INK });
    drawParagraph(
      "Du skal ikke forlade forløbet med et system, du ikke kan bruge. Hvis du gennemfører modulerne og de ugentlige statusopfølgninger, men ved afslutningen stadig står med et system, der ikke er konkret og anvendeligt i din hverdag, justerer vi det sammen i den afsluttende samtale – uden ekstra betaling. Garantien gælder systemets anvendelighed, ikke et bestemt økonomisk eller personligt resultat.",
      { size: 10.5, lineGap: 5, spacingAfter: 0 }
    );
  });
  y -= 16;

  drawHeading("Testpilotforløbet er relevant for dig, hvis", { size: 13, spacingAfter: 8 });
  drawBullets(MATCH_CRITERIA, { spacingAfter: 6 });
  y -= 6;

  drawParagraph(
    "Testpilotforløbet er ikke det rigtige valg for dig, hvis du primært ønsker inspiration, endnu en metode at læse om eller forventer, at motivationen skal gøre arbejdet for dig.",
    { size: 11, color: MUTED, lineGap: 6, spacingAfter: 16 }
  );

  const deadlineClause = applicationDeadline
    ? `Ansøgningen lukker ${applicationDeadline} eller tidligere, hvis de otte testpilotpladser er besat.`
    : "Ansøgningen lukker, når de otte testpilotpladser er besat.";
  drawBox(() => {
    drawParagraph(
      `Højst 8 deltagere. ${deadlineClause} Som testpilot forventes du at give ærlig feedback. Brug af din udtalelse eller dine resultater i markedsføringen sker kun efter en særskilt aftale.`,
      { size: 10.5, lineGap: 5, spacingAfter: 0 }
    );
  });
  y -= 16;

  drawParagraph(
    "Book en uforpligtende optagelsessamtale. Samtalen varer 30 minutter. Vi ser på dit mål, dit nuværende mønster og på, om testpilotforløbet er det rigtige næste skridt for os begge.",
    { size: 11.5, lineGap: 6, spacingAfter: 16 }
  );

  ensureSpace(50);
  page.drawText("BOOK EN OPTAGELSESSAMTALE", { x: MARGIN, y, size: 13, font: bold, color: ACCENT });
  y -= 18;
  page.drawText(bookingUrl, { x: MARGIN, y, size: 11, font: bold, color: ACCENT });
  y -= 30;

  drawParagraph(
    "Ikke at vælge er også et valg. Spørgsmålet er ikke kun, om du kan vente. Spørgsmålet er, hvad endnu et år med det samme mønster vil koste i tabt fremdrift og svækket tillid til, at du holder dine egne aftaler.",
    { size: 11, font: italic, color: MUTED, lineGap: 6, spacingAfter: 10 }
  );

  const bytes = await doc.save();
  return { buffer: Buffer.from(bytes), filename, subject: emailSubject };
}

module.exports = { generateReportPdf };

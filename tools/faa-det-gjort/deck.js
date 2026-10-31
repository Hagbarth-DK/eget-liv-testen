// "Få det gjort" — slides til undervisningsvideoen (Hagbarth optager selv).
// Kilde for al tekst: Notion → Digital Products Hub → "Få det gjort" og arbejdsbog 2.0.
const pptxgen = require("pptxgenjs");
const path = require("path");
const { applyTheme } = require("/root/.claude/skills/synced/00ebdcdd-9c5e-49d1-81d5-8b96d4a3974a_37a65ea9-2338-421d-b7c9-5dad5d3a51db/pptx/scripts/apply_theme.js");

const THEME = {
  name: "Hagbarth Skjold Andersen",
  headFontFace: "Arial",
  bodyFontFace: "Arial",
  colors: {
    dk1: "1B2A41", lt1: "FFFFFF", dk2: "56627A", lt2: "F6F4EF",
    accent1: "1B2A41", accent2: "FFD23F", accent3: "2F5D8C", accent4: "E6DCC8",
    accent5: "D3CCBD", accent6: "56627A", hlink: "2F5D8C", folHlink: "56627A",
  },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625
pres.title = "Få det gjort";
pres.author = "Hagbarth Skjold Andersen";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
const PORTRAIT = path.join(__dirname, "portrait-square.jpg");

// Layouts
pres.defineSlideMaster({
  title: "Mørk",
  background: { color: C.text1 },
  objects: [],
  slideNumber: { x: 9.2, y: 5.2, w: 0.5, h: 0.25, fontSize: 9, color: "C9D1DE" },
});
pres.defineSlideMaster({
  title: "Lys",
  background: { color: C.background2 },
  objects: [
    { text: { text: "FÅ DET GJORT", options: { x: 0.5, y: 5.18, w: 4, h: 0.25, fontSize: 9, bold: true, color: C.text2, charSpacing: 2, margin: 0, isTextBox: true } } },
  ],
  slideNumber: { x: 9.2, y: 5.18, w: 0.5, h: 0.25, fontSize: 9, color: C.text2 },
});

const kicker = (s, text, color = C.accent3) =>
  s.addText(text.toUpperCase(), { x: 0.5, y: 0.45, w: 9, h: 0.3, fontSize: 11, bold: true, color, charSpacing: 2, margin: 0, isTextBox: true, objectName: "Kicker" });
const title = (s, text, color = C.text1) =>
  s.addText(text, { x: 0.5, y: 0.78, w: 9, h: 0.75, fontSize: 32, bold: true, color, margin: 0, isTextBox: true, valign: "top", objectName: "Titel" });
const lead = (s, text) =>
  s.addText(text, { x: 0.5, y: 1.55, w: 8.6, h: 0.5, fontSize: 15, color: C.text2, margin: 0, isTextBox: true, valign: "top", objectName: "Indledning" });
const card = (s, x, y, w, h, fill = C.accent4) =>
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: fill }, rectRadius: 0.08, objectName: "Felt" });
const holes = (s) => {
  [[8.1, 0.7, 0.5], [9.0, 1.3, 0.18], [7.7, 1.9, 0.12], [8.7, 2.3, 0.34], [9.1, 3.2, 0.1], [7.9, 3.4, 0.24], [8.6, 4.2, 0.08]]
    .forEach(([x, y, r]) => s.addShape(pres.shapes.OVAL, { x, y, w: r * 2, h: r * 2, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: "Hul" }));
};

pres.addSection({ title: "Start" });

// 1. Titel
{
  const s = pres.addSlide({ masterName: "Mørk", sectionTitle: "Start" });
  holes(s);
  s.addText("EN PRAKTISK ARBEJDSBOG", { x: 0.6, y: 0.8, w: 6, h: 0.3, fontSize: 12, bold: true, color: C.accent2, charSpacing: 3, margin: 0, isTextBox: true });
  s.addText("Få det gjort.", { x: 0.6, y: 1.25, w: 7, h: 1.1, fontSize: 60, bold: true, color: C.background1, margin: 0, isTextBox: true });
  s.addText("Også på de svære dage.", { x: 0.6, y: 2.4, w: 7, h: 0.5, fontSize: 22, color: "C9D1DE", margin: 0, isTextBox: true });
  s.addImage({ path: PORTRAIT, x: 0.6, y: 4.0, w: 0.8, h: 0.8, rounding: true, altText: "Hagbarth Skjold Andersen" });
  s.addText([{ text: "Hagbarth Skjold Andersen", options: { bold: true, breakLine: true } }, { text: "Life System Architect", options: { color: "C9D1DE" } }],
    { x: 1.55, y: 4.0, w: 4, h: 0.8, fontSize: 14, color: C.background1, margin: 0, valign: "middle", isTextBox: true });
  s.addNotes("Velkommen. I dag vælger du én vigtig handling og prøver den af i syv dage. Hav arbejdsbogen klar.");
}

// 2. Sådan bruger du arbejdsbogen
{
  const s = pres.addSlide({ masterName: "Lys", sectionTitle: "Start" });
  kicker(s, "Dit første skridt");
  title(s, "Én vigtig handling. Syv dage i praksis");
  const steps = [
    ["01", "Lav din plan", "Udfyld side 2–5. Sæt cirka 20 minutter af til øvelserne."],
    ["02", "Afprøv den", "Brug side 6 i syv dage. Skriv kort, hvad du gjorde, og hvad der hjalp."],
    ["03", "Justér og fortsæt", "Saml op på side 7. Brug kortet på side 8 ved dit næste valg."],
  ];
  steps.forEach(([n, h, t], i) => {
    const x = 0.5 + i * 3.05;
    card(s, x, 2.0, 2.85, 2.8, C.background1);
    s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: 2.3, w: 0.7, h: 0.7, fill: { color: C.text1 }, line: { color: C.text1 } });
    s.addText(n, { x: x + 0.3, y: 2.3, w: 0.7, h: 0.7, fontSize: 16, bold: true, color: C.accent2, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText(h, { x: x + 0.3, y: 3.15, w: 2.3, h: 0.4, fontSize: 18, bold: true, color: C.text1, margin: 0, isTextBox: true });
    s.addText(t, { x: x + 0.3, y: 3.6, w: 2.3, h: 1.0, fontSize: 14, color: C.text2, margin: 0, valign: "top", isTextBox: true });
  });
  s.addNotes("Tre trin: lav planen, afprøv den i syv dage, justér. Der er ingen facit, kun dit eget svar.");
}

pres.addSection({ title: "Planen" });

// 3. Retning
{
  const s = pres.addSlide({ masterName: "Lys", sectionTitle: "Planen" });
  kicker(s, "01 / Retning · side 2");
  title(s, "Hvad vil du hen imod?");
  lead(s, "Begynd med det, du vil hen imod. Vælg én retning, der er værd at prioritere.");
  card(s, 0.5, 2.3, 4.3, 2.5);
  s.addText([{ text: "RESULTAT", options: { bold: true, color: C.accent3, fontSize: 11, charSpacing: 2, breakLine: true } }, { text: "Et færdigt projekt", options: { bold: true, fontSize: 22 } }],
    { x: 0.8, y: 2.55, w: 3.8, h: 1.0, color: C.text1, margin: 0, valign: "top", isTextBox: true });
  s.addText("Det, du gerne vil nå. Det hjælper dig med at vælge aktiviteten.", { x: 0.8, y: 3.6, w: 3.8, h: 0.9, fontSize: 14, color: C.text2, margin: 0, valign: "top", isTextBox: true });
  card(s, 5.2, 2.3, 4.3, 2.5, C.text1);
  s.addText([{ text: "AKTIVITET", options: { bold: true, color: C.accent2, fontSize: 11, charSpacing: 2, breakLine: true } }, { text: "Skriv på næste afsnit", options: { bold: true, fontSize: 22 } }],
    { x: 5.5, y: 2.55, w: 3.8, h: 1.0, color: C.background1, margin: 0, valign: "top", isTextBox: true });
  s.addText("Det, du selv kan gennemføre. Det er den, du arbejder med.", { x: 5.5, y: 3.6, w: 3.8, h: 0.9, fontSize: 14, color: "C9D1DE", margin: 0, valign: "top", isTextBox: true });
  s.addNotes("Side 2: Hvad vil jeg bevæge mig hen imod? Hvad vil det give mig i hverdagen? Hvorfor betyder det noget? Hvilken konkret handling bidrager? Hvad vil jeg give mindre plads til – fx mail, før jeg har skrevet.");
}

// 4. Beslutningsøjeblikket
{
  const s = pres.addSlide({ masterName: "Lys", sectionTitle: "Planen" });
  kicker(s, "02 / Beslutningsøjeblikket · side 3");
  title(s, "Genkend dit beslutningsøjeblik");
  lead(s, "Det er her, du vælger: den gamle vej eller den nye.");
  card(s, 0.5, 2.4, 2.9, 2.2, C.background1);
  s.addText([{ text: "DEN GAMLE VEJ", options: { bold: true, fontSize: 11, color: C.text2, charSpacing: 2, breakLine: true } }, { text: "Jeg gør, som jeg plejer", options: { bold: true, fontSize: 18, breakLine: true } }, { text: "Trygt nu. Dyrt på sigt.", options: { fontSize: 14, color: C.text2 } }],
    { x: 0.75, y: 2.6, w: 2.45, h: 1.8, color: C.text1, margin: 0, valign: "top", isTextBox: true });
  card(s, 3.6, 2.6, 2.8, 1.8, C.accent2);
  s.addText("Bringer dette valg mig tættere på mit mål – eller længere væk?", { x: 3.8, y: 2.7, w: 2.4, h: 1.6, fontSize: 16, bold: true, color: C.text1, align: "center", valign: "middle", margin: 0, isTextBox: true });
  card(s, 6.6, 2.4, 2.9, 2.2, C.text1);
  s.addText([{ text: "DEN NYE VEJ", options: { bold: true, fontSize: 11, color: C.accent2, charSpacing: 2, breakLine: true } }, { text: "Min højredrejning", options: { bold: true, fontSize: 18, breakLine: true } }, { text: "Et bevidst valg mod målet.", options: { fontSize: 14, color: "C9D1DE" } }],
    { x: 6.85, y: 2.6, w: 2.45, h: 1.8, color: C.background1, margin: 0, valign: "top", isTextBox: true });
  s.addNotes("Side 3: Hvornår opstår mit valg – sted og hændelse? Hvad gør jeg på den gamle vej? Hvad er konsekvensen nu og over tid? Se på mønstret uden at sætte en negativ etiket på dig selv.");
}

// 5. Tre størrelser
{
  const s = pres.addSlide({ masterName: "Lys", sectionTitle: "Planen" });
  kicker(s, "03 / Et minimum, der stadig tæller · side 4");
  title(s, "Samme retning. Tre størrelser");
  lead(s, "Tilpas handlingen til dagen. Dit minimum skal kunne registreres som gjort.");
  const sizes = [["Overskudsdagen", "Skriv i 30 minutter.", 1.0], ["Hverdagen", "Skriv i 10 minutter.", 0.66], ["Den svære dag", "Skriv tre brugbare stikord.", 0.33]];
  sizes.forEach(([h, ex, f], i) => {
    const x = 0.5 + i * 3.05;
    card(s, x, 2.3, 2.85, 2.5, i === 2 ? C.text1 : C.background1);
    const dark = i === 2;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.3, y: 2.55, w: 2.25 * f, h: 0.22, fill: { color: dark ? C.accent2 : C.accent3 }, line: { color: dark ? C.accent2 : C.accent3 }, rectRadius: 0.1 });
    s.addText(h, { x: x + 0.3, y: 3.0, w: 2.3, h: 0.45, fontSize: 18, bold: true, color: dark ? C.background1 : C.text1, margin: 0, isTextBox: true });
    s.addText([{ text: "EKSEMPEL", options: { bold: true, fontSize: 10, color: dark ? C.accent2 : C.accent3, charSpacing: 2, breakLine: true } }, { text: ex, options: { italic: true, fontSize: 15 } }],
      { x: x + 0.3, y: 3.55, w: 2.3, h: 1.0, color: dark ? "C9D1DE" : C.text2, margin: 0, valign: "top", isTextBox: true });
  });
  s.addNotes("Side 4: Skriv din egen handling i tre størrelser. Den svære dag er den vigtigste – det er den, der holder retningen i live.");
}

// 6. Tjek dit minimum
{
  const s = pres.addSlide({ masterName: "Lys", sectionTitle: "Planen" });
  kicker(s, "03 / Et minimum, der stadig tæller · side 4");
  title(s, "Tjek dit minimum");
  ["Kan jeg se, når det er gjort?", "Bidrager det til min retning?", "Er det realistisk på en svær dag?"].forEach((t, i) => {
    const y = 1.85 + i * 0.85;
    s.addShape(pres.shapes.OVAL, { x: 0.5, y, w: 0.55, h: 0.55, fill: { color: C.accent3 }, line: { color: C.accent3 } });
    s.addText("✓", { x: 0.5, y, w: 0.55, h: 0.55, fontSize: 18, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText(t, { x: 1.3, y, w: 4.5, h: 0.55, fontSize: 18, color: C.text1, valign: "middle", margin: 0, isTextBox: true });
  });
  card(s, 6.1, 1.85, 3.4, 2.25, C.text1);
  s.addText("Når minimum er gennemført, må jeg stoppe.", { x: 6.4, y: 2.0, w: 2.8, h: 1.95, fontSize: 22, bold: true, color: C.background1, valign: "middle", margin: 0, isTextBox: true });
  s.addNotes("Tre spørgsmål til dit minimum. Og husk: minimum er nok. Mere er valgfrit.");
}

// 7. Forberedelse
{
  const s = pres.addSlide({ masterName: "Lys", sectionTitle: "Planen" });
  kicker(s, "04 / Forberedelse · side 5");
  title(s, "Gør det næste valg lettere");
  lead(s, "Aftal på forhånd, hvornår du handler, og hvordan du håndterer den forhindring, du kender.");
  const rows = [
    ["Når dette sker, så gør jeg …", "Når jeg sætter mig ved computeren, skriver jeg tre stikord til projektet før mail."],
    ["Den forhindring, jeg forventer", "Jeg får lyst til at tjekke beskeder først."],
    ["Det gør jeg klar på forhånd", "Dokumentet står åbent med næste overskrift."],
  ];
  rows.forEach(([h, ex], i) => {
    const y = 2.25 + i * 0.9;
    card(s, 0.5, y, 9, 0.75, i === 0 ? C.accent4 : C.background1);
    s.addText(h, { x: 0.75, y, w: 3.3, h: 0.75, fontSize: 15, bold: true, color: C.text1, valign: "middle", margin: 0, isTextBox: true });
    s.addText(ex, { x: 4.1, y, w: 5.2, h: 0.75, fontSize: 14, italic: true, color: C.text2, valign: "middle", margin: 0, isTextBox: true });
  });
  s.addNotes("Side 5: Knyt dit minimum til en hændelse, du kan genkende. Skriv også: hvis forhindringen dukker op, så vil jeg … og hvis tidspunktet glipper, er min næste mulighed …");
}

pres.addSection({ title: "Afprøvning" });

// 8. Syv dage
{
  const s = pres.addSlide({ masterName: "Lys", sectionTitle: "Afprøvning" });
  kicker(s, "05 / Afprøvning · side 6");
  title(s, "Syv dage med din plan");
  lead(s, "Ja, hvis dit minimum blev gjort. Nej, hvis det ikke blev. En streg på dage uden planlagt handling.");
  ["Ja", "Ja", "Nej", "Ja", "—", "Ja", "Ja"].forEach((v, i) => {
    const x = 0.5 + i * 1.3;
    card(s, x, 2.3, 1.15, 1.15, v === "Ja" ? C.text1 : C.background1);
    s.addText([{ text: `DAG 0${i + 1}`, options: { fontSize: 9, bold: true, charSpacing: 1, breakLine: true, color: v === "Ja" ? C.accent2 : C.text2 } }, { text: v, options: { fontSize: 20, bold: true } }],
      { x, y: 2.3, w: 1.15, h: 1.15, align: "center", valign: "middle", color: v === "Ja" ? C.background1 : C.text1, margin: 0, isTextBox: true });
  });
  card(s, 0.5, 3.75, 4.4, 1.1);
  s.addText([{ text: "Hvis en dag glipper", options: { bold: true, breakLine: true } }, { text: "Fortsæt ved næste planlagte mulighed. Ingen dobbelt portion." }],
    { x: 0.7, y: 3.8, w: 4.0, h: 1.0, fontSize: 14, color: C.text1, valign: "middle", margin: 0, isTextBox: true });
  card(s, 5.1, 3.75, 4.4, 1.1);
  s.addText([{ text: "Hvis mønstret gentager sig", options: { bold: true, breakLine: true } }, { text: "Ret én ting ad gangen: tidspunkt, forhindring eller størrelse." }],
    { x: 5.3, y: 3.8, w: 4.0, h: 1.0, fontSize: 14, color: C.text1, valign: "middle", margin: 0, isTextBox: true });
  s.addNotes("Side 6: Skriv kort, hvad hjalp, eller hvad der stod i vejen. Det er dine data til opfølgningen.");
}

// 9. Opfølgning
{
  const s = pres.addSlide({ masterName: "Lys", sectionTitle: "Afprøvning" });
  kicker(s, "06 / Opfølgning · side 7");
  title(s, "Behold det, der fungerer");
  lead(s, "Syv dage er en afprøvning, ikke et løfte om et færdigt mønster.");
  const qs = ["Hvor mange planlagte muligheder blev til handling?", "Hvornår var det lettest at vælge min højredrejning?", "Hvad stod oftest i vejen?", "Hvilken ene ændring afprøver jeg næste uge?"];
  qs.forEach((t, i) => {
    const x = 0.5 + (i % 2) * 4.6, y = 2.3 + Math.floor(i / 2) * 1.3;
    card(s, x, y, 4.4, 1.1, C.background1);
    s.addText(String(i + 1), { x: x + 0.25, y: y + 0.25, w: 0.6, h: 0.6, fontSize: 24, bold: true, color: C.accent3, valign: "middle", margin: 0, isTextBox: true });
    s.addText(t, { x: x + 0.9, y, w: 3.3, h: 1.1, fontSize: 15, color: C.text1, valign: "middle", margin: 0, isTextBox: true });
  });
  s.addNotes("Side 7: Fungerer planen, må du gerne beholde samme minimum. Mere er valgfrit. Skriv din næste konkrete mulighed for at handle.");
}

// 10. Handlingskort
{
  const s = pres.addSlide({ masterName: "Mørk", sectionTitle: "Afprøvning" });
  holes(s);
  s.addText("MIT HANDLINGSKORT · SIDE 8", { x: 0.6, y: 0.6, w: 6, h: 0.3, fontSize: 11, bold: true, color: C.accent2, charSpacing: 2, margin: 0, isTextBox: true });
  s.addText("Min næste højredrejning", { x: 0.6, y: 0.95, w: 7, h: 0.75, fontSize: 32, bold: true, color: C.background1, margin: 0, isTextBox: true });
  s.addText("Læg kortet dér, hvor valget opstår.", { x: 0.6, y: 1.7, w: 7, h: 0.4, fontSize: 16, color: "C9D1DE", margin: 0, isTextBox: true });
  ["Gør minimum", "Markér gjort", "Justér efter dine erfaringer"].forEach((t, i) => {
    const y = 2.5 + i * 0.8;
    card(s, 0.6, y, 5.6, 0.62, i === 0 ? C.accent2 : C.accent3);
    s.addText(t, { x: 0.85, y, w: 5.2, h: 0.62, fontSize: 18, bold: true, color: i === 0 ? C.text1 : C.background1, valign: "middle", margin: 0, isTextBox: true });
  });
  s.addNotes("Handlingskortet samler planen på én side: retning, gamle vej, når-så, forhindring og plan B. Print det, eller tag et billede af det.");
}

// 11. Næste skridt
{
  const s = pres.addSlide({ masterName: "Lys", sectionTitle: "Afprøvning" });
  kicker(s, "Næste skridt");
  title(s, "Lav din plan i dag. Prøv den af i syv dage");
  lead(s, "Bagefter samler vi op i lektion 2.");
  s.addImage({ path: PORTRAIT, x: 0.5, y: 2.6, w: 1.6, h: 1.6, rounding: true, altText: "Hagbarth Skjold Andersen" });
  s.addText([{ text: "Der er ingen facit, kun dit eget svar.", options: { bold: true, fontSize: 22, breakLine: true } }, { text: "Hagbarth Skjold Andersen · Life System Architect", options: { fontSize: 14, color: C.text2 } }],
    { x: 2.4, y: 2.6, w: 6.8, h: 1.6, color: C.text1, valign: "middle", margin: 0, isTextBox: true });
  s.addNotes("Afslut: Hent arbejdsbogen, sæt 20 minutter af, og start i dag. Vi ses i lektion 2.");
}

(async () => {
  const out = path.join(__dirname, "out", "faa-det-gjort-slides.pptx");
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("ok", out);
})();

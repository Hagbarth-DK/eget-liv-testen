// Bygger "Få det gjort" — arbejdsbog 2.0 (8 sider) og handlingskort (1 side) i designsystemet.
// Kilde for al tekst: Notion → Digital Products Hub → "Få det gjort" (rettet efter Den røde tråd 31/10-2026).
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const css = fs.readFileSync(path.join(__dirname, "style.css"), "utf8");
const portrait = "file://" + path.join(__dirname, "portrait-square.jpg");

const head = (n, label = "Arbejdsbog") =>
  `<div class="head"><span>Hagbarth Skjold Andersen</span><span>Få det gjort / ${label} ${String(n).padStart(2, "0")} / ${label === "Arbejdsbog" ? "08" : "01"}</span></div>`;
const foot = (n, label = "Arbejdsbog") =>
  `<div class="foot"><span>Få det gjort</span><span>${label} ${String(n).padStart(2, "0")} / ${label === "Arbejdsbog" ? "08" : "01"}</span></div>`;
const q = (title, hint, h = 22, lines = true) =>
  `<div class="q"><b>${title}</b>${hint ? `<div class="hint">${hint}</div>` : ""}<div class="${lines ? "lines" : "box"}" style="--h:${h}mm"></div></div>`;

const cover = `
<div class="page" style="padding:0">
  <div style="background:#1B2A41;color:#fff;height:178mm;padding:26mm 18mm 0;position:relative">
    <div style="font:700 9pt SS;letter-spacing:.12em;color:#FFD23F;text-transform:uppercase">En praktisk arbejdsbog</div>
    <div style="font:700 54pt/1.0 LF;margin:10mm 0 6mm">Få det<br>gjort.</div>
    <div style="font:400 17pt SS;color:#C9D1DE">Også på de svære dage.</div>
    <div style="width:28mm;height:2.4mm;background:#FFD23F;border-radius:2mm;margin:12mm 0 8mm"></div>
    <div style="font:400 13pt/1.45 SS;color:#E6E9EF;max-width:120mm">Vælg din retning. Gør handlingen konkret. Byg et minimum, du kan arbejde videre fra.</div>
    ${[[160,40,13],[178,62,5],[148,78,3],[184,96,9],[166,118,4],[150,132,7],[176,146,2.5]].map(([x,y,r])=>`<div style="position:absolute;left:${x}mm;top:${y}mm;width:${r*2}mm;height:${r*2}mm;border-radius:50%;background:#F6F4EF"></div>`).join("")}
  </div>
  <div style="padding:10mm 18mm 0">
    <div class="kick" style="margin-top:0">Dit første skridt</div>
    <div style="font:700 17pt/1.25 LF;margin-bottom:4mm">Én vigtig handling. Syv dage i praksis.</div>
    <div style="font:700 8pt SS;letter-spacing:.08em;color:#56627A;text-transform:uppercase;margin:4mm 0 1.5mm">Den ene opgave eller rutine, jeg vælger</div>
    <div class="box" style="--h:13mm"></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;margin-top:7mm">
      <div><div style="font:700 15pt LF;color:#2F5D8C">01</div><div style="font:700 11pt SS">Lav din plan</div><div style="font-size:9.5pt;color:#56627A">Udfyld side 2–5. Sæt cirka 20 minutter af til øvelserne.</div></div>
      <div><div style="font:700 15pt LF;color:#2F5D8C">02</div><div style="font:700 11pt SS">Afprøv den</div><div style="font-size:9.5pt;color:#56627A">Brug side 6 i syv dage. Skriv kort, hvad du gjorde, og hvad der hjalp.</div></div>
      <div><div style="font:700 15pt LF;color:#2F5D8C">03</div><div style="font:700 11pt SS">Justér og fortsæt</div><div style="font-size:9.5pt;color:#56627A">Saml op på side 7. Brug kortet på side 8 ved dit næste valg.</div></div>
    </div>
  </div>
  <div style="position:absolute;left:18mm;bottom:12mm;display:flex;align-items:center;gap:4mm">
    <img src="${portrait}" style="width:14mm;height:14mm;border-radius:50%;object-fit:cover">
    <div><div style="font:700 11pt LF">Hagbarth Skjold Andersen</div><div style="font-size:9pt;color:#56627A">Life System Architect</div></div>
  </div>
</div>`;

const p2 = `
<div class="page">${head(2)}
  <div class="kick">01 / Retning</div>
  <h1>Hvad vil du hen imod?</h1>
  <p class="lead">Begynd med det, du vil hen imod. Vælg én retning, der er værd at prioritere.</p>
  <div class="grid">
    <div class="side"><div class="num">01</div><h3>Giv handlingen en retning</h3><p>Du arbejder med en aktivitet, du selv kan gennemføre. Dit ønskede resultat hjælper dig med at vælge den.</p><div class="ex">Eksempel</div><div class="exs">Et færdigt projekt er et resultat. At skrive på næste afsnit er en aktivitet.</div></div>
    <div>
      ${q("Hvad vil jeg gerne bevæge mig hen imod?", "Vælg ét område.", 16)}
      ${q("Hvad vil det give mig i hverdagen?", "Beskriv det konkrete udbytte.", 23)}
      ${q("Hvorfor betyder det noget for mig?", "", 23)}
      ${q("Hvilken konkret handling bidrager til retningen?", "", 16)}
      ${q("Hvad vil jeg give mindre tid eller plads til?", "Eksempel: Jeg venter med mail, til jeg har skrevet.", 16)}
    </div>
  </div>${foot(2)}
</div>`;

const p3 = `
<div class="page">${head(3)}
  <div class="kick">02 / Beslutningsøjeblikket</div>
  <h1>Genkend dit beslutningsøjeblik</h1>
  <p class="lead">Det er her, du vælger: den gamle vej eller den nye. I denne arbejdsbog afprøver du én konkret handling.</p>
  <div class="navy" style="margin-bottom:7mm;display:grid;grid-template-columns:1fr auto 1fr;gap:6mm;align-items:center;text-align:center">
    <div><div style="font:700 8pt SS;letter-spacing:.08em;color:#C9D1DE;text-transform:uppercase">Den gamle vej</div><div style="font:700 12pt LF;margin-top:1mm">Jeg gør, som jeg plejer</div><div style="font-size:9pt;color:#C9D1DE">Trygt nu. Dyrt på sigt.</div></div>
    <div style="font:700 10pt SS;background:#FFD23F;color:#1B2A41;border-radius:8px;padding:3mm 4mm">Bringer dette valg mig<br>tættere på mit mål?</div>
    <div><div style="font:700 8pt SS;letter-spacing:.08em;color:#C9D1DE;text-transform:uppercase">Den nye vej</div><div style="font:700 12pt LF;margin-top:1mm">Min højredrejning</div><div style="font-size:9pt;color:#C9D1DE">Et bevidst valg mod målet.</div></div>
  </div>
  ${q("Hvornår opstår mit valg?", "Sted og hændelse.", 30)}
  ${q("Hvad gør jeg på den gamle vej?", "Beskriv handlingen.", 30)}
  ${q("Hvad er konsekvensen nu og over tid?", "Se på mønstret uden at sætte en negativ etiket på dig selv.", 46)}
  ${foot(3)}
</div>`;

const size = (title, ex) => `
  <div style="display:grid;grid-template-columns:44mm 1fr;gap:6mm;margin-bottom:5mm;align-items:stretch">
    <div class="side" style="padding:5mm"><h3 style="margin-top:0">${title}</h3><div class="ex" style="margin-top:2mm">Eksempel</div><div class="exs">${ex}</div></div>
    <div><div style="font:700 8pt SS;letter-spacing:.08em;color:#56627A;text-transform:uppercase;margin-bottom:1.5mm">Min handling</div><div class="lines" style="--h:31mm"></div></div>
  </div>`;
const p4 = `
<div class="page">${head(4)}
  <div class="kick">03 / Et minimum, der stadig tæller</div>
  <h1>Samme retning. Tre størrelser.</h1>
  <p class="lead">Tilpas handlingen til dagen. Dit minimum skal være et reelt bidrag, der tydeligt kan registreres som gjort.</p>
  ${size("Overskudsdagen", "Skriv i 30 minutter.")}
  ${size("Hverdagen", "Skriv i 10 minutter.")}
  ${size("Den svære dag", "Skriv tre brugbare stikord.")}
  <div class="note"><b>Tjek dit minimum</b><div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5mm 6mm;margin-top:2mm">
    <div>☐ Kan jeg se, når det er gjort?</div><div>☐ Bidrager det til min retning?</div><div>☐ Er det realistisk på en svær dag?</div><div><b>Når minimum er gennemført, må jeg stoppe.</b></div></div></div>
  ${foot(4)}
</div>`;

const p5 = `
<div class="page">${head(5)}
  <div class="kick">04 / Forberedelse</div>
  <h1>Gør det næste valg lettere</h1>
  <p class="lead">Aftal på forhånd, hvornår du handler, og hvordan du håndterer den forhindring, du allerede kender.</p>
  <div class="grid">
    <div class="side"><div class="num">04</div><h3>Når dette sker, så gør jeg …</h3><p>Knyt dit minimum til en hændelse, du kan genkende. Gør det klart, hvad du starter med.</p><div class="ex">Eksempel</div><div class="exs">Når jeg sætter mig ved computeren, skriver jeg tre stikord til projektet før mail.</div></div>
    <div>
      ${q("Når dette sker, så gør jeg …", "", 23)}
      ${q("Den forhindring, jeg forventer", "Eksempel: Jeg får lyst til at tjekke beskeder først.", 16)}
      ${q("Hvis forhindringen dukker op, så vil jeg …", "", 23)}
      ${q("Det gør jeg klar på forhånd", "Eksempel: Dokumentet står åbent med næste overskrift.", 16)}
      ${q("Hvis tidspunktet glipper, er min næste mulighed …", "Vælg en konkret hændelse eller et tidspunkt.", 16)}
    </div>
  </div>${foot(5)}
</div>`;

const p6 = `
<div class="page">${head(6)}
  <div class="kick">05 / Afprøvning</div>
  <h1>Syv dage med din plan</h1>
  <p class="lead">Skriv Ja, hvis dit aftalte minimum blev gjort, og Nej, hvis det ikke blev. Brug en streg på dage uden planlagt handling.</p>
  <table>
    <tr><th style="width:14mm">Dag</th><th style="width:52mm">Planlagt situation</th><th style="width:20mm">Gjort</th><th>Hvad hjalp eller stod i vejen</th></tr>
    ${[1,2,3,4,5,6,7].map(d=>`<tr><td style="background:#E6DCC8;color:#2F5D8C">0${d}</td><td></td><td></td><td></td></tr>`).join("")}
  </table>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:6mm">
    <div class="note" style="margin:0"><b>Hvis en dag glipper</b><br>Fortsæt ved næste planlagte mulighed. Du skal ikke indhente en dobbelt portion.</div>
    <div class="note" style="margin:0"><b>Hvis mønstret gentager sig</b><br>Undersøg tidspunkt, forhindring og størrelse. Ret én ting ad gangen, og notér ændringen.</div>
  </div>
  ${foot(6)}
</div>`;

const p7 = `
<div class="page">${head(7)}
  <div class="kick">06 / Opfølgning</div>
  <h1>Behold det, der fungerer</h1>
  <p class="lead">Brug dine registreringer til at vælge en realistisk plan for næste uge. Syv dage er en afprøvning, ikke et løfte om et færdigt mønster.</p>
  <div class="grid">
    <div class="side"><div class="num">06</div><h3>Se på det, du faktisk gjorde</h3><p>Dit minimum er den handling, du øver dig i at kunne gennemføre stabilt. Lad erfaringerne bestemme næste skridt.</p><div class="ex">Eksempel</div><div class="exs">Hvis planen fungerer, må du gerne beholde samme minimum. Mere er valgfrit.</div></div>
    <div>
      ${q("Planlagte muligheder og gennemførte handlinger", "Eksempel: Fire gennemført ud af fem planlagte.", 16)}
      ${q("Hvornår var det lettest at vælge min højredrejning?", "", 23)}
      ${q("Hvad stod oftest i vejen?", "", 23)}
      ${q("Den ene ændring, jeg vil afprøve næste uge", "", 16)}
      ${q("Min næste konkrete mulighed for at handle", "Skriv dag og tidspunkt eller en bestemt hændelse.", 16)}
    </div>
  </div>${foot(7)}
</div>`;

const card = (n, label) => `
<div class="page">${head(n, label)}
  <div class="kick">Mit handlingskort</div>
  <h1>Min næste højredrejning</h1>
  <p class="lead">Læg kortet dér, hvor valget opstår. Spørg: "Bringer dette valg mig tættere på mit mål eller længere væk?"</p>
  <div style="background:#FFD23F;color:#1B2A41;border-radius:8px;padding:3.5mm 5mm;font:700 10.5pt SS;letter-spacing:.06em;text-transform:uppercase;text-align:center;margin-bottom:6mm">Gør minimum — markér gjort — justér efter dine erfaringer</div>
  ${q("Min retning, og hvorfor den betyder noget", "", 26)}
  ${q("Min gamle vej, og det der udløser den", "", 26)}
  ${q("Når dette sker, gør jeg mit minimum", "", 26)}
  ${q("Min forhindring og min plan", "", 26)}
  ${q("Hvis tidspunktet glipper, så …", "", 18)}
  ${foot(n, label)}
</div>`;

const doc = (pages) => `<!doctype html><html lang="da"><head><meta charset="utf-8"><style>${css}</style></head><body>${pages.join("")}</body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const out = path.join(__dirname, "out");
  fs.mkdirSync(out, { recursive: true });
  const builds = [
    ["faa-det-gjort-arbejdsbog.pdf", [cover, p2, p3, p4, p5, p6, p7, card(8, "Arbejdsbog")]],
    ["faa-det-gjort-handlingskort.pdf", [card(1, "Handlingskort")]],
  ];
  for (const [name, pages] of builds) {
    const html = path.join(out, name.replace(".pdf", ".html"));
    fs.writeFileSync(html, doc(pages));
    await p.goto("file://" + html);
    await p.waitForTimeout(400);
    await p.pdf({ path: path.join(out, name), format: "A4", printBackground: true, preferCSSPageSize: true });
  }
  await b.close();
})();

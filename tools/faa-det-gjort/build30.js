// "Få det gjort – 30 dage" (tilkøb). Kilde: arbejdsbogens side 6–7 og 4-ugers kursus-fundamentet (Modul 4, ugentlig opfølgning).
const fs = require("fs"), path = require("path"), { chromium } = require("playwright");
const css = fs.readFileSync(path.join(__dirname, "style.css"), "utf8");
const portrait = "file://" + path.join(__dirname, "portrait-square.jpg");
const N = 7;
const head = (n) => `<div class="head"><span>Hagbarth Skjold Andersen</span><span>Få det gjort – 30 dage ${String(n).padStart(2,"0")} / 0${N}</span></div>`;
const foot = (n) => `<div class="foot"><span>Få det gjort – 30 dage</span><span>${String(n).padStart(2,"0")} / 0${N}</span></div>`;
const q = (t, hint, h) => `<div class="q"><b>${t}</b>${hint?`<div class="hint">${hint}</div>`:""}<div class="lines" style="--h:${h}mm"></div></div>`;
const cover = `<div class="page" style="padding:0">
  <div style="background:#1B2A41;color:#fff;height:170mm;padding:26mm 18mm 0;position:relative">
    <div style="font:700 9pt SS;letter-spacing:.12em;color:#FFD23F;text-transform:uppercase">Tilføjelse til arbejdsbogen</div>
    <div style="font:700 50pt/1.0 LF;margin:10mm 0 6mm">Få det gjort<br>– 30 dage.</div>
    <div style="font:400 16pt SS;color:#C9D1DE;max-width:120mm">Hold handlingen i gang i en hel måned.</div>
    ${[[160,40,13],[178,62,5],[148,78,3],[184,96,9],[166,118,4],[150,132,7]].map(([x,y,r])=>`<div style="position:absolute;left:${x}mm;top:${y}mm;width:${r*2}mm;height:${r*2}mm;border-radius:50%;background:#F6F4EF"></div>`).join("")}
  </div>
  <div style="padding:10mm 18mm 0">
    <div class="kick" style="margin-top:0">Sådan bruger du den</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;margin-top:3mm">
      <div><div style="font:700 15pt LF;color:#2F5D8C">01</div><div style="font:700 11pt SS">Skriv dit minimum</div><div style="font-size:9.5pt;color:#56627A">Brug den plan, du lavede i arbejdsbogen. Skriv den øverst på side 2.</div></div>
      <div><div style="font:700 15pt LF;color:#2F5D8C">02</div><div style="font:700 11pt SS">Markér hver dag</div><div style="font-size:9.5pt;color:#56627A">Ja, Nej eller en streg på dage uden planlagt handling.</div></div>
      <div><div style="font:700 15pt LF;color:#2F5D8C">03</div><div style="font:700 11pt SS">Følg op hver uge</div><div style="font-size:9.5pt;color:#56627A">Fem minutter med de samme tre spørgsmål. Ret én ting ad gangen.</div></div>
    </div>
  </div>
  <div style="position:absolute;left:18mm;bottom:12mm;display:flex;align-items:center;gap:4mm">
    <img src="${portrait}" style="width:14mm;height:14mm;border-radius:50%;object-fit:cover">
    <div><div style="font:700 11pt LF">Hagbarth Skjold Andersen</div><div style="font-size:9pt;color:#56627A">Life System Architect</div></div>
  </div></div>`;
const tracker = (n, from, to) => `<div class="page">${head(n)}
  <div class="kick">Dag ${from}–${to}</div><h1>Én handling. Hver dag.</h1>
  ${from===1?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-bottom:5mm"><div><b style="font-size:10pt">Min handling</b><div class="box" style="--h:11mm;margin-top:1mm"></div></div><div><b style="font-size:10pt">Mit minimum på en svær dag</b><div class="box" style="--h:11mm;margin-top:1mm"></div></div></div>`:`<p class="lead">Skriv Ja, hvis dit minimum blev gjort, og Nej, hvis det ikke blev. Brug en streg på dage uden planlagt handling.</p>`}
  <table><tr><th style="width:14mm">Dag</th><th style="width:22mm">Gjort</th><th>Hvad hjalp eller stod i vejen</th></tr>
  ${Array.from({length:to-from+1},(_,i)=>`<tr><td style="background:#E6DCC8;color:#2F5D8C;height:${from===1?11.6:12.6}mm;padding:1.5mm 2mm;font-size:11pt">${String(from+i).padStart(2,"0")}</td><td style="height:${from===1?11.6:12.6}mm"></td><td style="height:${from===1?11.6:12.6}mm"></td></tr>`).join("")}
  </table>${foot(n)}</div>`;
const week = (n, w) => `<div class="page">${head(n)}
  <div class="kick">Ugentlig opfølgning · uge ${w}</div><h1>Hvad skal justeres?</h1>
  <p class="lead">Fem minutter. Justér strukturen og rammerne, ikke ambitionen.</p>
  ${q("Hvilke dage blev gennemført?","Eksempel: Fire gennemført ud af fem planlagte.",16)}
  ${q("Hvornår valgte jeg den nye vej – og hvornår den gamle?","",31)}
  ${q("Hvad stod oftest i vejen?","",23)}
  ${q("Den ene ændring, jeg afprøver i næste uge","Tidspunkt, forhindring eller størrelse. Ret én ting ad gangen.",23)}
  ${q("Min næste konkrete mulighed for at handle","",16)}
  ${foot(n)}</div>`;
(async()=>{const b=await chromium.launch();const p=await b.newPage();const out=path.join(__dirname,"out");
const html=path.join(out,"faa-det-gjort-30-dage.html");
fs.writeFileSync(html,`<!doctype html><html lang="da"><head><meta charset="utf-8"><style>${css}</style></head><body>${[cover,tracker(2,1,15),tracker(3,16,30),week(4,1),week(5,2),week(6,3),week(7,4)].join("")}</body></html>`);
await p.goto("file://"+html);await p.waitForTimeout(400);await p.pdf({path:path.join(out,"faa-det-gjort-30-dage.pdf"),format:"A4",printBackground:true,preferCSSPageSize:true});await b.close();})();

// Opfølgningsmails 2–5 efter testen (godkendt af Hagbarth 31/10-2026).
// Kilde: Notion → Monetization → "Opfølgningsmails efter testen". Ret teksten dér først, så her.
// Regler: ingen pris, ingen "Bliv CEO i dit eget liv", én opfordring pr. mail.

const BOOKING_URL = "https://calendly.com/hagbarth-nmvh/30min";

// day = antal hele døgn efter testen, hvor mailen tidligst sendes.
const FOLLOWUPS = [
  {
    step: 2,
    day: 1,
    subject: "Det ene sted, hvor dit eget liv falder igennem",
    paragraphs: [
      "I går tog du testen. Din profil viser det ene sted, hvor dit eget liv typisk falder igennem, når jobbet har taget det meste af dagen.",
      "De fleste læser den, nikker og lægger den væk. Så sker der ingenting.",
      "Slå op på side 3 og læs afsnittet \"Dit første skift\". Det er én lille handling. Gør den i dag.",
      "Og skriv gerne tilbage med ét ord: Passede profilen på dig?",
    ],
  },
  {
    step: 3,
    day: 3,
    subject: "Jeg har selv stået præcis dér",
    paragraphs: [
      "\"På arbejdet får jeg alt gjort. Mit eget liv kommer altid bagerst.\"",
      "Den sætning hører jeg igen og igen. Jeg har også selv sagt den.",
      "I 30 år har jeg fået systemer til at holde i virksomheder, også når konsulenten er kørt hjem. Og jeg har selv stået præcis dér: travl og leverende på jobbet, med resten sat på pause.",
      "Du mangler ikke evner. Du mangler et system uden for arbejdet.",
      "Det er det, jeg arbejder med. Mere om det om et par dage.",
    ],
  },
  {
    step: 4,
    day: 5,
    subject: "Det system, du allerede bruger på jobbet",
    paragraphs: [
      "På jobbet har du et system, der får tingene gjort. Det er det samme system, der mangler i dit eget liv.",
      "I <b>Foundation for High Performance™</b> bygger vi det ind i dit eget liv over fire uger. Vi starter med kroppen, fordi energien er det, alt andet hviler på.",
      "Første hold har 8 pladser. Forløbet er betalt, og vi taler om det hele i en optagelsessamtale på 30 minutter. Her ser vi på dit mål, din profil, og om forløbet er det rigtige for dig.",
      `Book din optagelsessamtale her: <a href="${BOOKING_URL}">${BOOKING_URL}</a>`,
    ],
  },
  {
    step: 5,
    day: 8,
    subject: "Ikke at vælge er også et valg",
    paragraphs: [
      "Dette er min sidste mail om første hold.",
      "Spørgsmålet er ikke kun, om du kan vente. Spørgsmålet er, hvad endnu et år med det samme mønster vil koste dig.",
      `Hvis du vil være med på første hold af Foundation for High Performance™, så book en optagelsessamtale her: <a href="${BOOKING_URL}">${BOOKING_URL}</a>`,
      "Hvis det ikke er nu, er det helt fint. Du får stadig mine mails om testen og kommende forløb.",
    ],
  },
];

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Designsystem: ink #1B2A41 på lys baggrund, links i blå #2F5D8C, forbehold i ink-muted #56627A.
function renderFollowup(mail, { firstName, unsubscribeUrl }) {
  const p = (html) => `<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#1B2A41">${html}</p>`;
  const body = [
    p(`Hej ${escapeHtml(firstName) || "der"},`),
    ...mail.paragraphs.map((t) => p(t.replace(/<a /g, '<a style="color:#2F5D8C" '))),
    p("Hagbarth"),
  ].join("\n");
  const footer = `<p style="margin:32px 0 0;font-size:12px;line-height:18px;color:#56627A">Du får denne mail, fordi du tog testen "Hvor falder dit eget liv igennem?". <a style="color:#56627A" href="${unsubscribeUrl}">Afmeld flere mails</a>.</p>`;
  return `<div style="font-family:'Source Sans 3',Arial,sans-serif;max-width:560px">\n${body}\n${footer}\n</div>`;
}

module.exports = { FOLLOWUPS, BOOKING_URL, renderFollowup, escapeHtml };

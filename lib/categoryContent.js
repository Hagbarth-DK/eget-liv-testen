const CATEGORY_CONTENT = {
  TOP: {
    name: "Topniveaujægeren",
    page3Heading: "Topniveaujægeren: Du har gjort topniveauet til et adgangskrav",
    detTestenPegerPaa:
      "Du mangler ikke ambitioner. Tværtimod. Problemet opstår, når den bedste version af din indsats bliver den eneste version, der tæller. Hvis du ikke kan gøre det ordentligt, gennemføre hele planen eller levere på dit højeste niveau, kan det føles mere logisk at vente, udskyde eller starte forfra senere.",
    saadanSerDetOftUd:
      "En forkortet træning, arbejdsblok eller rutine føles næsten meningsløs. En dårlig morgen får resten af dagen eller ugen til at føles ødelagt. Du kan levere intenst i korte perioder, men niveauet er for krævende at opretholde.",
    denSkjultePris:
      "Topniveauet giver dig enkelte stærke dage, men et ustabilt gennemsnit. Hver gang alt under 100 procent bliver til 0 procent, mister du den gentagelse, der skulle have bygget resultatet. Over tid bliver problemet ikke manglende evne, men manglende kontinuitet – og svækket tillid til, at dine planer kan overleve almindelige dage.",
    detDitSystemMangler:
      "Et defineret minimumsniveau: Den mindste version af en vigtig aktivitet, der stadig tæller og bevarer retningen.",
    foersteSkift:
      "Vælg én vigtig aktivitet. Definér tre niveauer: ambitionsniveauet på en god dag, normalniveauet og minimumsniveauet på en dårlig dag. Minimumsniveauet skal være lille nok til at blive gennemført – og meningsfuldt nok til at bevare fremdriften.",
    buildPoint: "Dit vigtigste byggepunkt er et minimum, der stadig tæller, når topniveauet ikke er muligt. I B.U.N.D. er det N: Nedskalér.",
    bridgeLine: "For dig handler arbejdet især om at bevare fremdriften på de dage, hvor 100 procent ikke er muligt.",
  },
  SPR: {
    name: "Den spredte starter",
    page3Heading: "Den spredte starter: Du mangler ikke idéer – du mangler et filter",
    detTestenPegerPaa:
      "Du ser mange muligheder, løsninger og nye veje. Det er en styrke. Problemet opstår, når alle muligheder får lov til at konkurrere om den samme tid. Så bliver det nyeste, mest spændende eller mest presserende let vigtigere end det, du allerede havde besluttet.",
    saadanSerDetOftUd:
      "Du har flere aktive mål eller projekter, end din kalender realistisk kan bære. Du starter stærkt, men mister fokus, når arbejdet bliver ensformigt eller kræver gentagelse. Du føler dig travl og mentalt optaget uden at kunne pege på tilsvarende fremdrift.",
    denSkjultePris:
      "Når opmærksomheden hele tiden skifter, får dine bedste idéer aldrig lov til at bygge oven på hinanden. Du fejler ikke nødvendigvis dramatisk. Du mister i stedet den samlede effekt af at gøre det samme vigtige længe nok. Resultatet er mange begyndelser, få afslutninger og en vedvarende oplevelse af, at du burde være længere.",
    detDitSystemMangler:
      "En tydelig prioriteringsregel, der gør det legitimt at parkere gode idéer, mens de få vigtigste aktiviteter får ro til at virke.",
    foersteSkift:
      "Vælg det projekt, der skal have førsteprioritet de næste 14 dage. Definér den ene aktivitet, der flytter projektet mest. Alt andet skrives på en parkeringsliste – ikke på dagens opgaveliste.",
    buildPoint: "Dit vigtigste byggepunkt er en tydelig prioritering af de få aktiviteter, der skaber mest fremdrift. I B.U.N.D. er det U: Udvælg.",
    bridgeLine: "For dig handler arbejdet især om at vælge de få aktiviteter, der skal beskyttes mod nye idéer og konkurrerende projekter.",
  },
  UDS: {
    name: "Den stille udskyder",
    page3Heading: "Den stille udskyder: Du ved det godt – men får det ikke omsat til handling",
    detTestenPegerPaa:
      "Du mangler sandsynligvis ikke viden. Du kan ofte forklare præcis, hvad der bør ske. Men det første skridt bliver ved med at blive skubbet, og udsættelsen sker stille: Du tænker, planlægger, forbereder eller laver noget andet, der føles fornuftigt – uden at begynde på det, der faktisk betyder mest.",
    saadanSerDetOftUd:
      "Du laver planer, som mister kraft, når hverdagen tager over. Du venter på mere tid, mere klarhed eller en bedre startdag. Du laver mindre vigtige opgaver, fordi de giver følelsen af at være i gang.",
    denSkjultePris:
      "Den største pris er ikke kun de uløste opgaver. Det er, at hvert brudt løfte gør det lettere at bryde det næste. Når dine egne beslutninger gentagne gange ikke bliver fulgt af handling, begynder du gradvist at tro mindre på dem. Det gør den næste start tungere – ikke fordi du er doven, men fordi dit system ikke har en pålidelig start- og genstartmekanisme.",
    detDitSystemMangler:
      "Et lille, konkret startpunkt og en fast regel for, hvad du gør ved den næste mulighed for at handle – uden at vente på mandag eller følelsen af at være klar.",
    foersteSkift:
      "Gør starten mindre. Vælg én handling, der kan udføres på højst 10 minutter, og som bringer dig direkte ind i det vigtige. Gør den i dag. Ikke for at færdiggøre opgaven, men for at genopbygge forbindelsen mellem beslutning og handling.",
    buildPoint: "Dit vigtigste byggepunkt er en fast start- og genstartsregel, der gør næste handling tydelig. I B.U.N.D. er det D: Driftssikr.",
    bridgeLine: "For dig handler arbejdet især om at gøre starten konkret og genopbygge tilliden til dine egne beslutninger.",
  },
};

// §5.4/§9 — Blandet profil bruger et fast lookup af tre fuldt udskrevne tekstblokke,
// IKKE en generisk [Mønster A]+[Mønster B]-skabelon. Nøgle: sorteret par, TOP->SPR->UDS-rækkefølge.
const MIXED_LOOKUP = {
  TOP_SPR: {
    title: "En blandet profil: Topniveaujægeren + Den spredte starter",
    page3Heading: "Blandet profil: Høje krav og skiftende fokus",
    testenPegerPaa:
      "Dine svar fordeler sig mellem Topniveaujægeren og Den spredte starter. Nogle gange bliver kravene så høje, at det bliver svært at begynde eller fortsætte. Andre gange bliver fokus spredt over for mange idéer, opgaver eller projekter.",
    skjultePris:
      "Den skjulte pris er brudt kontinuitet. Enten bliver opgaven for stor til at gennemføre, eller også mister den pladsen til noget nyt. Du har derfor brug for en struktur, der både hjælper dig med at vælge det vigtigste og fastlægge et minimum, der stadig tæller.",
    foersteSkift:
      "Observer de næste syv dage. Når du ikke får gjort det vigtige, så notér, hvad der skete: Blev kravene for høje, eller blev dit fokus flyttet til noget andet? Det viser dig, hvilken af de to reaktioner der oftest tager over.",
    buildPoint: "Du har især brug for at udvælge det vigtigste og nedskalere indsatsen til et minimum, der stadig tæller. Det er U og N i B.U.N.D.: Udvælg og Nedskalér.",
    bridgeLine: "For dig handler arbejdet især om at beskytte de vigtigste aktiviteter mod både for høje krav og konkurrerende idéer.",
  },
  TOP_UDS: {
    title: "En blandet profil: Topniveaujægeren + Den stille udskyder",
    page3Heading: "Blandet profil: Høje krav og udsat start",
    testenPegerPaa:
      "Dine svar fordeler sig mellem Topniveaujægeren og Den stille udskyder. Nogle gange bliver kravene så høje, at det føles forkert at begynde i det små. Andre gange bliver starten udsat, selv om du godt ved, hvad der skal ske.",
    skjultePris:
      "Den skjulte pris er, at handlingen bliver forsinket fra to sider: Enten skal forholdene være bedre, eller også skal indsatsen være større. Du har derfor brug for en struktur, der gør starten konkret og definerer en mindre version, som stadig tæller.",
    foersteSkift:
      "Observer de næste syv dage. Når du ikke får gjort det vigtige, så notér, om du ventede, fordi indsatsen ikke kunne blive god nok, eller fordi du udsatte selve starten. Det gør det lettere at vælge den rigtige modhandling.",
    buildPoint: "Du har især brug for at nedskalere indsatsen til et minimum, der stadig tæller, og driftssikre din hverdag med en fast start- og genstartsregel. Det er N og D i B.U.N.D.: Nedskalér og Driftssikr.",
    bridgeLine: "For dig handler arbejdet især om at gøre starten mindre, tydeligere og mulig – også når forholdene ikke er perfekte.",
  },
  SPR_UDS: {
    title: "En blandet profil: Den spredte starter + Den stille udskyder",
    page3Heading: "Blandet profil: Spredt fokus og udsat start",
    testenPegerPaa:
      "Dine svar fordeler sig mellem Den spredte starter og Den stille udskyder. Nogle gange bliver fokus flyttet til nye idéer eller mindre vigtige opgaver. Andre gange bliver det vigtigste skubbet til senere, selv om du ved, hvad næste skridt er.",
    skjultePris:
      "Den skjulte pris er, at du kan være mentalt optaget og aktiv uden at skabe stabil bevægelse i det vigtigste. Du har derfor brug for en struktur, der både vælger en klar prioritet og gør det første skridt så konkret, at det bliver taget.",
    foersteSkift:
      "Observer de næste syv dage. Når du ikke får gjort det vigtige, så notér, om du skiftede fokus eller udsatte starten. Det viser dig, om du først skal beskytte prioriteten eller gøre handlingen mindre.",
    buildPoint: "Du har især brug for at udvælge en tydelig prioritet og driftssikre næste handling med en fast start- og genstartsregel. Det er U og D i B.U.N.D.: Udvælg og Driftssikr.",
    bridgeLine: "For dig handler arbejdet især om at holde fokus på én retning og gøre næste handling så konkret, at den ikke bliver skubbet.",
  },
};

function getMixedContent(categoryA, categoryB) {
  const order = ["TOP", "SPR", "UDS"];
  const sorted = [categoryA, categoryB].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return MIXED_LOOKUP[`${sorted[0]}_${sorted[1]}`];
}

const BALANCED_CONTENT = {
  title: "Et skiftende mønster",
  page2Text:
    "Dine svar fordeler sig lige mellem alle tre mønstre. Det betyder ikke, at du har tre problemer. Det betyder, at situationen er med til at afgøre, hvilken reaktion der tager over: Nogle gange hæver du kravene, andre gange spreder du fokus, og andre gange udsætter du starten. Alle tre mønstre træder derfor lige tydeligt frem i dine svar.",
  page3Heading: "Et skiftende mønster: Din reaktion ændrer sig med situationen",
  testenPegerPaa:
    "Dine svar fordeler sig lige mellem Topniveaujægeren, Den spredte starter og Den stille udskyder. Det er ikke et upræcist resultat. Det viser, at det ikke er én bestemt reaktion, der spænder ben for dig. Mønstret skifter med situationen. Nogle gange hæver du kravene så meget, at det bliver svært at begynde eller fortsætte. Andre gange spreder du dit fokus over for mange ting. Og i andre situationer udsætter du selve starten.",
  skjultePris:
    "Det gør mønstret vanskeligere at opdage i øjeblikket. Du kan ikke nøjes med at rette ét enkelt problem, fordi det svage punkt skifter. Du har brug for en fast struktur, der hjælper dig med at vælge retning, prioritere det vigtigste og fortsætte – uanset hvilken reaktion der dukker op.",
  foersteSkift:
    "Observer de næste syv dage uden at dømme dig selv. Når du ikke får gjort det vigtige, så notér blot, hvad der skete: Hævede du kravene, spredte du dit fokus, eller udsatte du starten? Efter en uge har du et mere ærligt billede af, hvordan mønstrene skifter i din hverdag. Det giver dig et bedre grundlag for at bygge en struktur, der fungerer på tværs af situationerne.",
  buildPoint: "Bruddet kan opstå forskellige steder, afhængigt af situationen. Derfor skal hele B.U.N.D.-strukturen hænge sammen.",
  bridgeLine: "For dig handler arbejdet især om at bygge én samlet struktur, der giver dig et fast holdepunkt og hjælper dig med at blive på sporet, uanset hvilken reaktion der tager over.",
};

const STABLE_CONTENT = {
  title: "Et forholdsvis stabilt bundniveau",
  page3Heading: "Et forholdsvis stabilt bundniveau: Du kan ofte justere uden at stoppe helt",
  fullText:
    "Dine svar viser ikke ét dominerende mønster. Det tyder på, at du ofte kan vælge, tilpasse og genstarte uden at stoppe helt. Det er værdifuldt – men det betyder ikke nødvendigvis, at dit system er bevidst, tydeligt eller stærkt nok til et større mål. Spørgsmålet for dig er derfor ikke primært, hvordan du stopper et tydeligt problem. Det er, om din nuværende stabilitet kan bære den næste forandring, du vil skabe – også når belastningen bliver større.",
  foersteSkift:
    "Vælg ét vigtigt mål, og skriv dit system på én side: retning, de tre vigtigste aktiviteter, minimumsniveauet på en dårlig dag og din ugentlige opfølgning. Hvis noget mangler, kan du se, hvor din stabilitet stadig bygger på fornemmelse i stedet for en fast struktur.",
  buildPoint: "Muligheden er at gøre din nuværende stabilitet bevidst, enkel og anvendelig på et større mål.",
  bridgeLine: "For dig handler arbejdet især om at gøre din nuværende stabilitet bevidst, enkel og stærk nok til et større mål.",
};

function secondaryLine(secondaryName) {
  return `Du har også træk af ${secondaryName}. Det betyder ikke, at du har to problemer. Det betyder, at dit primære mønster ikke står alene, og at din reaktion kan ændre sig, når presset eller omgivelserne ændrer sig.`;
}

module.exports = { CATEGORY_CONTENT, MIXED_LOOKUP, getMixedContent, BALANCED_CONTENT, STABLE_CONTENT, secondaryLine };

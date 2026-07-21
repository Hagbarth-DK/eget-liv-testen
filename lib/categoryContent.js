const CATEGORY_CONTENT = {
  TOP: {
    name: "Topniveaujægeren",
    page3Heading: "Topniveaujægeren: Du har gjort topniveau til adgangskrav",
    detTestenPegerPaa:
      "Du mangler ikke ambitioner. Tværtimod. Dit problem opstår, når den bedste version af din indsats bliver den eneste version, der tæller. Hvis du ikke kan gøre det ordentligt, gennemføre hele planen eller levere på dit højeste niveau, føles det mere logisk at vente, skubbe eller starte forfra senere.",
    saadanSerDetOftUd:
      "En forkortet træning, arbejdsblok eller rutine føles næsten meningsløs. En dårlig morgen får resten af dagen eller ugen til at føles ødelagt. Du kan levere intenst i korte perioder, men niveauet er for dyrt at opretholde.",
    denSkjultePris:
      "Topniveauet giver dig enkelte stærke dage, men et ustabilt gennemsnit. Hver gang alt under 100 procent bliver til 0 procent, mister du den gentagelse, der skulle have bygget resultatet. Over tid bliver problemet ikke manglende evne, men manglende kontinuitet — og svækket tillid til, at dine planer kan overleve almindelige dage.",
    detDitSystemMangler:
      "Et defineret minimumsniveau: den mindste version af en vigtig aktivitet, der stadig tæller og bevarer retningen.",
    foersteSkift:
      "Vælg én vigtig aktivitet. Definér tre niveauer: ambition på en god dag, normalniveau og minimum på en dårlig dag. Minimum skal være lille nok til at blive gennemført — og meningsfuldt nok til at bevare fremdriften.",
    weakLink: "N — der mangler et minimum, som stadig tæller.",
    bridgeLine: "For dig handler arbejdet især om at bevare fremdrift på de dage, hvor 100 procent ikke er muligt.",
  },
  SPR: {
    name: "Den spredte starter",
    page3Heading: "Den spredte starter: Du mangler ikke idéer — du mangler et filter",
    detTestenPegerPaa:
      "Du kan se muligheder, løsninger og nye veje hurtigere end de fleste. Det er en styrke. Problemet opstår, når alle muligheder får lov at konkurrere om den samme tid. Så bliver det nyeste, mest spændende eller mest presserende let vigtigere end det, du allerede havde besluttet.",
    saadanSerDetOftUd:
      "Du har flere aktive mål eller projekter, end din kalender realistisk kan bære. Du starter stærkt, men mister fokus, når arbejdet bliver ensformigt eller kræver gentagelse. Du føler dig travl og mentalt optaget uden at kunne pege på tilsvarende fremdrift.",
    denSkjultePris:
      "Når opmærksomheden hele tiden skifter, når dine bedste idéer aldrig at bygge oven på hinanden. Du fejler ikke nødvendigvis dramatisk. Du mister i stedet den akkumulerede effekt af at gøre det samme vigtige længe nok. Resultatet er mange begyndelser, få afslutninger og en vedvarende oplevelse af, at du burde være længere.",
    detDitSystemMangler:
      "En tydelig udvælgelsesregel, der gør det legitimt at parkere gode idéer, mens de få vigtigste aktiviteter får ro til at virke.",
    foersteSkift:
      "Vælg ét primært projekt. Vælg det projekt, der skal have førsteprioritet de næste 14 dage. Definér den ene aktivitet, der flytter det mest. Alt andet skrives på en parkeringsliste — ikke på dagens to-do-liste.",
    weakLink: "U — der mangler en hård udvælgelse af det vigtigste.",
    bridgeLine: "For dig handler arbejdet især om at vælge de få aktiviteter, der skal beskyttes mod nye idéer og konkurrerende projekter.",
  },
  UDS: {
    name: "Den stille udskyder",
    page3Heading: "Den stille udskyder: Du ved det godt — men får ikke omsat det til handling",
    detTestenPegerPaa:
      "Du mangler sandsynligvis ikke viden. Du kan ofte forklare præcis, hvad der bør ske. Men første skridt bliver ved med at blive skubbet, og udsættelsen sker stille: Du tænker, planlægger, forbereder eller laver noget andet, der føles fornuftigt — uden at begynde på det, der faktisk betyder mest.",
    saadanSerDetOftUd:
      "Du laver planer, som mister kraft, når hverdagen begynder. Du venter på mere tid, mere klarhed eller en bedre startdag. Du laver mindre vigtige opgaver, fordi de giver følelsen af at være i gang.",
    denSkjultePris:
      "Den største pris er ikke kun de uløste opgaver. Det er, at hvert brudt løfte gør det lettere at bryde det næste. Når dine egne beslutninger gentagne gange ikke bliver fulgt af handling, begynder du gradvist at tro mindre på dem. Det gør næste start tungere — ikke fordi du er doven, men fordi dit system ikke har en pålidelig start- og genstartmekanisme.",
    detDitSystemMangler:
      "Et lille, konkret startpunkt og en fast regel for, hvad du gør ved næste mulige handling — uden at vente på mandag eller følelsen af at være klar.",
    foersteSkift:
      "Gør starten mindre. Vælg én handling, der kan udføres på højst 10 minutter og som bringer dig direkte ind i det vigtige. Gør den i dag. Ikke for at færdiggøre opgaven, men for at genopbygge forbindelsen mellem beslutning og handling.",
    weakLink: "D — der mangler en driftssikker start- og genstartstruktur.",
    bridgeLine: "For dig handler arbejdet især om at gøre starten konkret og genopbygge tilliden til dine egne beslutninger.",
  },
};

const MIXED_CONTENT = {
  page3Heading: "Blandet profil: Dit mønster skifter — men resultatet bliver det samme",
  bodyTemplate: (nameA, nameB) =>
    `Dine svar fordeler sig mellem ${nameA} og ${nameB}. På nogle dage bliver kravene for høje. På andre bliver fokus spredt eller starten udsat. Det er ikke inkonsekvent. Det viser, at du bruger forskellige strategier til at håndtere pres, usikkerhed eller manglende overskud.`,
  secondBody:
    "Den skjulte pris er uforudsigelighed. Når mønstret skifter, er det svært at vide, hvad du skal rette. Derfor er løsningen ikke en enkelt motivationsteknik. Du har brug for én struktur, der både vælger retning, beskytter fokus, definerer minimum og sikrer genstart.",
  foersteSkift:
    "Observer de næste syv dage. Når du ikke gør det vigtige, markér kun én ting: Hævede du kravene, skiftede du fokus, eller udsatte du starten? Det giver dig et ærligt billede af, hvilket mønster der tager over i hvilke situationer.",
  weakLink: "Det svage led skifter; derfor skal hele kæden samles.",
  bridgeLine: "For dig handler arbejdet især om at få ét system, der virker, selv når dit mønster skifter med situationen.",
};

const BALANCED_CONTENT = {
  title: "Fuldt afbalanceret profil",
  page2Text:
    "Dine svar fordeler sig lige mellem alle tre mønstre. Det betyder ikke, at du har tre problemer — det betyder, at situationen afgør, hvilken strategi der tager over: Nogle gange hæver du kravene, andre gange spreder du fokus, og andre gange udsætter du starten. Alle tre er lige aktive i dig lige nu.",
  page3Heading: "Fuldt afbalanceret profil: Alle tre mønstre er lige aktive i dig",
  body1:
    "Dine svar fordeler sig lige mellem Topniveaujægeren, Den spredte starter og Den stille udskyder. Det er ikke et upræcist resultat — det er et præcist billede af, at du ikke har ét fast mønster, men tre forskellige strategier, der hver især tager over afhængigt af situationen: nogle gange hæver du kravene til dig selv, andre gange spreder du fokus over for mange ting, og andre gange udsætter du starten helt.",
  body2:
    "Den skjulte pris er den samme som ved et blandet mønster, bare mere udtalt: Fordi ingen enkelt strategi dominerer, er det sværere at genkende mønstret i øjeblikket, og dermed sværere at vide, hvad du skal justere. Løsningen er ikke at finde \"det ene rigtige problem\" — det er én struktur, der er robust nok til at fange dig, uanset hvilken af de tre strategier der tager over denne gang.",
  foersteSkift:
    "Observer de næste syv dage uden at dømme dig selv. Når du ikke gør det vigtige, notér blot hvilken af de tre reaktioner der skete: hævede krav, spredt fokus, eller udsat start. Efter en uge har du et ærligt billede af, hvordan de tre mønstre veksler i din hverdag — og et bedre grundlag for at bygge en struktur, der dækker alle tre.",
  weakLink: "Alle tre led kan bryde, afhængigt af situationen; derfor er hele kæden lige vigtig at bygge.",
  bridgeLine: "For dig handler arbejdet især om at bygge én struktur, der er robust nok til at fange dig, uanset hvilken af dine tre strategier der tager over.",
};

const STABLE_CONTENT = {
  title: "Et forholdsvis stabilt bundniveau",
  page3Heading: "Et forholdsvis stabilt bundniveau: Du kan ofte justere uden at stoppe",
  body1:
    "Dine svar viser ikke et dominerende mønster. Det tyder på, at du allerede kan vælge, tilpasse og genstarte bedre end mange. Det er værdifuldt — men det betyder ikke nødvendigvis, at dit system er bevidst eller overførbart til et større mål.",
  body2:
    "Spørgsmålet for dig er derfor ikke primært, hvordan du stopper et tydeligt problem. Det er, om din nuværende stabilitet er stærk nok til den næste transformation, du vil skabe — og om den kan fungere, når belastningen bliver større.",
  foersteSkift:
    "Vælg ét vigtigt mål og skriv dit system på én side: retning, tre vigtigste aktiviteter, minimum på en dårlig dag og ugentlig opfølgning. Hvis noget mangler, ved du, hvor strukturen stadig er intuitiv i stedet for driftssikker.",
  weakLink: "Muligheden er at gøre en intuitiv styrke til et bevidst system.",
  bridgeLine: "For dig handler arbejdet især om at gøre din nuværende stabilitet bevidst, enkel og stærk nok til et større mål.",
};

function secondaryLine(secondaryName) {
  return `Du har også træk af ${secondaryName}. Det betyder ikke, at du har to problemer. Det betyder, at dit primære mønster kan skifte form, når presset eller omgivelserne ændrer sig.`;
}

module.exports = { CATEGORY_CONTENT, MIXED_CONTENT, BALANCED_CONTENT, STABLE_CONTENT, secondaryLine };

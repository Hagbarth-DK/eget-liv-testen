// §6.2.1 — fast, deterministisk tie-break-prioritet: Topniveaujægeren -> Den spredte starter -> Den stille udskyder
const TIE_BREAK_ORDER = ["TOP", "SPR", "UDS"];

function sortByScore(scores) {
  return ["TOP", "SPR", "UDS"].sort((a, b) => {
    if (scores[b] !== scores[a]) return scores[b] - scores[a];
    return TIE_BREAK_ORDER.indexOf(a) - TIE_BREAK_ORDER.indexOf(b);
  });
}

// §6.2 — tjekkes i denne rækkefølge: STABIL -> BALANCERET -> BLANDET -> TYDELIGT -> TENDENS
// BALANCERET skal tjekkes FØR BLANDET, ellers ville en ren 2-2-2-uafgørelse blive
// tvunget ind i Mønster A/B-skabelonen og systematisk skjule den tredje, lige aktive kategori.
function computeResult(scores) {
  const [cat1, cat2, cat3] = sortByScore(scores);
  const score1 = scores[cat1];
  const score2 = scores[cat2];
  const score3 = scores[cat3];

  let resultType;
  if (score1 <= 1) {
    resultType = "STABIL";
  } else if (score1 === score2 && score2 === score3) {
    resultType = "BALANCERET";
  } else if ((score1 === score2 || score1 - score2 === 1) && score2 >= 2) {
    resultType = "BLANDET";
  } else if (score1 >= 4 && score1 - score2 >= 2) {
    resultType = "TYDELIGT";
  } else {
    resultType = "TENDENS";
  }

  let primaryCategory = null;
  let secondaryCategory = null;
  let mixedCategoryB = null;

  if (resultType === "STABIL" || resultType === "BALANCERET") {
    // intet primært mønster
  } else if (resultType === "BLANDET") {
    primaryCategory = cat1;
    mixedCategoryB = cat2;
  } else {
    primaryCategory = cat1;
    // §6.3 — sekundær kun ved TYDELIGT/TENDENS, kun hvis ≥2 point og højst 2 point under primær
    if (score2 >= 2 && score1 - score2 <= 2) {
      secondaryCategory = cat2;
    }
  }

  return { resultType, primaryCategory, secondaryCategory, mixedCategoryB };
}

// §6.5 — vælg ét citat pr. kategori: laveste spørgsmålsnummer, der scorede point til den
// kategori. Aldrig et 0-point-svar. Kategorier uden noget scoret svar udelades helt (defensivt).
function selectQuotes(answers) {
  const quotes = {};
  for (const answer of answers || []) {
    if (!answer || !answer.category) continue;
    if (!(answer.category in quotes)) {
      quotes[answer.category] = answer.text;
    }
  }
  return quotes;
}

module.exports = { computeResult, selectQuotes };

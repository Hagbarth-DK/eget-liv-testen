const { corsHeaders, preflightResponse } = require("../../lib/cors");
const { generateReportPdf } = require("../../lib/pdf");
const { computeResult, selectQuotes } = require("../../lib/scoring");
const { sendReportEmail, upsertContact, getContact, SENDER } = require("../../lib/brevo");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CATEGORIES = ["TOP", "SPR", "UDS"];
const VALID_ANSWER_CATEGORIES = [...CATEGORIES, null];

const BOOKING_URL = process.env.BOOKING_URL || "https://calendly.com/hagbarth-nmvh/30min";
const SENDER_NAME = "Hagbarth Skjold Andersen";
const SENDER_CONTACT = SENDER.email;
// §12 — ansøgningsfristen [dato] må ikke gættes. Sættes via miljøvariabel, når Hagbarth beslutter den.
const APPLICATION_DEADLINE = process.env.APPLICATION_DEADLINE || null;

// ---------- Beskyttelse mod misbrug (30/10-2026) ----------
// 1) Usynligt felt: mennesker ser det ikke, robotter udfylder det.
// 2) Minimumstid: 7 spørgsmål kan ikke besvares af et menneske på under 12 sekunder.
// 3) Højst 5 indsendelser pr. adresse pr. time (husket i den kørende server).
// 4) Samme e-mail får højst én profil pr. 10 minutter.
// Robotter får et "ok"-svar, så de ikke lærer, hvad der stopper dem.
const MIN_ELAPSED_MS = 12000;
const IP_LIMIT = 5;
const IP_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_COOLDOWN_MS = 10 * 60 * 1000;
const recentByIp = new Map();

function clientIp(event) {
  const h = event.headers || {};
  return h["x-nf-client-connection-ip"] || (h["x-forwarded-for"] || "").split(",")[0].trim() || "ukendt";
}

function overIpLimit(ip) {
  const now = Date.now();
  const hits = (recentByIp.get(ip) || []).filter((t) => now - t < IP_WINDOW_MS);
  hits.push(now);
  recentByIp.set(ip, hits);
  if (recentByIp.size > 5000) recentByIp.clear();
  return hits.length > IP_LIMIT;
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

function validatePayload(body) {
  if (!body || typeof body !== "object") return "Ugyldig anmodning.";
  const { name, email, scores, answers, consent } = body;

  if (!name || typeof name !== "string" || !name.trim()) return "Navn mangler.";
  if (name.length > 60) return "Navnet er for langt.";
  if (!email || typeof email !== "string" || email.length > 120 || !EMAIL_RE.test(email)) return "Ugyldig e-mailadresse.";
  if (
    !scores ||
    typeof scores !== "object" ||
    !CATEGORIES.every((key) => typeof scores[key] === "number")
  ) {
    return "Ugyldige scores.";
  }
  if (!Array.isArray(answers) || answers.length !== 7) return "Ugyldige svar.";
  for (const answer of answers) {
    if (!answer || typeof answer !== "object") return "Ugyldigt svarformat.";
    if (!VALID_ANSWER_CATEGORIES.includes(answer.category)) return "Ugyldig kategori i svar.";
    if (typeof answer.text !== "string" || !answer.text) return "Ugyldig svartekst.";
  }
  if (consent !== true) return "Samtykke er påkrævet.";

  return null;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return preflightResponse();
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Metode ikke tilladt." });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "Ugyldig JSON." });
  }

  // Robot-tjek før alt andet. Stille "ok", intet sendes.
  if (body && typeof body.hp === "string" && body.hp.trim() !== "") return jsonResponse(200, { success: true });
  if (body && typeof body.elapsedMs === "number" && body.elapsedMs < MIN_ELAPSED_MS) return jsonResponse(200, { success: true });

  if (overIpLimit(clientIp(event))) {
    return jsonResponse(429, { error: "Der er sendt mange profiler herfra på kort tid. Prøv igen om en time." });
  }

  const validationError = validatePayload(body);
  if (validationError) return jsonResponse(400, { error: validationError });

  const { name, email, scores, answers } = body;

  // Samme e-mail højst én gang pr. 10 minutter (fx dobbeltklik eller misbrug mod en fremmed adresse).
  try {
    const existing = await getContact(email);
    const modified = existing && Date.parse(existing.modifiedAt || "");
    if (modified && Date.now() - modified < EMAIL_COOLDOWN_MS) return jsonResponse(200, { success: true });
  } catch (e) {
    console.error("Kontakt-opslag før afsendelse fejlede (fortsætter):", e.message);
  }

  let step = "score";
  try {
    const { resultType, primaryCategory, secondaryCategory, mixedCategoryB } = computeResult(scores);
    const quotes = selectQuotes(answers);

    step = "pdf";
    const { buffer: pdfBuffer, filename, subject } = await generateReportPdf({
      name: name.trim(),
      scores,
      resultType,
      primaryCategory,
      secondaryCategory,
      mixedCategoryB,
      quotes,
      bookingUrl: BOOKING_URL,
      senderName: SENDER_NAME,
      applicationDeadline: APPLICATION_DEADLINE,
    });

    step = "mail";
    await sendReportEmail({ toEmail: email, toName: name.trim(), pdfBuffer, filename, subject });
    step = "kontakt";
    await upsertContact({
      email,
      name: name.trim(),
      resultType,
      primaryCategory,
      secondaryCategory,
      mixedCategoryB,
      scores,
      quotes,
    });

    return jsonResponse(200, { success: true });
  } catch (err) {
    console.error("submit-quiz fejl:", step, err);
    // Fejlkoden viser kun trinnet og en eventuel HTTP-status fra Brevo — aldrig nøgler eller svartekst.
    const upstream = (String(err && err.message).match(/\((\d{3})\)/) || [])[1] || "x";
    const contact = SENDER_CONTACT && !/^no-?reply@/i.test(SENDER_CONTACT) ? ` – eller skriv til ${SENDER_CONTACT}` : "";
    return jsonResponse(500, {
      error: `Der gik desværre noget galt, og vi kunne ikke sende din profil lige nu. Prøv igen om lidt${contact}. (Fejlkode: ${step}-${upstream})`,
    });
  }
};

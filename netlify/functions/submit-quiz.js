const { corsHeaders, preflightResponse } = require("../../lib/cors");
const { generateReportPdf } = require("../../lib/pdf");
const { computeResult, selectQuotes } = require("../../lib/scoring");
const { sendReportEmail, upsertContact } = require("../../lib/brevo");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CATEGORIES = ["TOP", "SPR", "UDS"];
const VALID_ANSWER_CATEGORIES = [...CATEGORIES, null];

const BOOKING_URL = process.env.BOOKING_URL || "https://calendly.com/hagbarth-nmvh/30min";
const SENDER_NAME = "Hagbarth Skjold Andersen";
const SENDER_CONTACT = process.env.BREVO_SENDER_EMAIL || "";
// §12 — ansøgningsfristen [dato] må ikke gættes. Sættes via miljøvariabel, når Hagbarth beslutter den.
const APPLICATION_DEADLINE = process.env.APPLICATION_DEADLINE || null;

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
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) return "Ugyldig e-mailadresse.";
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

  const validationError = validatePayload(body);
  if (validationError) return jsonResponse(400, { error: validationError });

  const { name, email, scores, answers } = body;

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
    // Brevos egen korte forklaring (fx "Key not found" eller "unrecognised IP address") — indeholder aldrig nøglen.
    const brevoMsg = (() => { try { return JSON.parse(String(err.message).split("): ")[1]).message || ""; } catch { return ""; } })().slice(0, 120);
    const contact = SENDER_CONTACT && !/^no-?reply@/i.test(SENDER_CONTACT) ? ` – eller skriv til ${SENDER_CONTACT}` : "";
    return jsonResponse(500, {
      error: `Der gik desværre noget galt, og vi kunne ikke sende din profil lige nu. Prøv igen om lidt${contact}. (Fejlkode: ${step}-${upstream}${brevoMsg ? " · " + brevoMsg : ""})`,
    });
  }
};

const { corsHeaders, preflightResponse } = require("../../lib/cors");
const { generateReportPdf } = require("../../lib/pdf");
const { computeResult } = require("../../lib/scoring");
const { sendReportEmail, upsertContact } = require("../../lib/brevo");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CATEGORIES = ["TOP", "SPR", "UDS"];

const BOOKING_URL = process.env.BOOKING_URL || "https://calendly.com/hagbarth-nmvh/30min";
const SENDER_NAME = "Hagbarth Skjold Andersen";
const SENDER_CONTACT = process.env.BREVO_SENDER_EMAIL || "";

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

function validatePayload(body) {
  if (!body || typeof body !== "object") return "Ugyldig anmodning.";
  const { name, email, scores, answerQ3, answerQ5, consent } = body;

  if (!name || typeof name !== "string" || !name.trim()) return "Navn mangler.";
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) return "Ugyldig e-mailadresse.";
  if (
    !scores ||
    typeof scores !== "object" ||
    !CATEGORIES.every((key) => typeof scores[key] === "number")
  ) {
    return "Ugyldige scores.";
  }
  if (answerQ3 !== undefined && typeof answerQ3 !== "string") return "Ugyldigt svar (spørgsmål 3).";
  if (answerQ5 !== undefined && typeof answerQ5 !== "string") return "Ugyldigt svar (spørgsmål 5).";
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

  const { name, email, scores, answerQ3, answerQ5 } = body;

  try {
    const { resultType, primaryCategory, secondaryCategory, mixedCategoryB } = computeResult(scores);

    const { buffer: pdfBuffer, filename, subject } = await generateReportPdf({
      name: name.trim(),
      scores,
      resultType,
      primaryCategory,
      secondaryCategory,
      mixedCategoryB,
      answerQ3: answerQ3 || "",
      answerQ5: answerQ5 || "",
      bookingUrl: BOOKING_URL,
      senderName: SENDER_NAME,
    });

    await sendReportEmail({ toEmail: email, toName: name.trim(), pdfBuffer, filename, subject });
    await upsertContact({
      email,
      name: name.trim(),
      resultType,
      primaryCategory,
      secondaryCategory,
      mixedCategoryB,
      scores,
      answerQ3: answerQ3 || "",
      answerQ5: answerQ5 || "",
    });

    return jsonResponse(200, { success: true });
  } catch (err) {
    console.error("submit-quiz fejl:", err);
    return jsonResponse(500, {
      error: "Noget gik galt — prøv igen, eller skriv til " + (SENDER_CONTACT || "os"),
    });
  }
};

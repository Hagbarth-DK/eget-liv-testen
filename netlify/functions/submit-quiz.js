const { corsHeaders, preflightResponse } = require("../../lib/cors");
const { CATEGORIES } = require("../../lib/content");
const { generateReportPdf } = require("../../lib/pdf");
const { sendReportEmail, upsertContact } = require("../../lib/brevo");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_CATEGORIES = Object.keys(CATEGORIES); // ["TOP", "SPR", "UDS"]

const BOOKING_URL = process.env.BOOKING_URL || "https://hagbarthandersen.com/book";
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
  const { name, email, category, scores, consent } = body;

  if (!name || typeof name !== "string" || !name.trim()) return "Navn mangler.";
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) return "Ugyldig e-mailadresse.";
  if (!category || !VALID_CATEGORIES.includes(category)) return "Ugyldig kategori.";
  if (
    !scores ||
    typeof scores !== "object" ||
    !VALID_CATEGORIES.every((key) => typeof scores[key] === "number")
  ) {
    return "Ugyldige scores.";
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

  const { name, email, category, scores } = body;

  try {
    const pdfBuffer = await generateReportPdf({
      name: name.trim(),
      category,
      bookingUrl: BOOKING_URL,
      senderName: SENDER_NAME,
      senderContact: SENDER_CONTACT,
    });

    await sendReportEmail({ toEmail: email, toName: name.trim(), pdfBuffer });
    await upsertContact({ email, name: name.trim(), category, scores });

    return jsonResponse(200, { success: true });
  } catch (err) {
    console.error("submit-quiz fejl:", err);
    return jsonResponse(500, {
      error: "Noget gik galt — prøv igen, eller skriv til " + (SENDER_CONTACT || "os"),
    });
  }
};

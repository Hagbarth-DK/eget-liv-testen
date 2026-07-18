const { logCheckin, getContact, sendFollowUpBookingEmail } = require("../../lib/brevo");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_WEEKS = [1, 2, 3, 4];
const VALID_ANSWERS = ["ja", "nej"];
const BOOKING_URL = process.env.BOOKING_URL || "https://calendly.com/hagbarth-nmvh/30min";

function htmlResponse(statusCode, message) {
  return {
    statusCode,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: `<!doctype html>
<html lang="da"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bundniveau-Testen — Check-in</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fffdfa; color: #1f1f1f; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; }
  .card { max-width: 440px; text-align: center; }
  h1 { font-size: 22px; margin-bottom: 12px; }
  p { font-size: 16px; line-height: 1.55; color: #3a3a3a; }
</style>
</head><body><div class="card"><h1>Bundniveau-Testen</h1><p>${message}</p></div></body></html>`,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") return htmlResponse(405, "Metode ikke tilladt.");

  const params = event.queryStringParameters || {};
  const email = (params.email || "").trim();
  const week = parseInt(params.week, 10);
  const answer = (params.answer || "").trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) return htmlResponse(400, "Ugyldigt eller manglende e-mail-link.");
  if (!VALID_WEEKS.includes(week)) return htmlResponse(400, "Ugyldig uge i linket.");
  if (!VALID_ANSWERS.includes(answer)) return htmlResponse(400, "Ugyldigt svar i linket.");

  try {
    await logCheckin({ email, week, answer });

    if (week === 4) {
      const contact = await getContact(email).catch(() => null);
      const name = (contact && contact.attributes && contact.attributes.FIRSTNAME) || "";
      await sendFollowUpBookingEmail({ toEmail: email, toName: name, bookingUrl: BOOKING_URL }).catch((err) => {
        console.error("Kunne ikke sende uge 4-opfølgningsmail:", err);
      });
      return htmlResponse(200, "Tak for dit svar! Du har nu gennemført alle 4 uger — tjek din indbakke for et link til at booke din personlige uge 4-samtale.");
    }

    return htmlResponse(200, "Tak! Dit svar er registreret.");
  } catch (err) {
    console.error("checkin fejl:", err);
    return htmlResponse(500, "Noget gik galt — prøv igen, eller skriv til os direkte.");
  }
};

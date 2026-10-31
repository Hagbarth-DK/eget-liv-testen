// Prøveudsendelse af én opfølgningsmail. Sendes KUN til Hagbarths egen adresse, uanset hvem der kalder.
// Brug: /.netlify/functions/followup-test?mail=2   (2–6)
const { corsHeaders, preflightResponse } = require("../../lib/cors");
const { FOLLOWUPS, renderFollowup } = require("../../lib/followupContent");
const { sendHtmlEmail, unsubscribeUrl } = require("../../lib/brevo");

const TEST_TO = "hagbarth@outlook.com";
const LIMIT = 10; // pr. time pr. instans
let calls = [];

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return preflightResponse();
  const headers = { ...corsHeaders(), "Content-Type": "application/json" };
  const now = Date.now();
  calls = calls.filter((t) => now - t < 60 * 60 * 1000);
  if (calls.length >= LIMIT) return { statusCode: 429, headers, body: JSON.stringify({ ok: false, fejl: "for mange prøver" }) };

  const step = Number((event.queryStringParameters || {}).mail);
  const mail = FOLLOWUPS.find((m) => m.step === step);
  if (!mail) return { statusCode: 400, headers, body: JSON.stringify({ ok: false, fejl: "mail skal være 2-6" }) };

  calls.push(now);
  try {
    await sendHtmlEmail({
      toEmail: TEST_TO,
      toName: "Hagbarth",
      subject: `[PRØVE] ${mail.subject}`,
      htmlContent: renderFollowup(mail, { firstName: "Hagbarth", unsubscribeUrl: unsubscribeUrl(TEST_TO) + "&proeve=1" }),
      tag: `proeve-${step}`,
    });
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, sendt: step }) };
  } catch (e) {
    return { statusCode: 502, headers, body: JSON.stringify({ ok: false, fejl: e.message.slice(0, 160) }) };
  }
};

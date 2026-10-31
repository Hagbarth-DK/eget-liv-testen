// Afmeldingslink fra opfølgningsmails. Kræver gyldig signatur, så ingen kan afmelde andre.
const crypto = require("crypto");
const { blacklistContact, unsubscribeToken } = require("../../lib/brevo");

function page(title, text) {
  return `<!doctype html><html lang="da"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#F6F4EF;font-family:'Source Sans 3',Arial,sans-serif;color:#1B2A41">
<div style="background:#1B2A41;color:#fff;padding:32px 16px"><div style="max-width:560px;margin:0 auto;font-size:24px;font-weight:700">${title}</div></div>
<div style="max-width:560px;margin:0 auto;padding:24px 16px;font-size:16px;line-height:24px">${text}</div></body></html>`;
}

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  const email = String(q.e || "").trim().toLowerCase();
  const token = String(q.t || "");
  const headers = { "Content-Type": "text/html; charset=utf-8" };
  let valid = false;
  try {
    const expected = unsubscribeToken(email);
    valid = email && token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {}
  if (!valid) return { statusCode: 400, headers, body: page("Linket virker ikke", "Afmeldingslinket er ugyldigt. Svar blot på mailen, så afmelder jeg dig.") };
  if (q.proeve === "1") return { statusCode: 200, headers, body: page("Du er afmeldt", "Prøve: Linket virker. Der er ikke afmeldt noget.") };
  try {
    await blacklistContact(email);
    return { statusCode: 200, headers, body: page("Du er afmeldt", "Du får ikke flere mails fra mig. Tak, fordi du tog testen.") };
  } catch {
    return { statusCode: 502, headers, body: page("Noget gik galt", "Afmeldingen gik ikke igennem. Svar blot på mailen, så afmelder jeg dig.") };
  }
};

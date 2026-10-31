const crypto = require("crypto");

const BREVO_API_BASE = "https://api.brevo.com/v3";

// Afsender for alle mails fra testen (Hagbarth 31/10-2026). Står i koden, så den ikke afhænger af Netlify.
const SENDER = { email: "hagbarth@hagbarthandersen.com", name: "Hagbarth Skjold Andersen" };

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Mangler miljøvariabel: ${name}`);
  return value;
}

async function sendReportEmail({ toEmail, toName, pdfBuffer, filename, subject }) {
  const apiKey = requireEnv("BREVO_API_KEY");

  const res = await fetch(`${BREVO_API_BASE}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: toEmail, name: toName }],
      subject: subject || `${toName}, din profil er klar`,
      htmlContent: `<p>Hej ${toName},</p>
<p>Tak, fordi du tog testen. Din personlige profil er vedhæftet som PDF.</p>
<p>Den viser, hvor dit eget liv falder igennem, når jobbet har taget det meste af dagen, og hvad der typisk sker mellem beslutning og handling.</p>
<p>Læs især side 3 og 4. Side 3 gør dit resultat konkret. Side 4 viser, hvordan det system, du allerede bruger på jobbet, kan bygges ind i dit eget liv.</p>
<p>På de sidste sider kan du læse om testpilotforløbet. Der er højst otte pladser, og en optagelsessamtale er uforpligtende.</p>
<p>Bedste hilsner<br/>Hagbarth Skjold Andersen<br/>Life System Architect</p>`,
      attachment: [
        {
          content: pdfBuffer.toString("base64"),
          name: filename || "din-profil.pdf",
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo e-mail-afsendelse fejlede (${res.status}): ${body}`);
  }

  return res.json();
}

async function sendFollowUpBookingEmail({ toEmail, toName, bookingUrl }) {
  const apiKey = requireEnv("BREVO_API_KEY");

  const res = await fetch(`${BREVO_API_BASE}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: toEmail, name: toName }],
      subject: "Din uge 4-samtale",
      htmlContent: `<p>Hej ${toName},</p><p>Du er nået til uge 4 — tid til at tage testen igen og holde en personlig samtale om, hvordan det er gået.</p><p>Book din samtale her: <a href="${bookingUrl}">${bookingUrl}</a></p><p>Mange hilsner<br/>Hagbarth</p>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo opfølgningsmail fejlede (${res.status}): ${body}`);
  }

  return res.json();
}

async function getContact(email) {
  const apiKey = requireEnv("BREVO_API_KEY");

  const res = await fetch(`${BREVO_API_BASE}/contacts/${encodeURIComponent(email)}`, {
    method: "GET",
    headers: { "api-key": apiKey, Accept: "application/json" },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo kontakt-opslag fejlede (${res.status}): ${body}`);
  }

  return res.json();
}

async function upsertContact({ email, name, resultType, primaryCategory, secondaryCategory, mixedCategoryB, scores, quotes }) {
  const apiKey = requireEnv("BREVO_API_KEY");
  const listId = requireEnv("BREVO_LIST_ID");

  const existing = await getContact(email);
  const hasBaseline = Boolean(existing && existing.attributes && existing.attributes.BASELINE_DATE);

  const attributes = {
    FIRSTNAME: name,
    RESULT_TYPE: resultType,
    PRIMARY_CATEGORY: primaryCategory || "",
    SECONDARY_CATEGORY: secondaryCategory || "",
    MIXED_CATEGORY_B: mixedCategoryB || "",
    SCORE_TOP: scores.TOP,
    SCORE_SPR: scores.SPR,
    SCORE_UDS: scores.UDS,
    QUOTE_TOP: (quotes && quotes.TOP) || "",
    QUOTE_SPR: (quotes && quotes.SPR) || "",
    QUOTE_UDS: (quotes && quotes.UDS) || "",
  };

  if (!hasBaseline) {
    attributes.BASELINE_RESULT_TYPE = resultType;
    attributes.BASELINE_SCORE_TOP = scores.TOP;
    attributes.BASELINE_SCORE_SPR = scores.SPR;
    attributes.BASELINE_SCORE_UDS = scores.UDS;
    attributes.BASELINE_DATE = new Date().toISOString();
  }

  const res = await fetch(`${BREVO_API_BASE}/contacts`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      updateEnabled: true,
      listIds: [Number(listId)],
      attributes,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo kontakt-oprettelse fejlede (${res.status}): ${body}`);
  }

  return res.status === 204 ? {} : res.json();
}

async function logCheckin({ email, week, answer }) {
  const apiKey = requireEnv("BREVO_API_KEY");

  const attributes = {};
  attributes[`CHECKIN_WEEK_${week}`] = answer.toUpperCase();
  attributes[`CHECKIN_WEEK_${week}_DATE`] = new Date().toISOString();

  const res = await fetch(`${BREVO_API_BASE}/contacts`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, updateEnabled: true, attributes }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo check-in log fejlede (${res.status}): ${body}`);
  }

  return res.status === 204 ? {} : res.json();
}

async function brevoFetch(path, { method = "GET", body } = {}) {
  const apiKey = requireEnv("BREVO_API_KEY");
  const res = await fetch(`${BREVO_API_BASE}${path}`, {
    method,
    headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

// Sender én HTML-mail fra Hagbarth (bruges til opfølgningsmails 2–5).
async function sendHtmlEmail({ toEmail, toName, subject, htmlContent, tag }) {
  const res = await brevoFetch("/smtp/email", {
    method: "POST",
    body: {
      sender: SENDER,
      replyTo: SENDER,
      to: [{ email: toEmail, name: toName || undefined }],
      subject,
      htmlContent,
      tags: tag ? [tag] : undefined,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo mail fejlede (${res.status}): ${body.slice(0, 200)}`);
  }
  return res.json();
}

// Alle kontakter på testens liste (sidevis).
async function listContactsInList() {
  const listId = requireEnv("BREVO_LIST_ID");
  const all = [];
  for (let offset = 0; offset < 10000; offset += 500) {
    const res = await brevoFetch(`/contacts/lists/${Number(listId)}/contacts?limit=500&offset=${offset}`);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Brevo liste-opslag fejlede (${res.status}): ${body.slice(0, 200)}`);
    }
    const data = await res.json();
    const batch = data.contacts || [];
    all.push(...batch);
    if (batch.length < 500) break;
  }
  return all;
}

// Opretter en tal-attribut i Brevo, hvis den ikke findes.
async function ensureNumberAttribute(name) {
  const res = await brevoFetch(`/contacts/attributes/normal/${name}`, { method: "POST", body: { type: "float" } });
  if (res.ok || res.status === 400) return; // 400 = findes allerede
  const body = await res.text().catch(() => "");
  throw new Error(`Brevo attribut ${name} fejlede (${res.status}): ${body.slice(0, 200)}`);
}

async function setContactAttributes(email, attributes) {
  const res = await brevoFetch(`/contacts/${encodeURIComponent(email)}`, { method: "PUT", body: { attributes } });
  if (!res.ok && res.status !== 204) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo opdatering fejlede (${res.status}): ${body.slice(0, 200)}`);
  }
}

// Afmelding: kontakten blokeres for flere mails i Brevo.
async function blacklistContact(email) {
  const res = await brevoFetch(`/contacts/${encodeURIComponent(email)}`, { method: "PUT", body: { emailBlacklisted: true } });
  if (!res.ok && res.status !== 204) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo afmelding fejlede (${res.status}): ${body.slice(0, 200)}`);
  }
}

// Signatur til afmeldingslinket, så ingen kan afmelde andre. Nøglen forlader aldrig serveren.
function unsubscribeToken(email) {
  const key = requireEnv("BREVO_API_KEY");
  return crypto.createHmac("sha256", `afmeld:${key}`).update(String(email).toLowerCase()).digest("hex").slice(0, 32);
}

function unsubscribeUrl(email) {
  const base = process.env.URL || "https://bejewelled-dragon-5e69df.netlify.app";
  return `${base}/.netlify/functions/afmeld?e=${encodeURIComponent(email)}&t=${unsubscribeToken(email)}`;
}

module.exports = {
  SENDER,
  sendReportEmail,
  sendFollowUpBookingEmail,
  upsertContact,
  getContact,
  logCheckin,
  sendHtmlEmail,
  listContactsInList,
  ensureNumberAttribute,
  setContactAttributes,
  blacklistContact,
  unsubscribeToken,
  unsubscribeUrl,
};

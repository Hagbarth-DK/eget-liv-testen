const BREVO_API_BASE = "https://api.brevo.com/v3";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Mangler miljøvariabel: ${name}`);
  return value;
}

async function sendReportEmail({ toEmail, toName, pdfBuffer, filename, subject }) {
  const apiKey = requireEnv("BREVO_API_KEY");
  const senderEmail = requireEnv("BREVO_SENDER_EMAIL");

  const res = await fetch(`${BREVO_API_BASE}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: "Hagbarth Skjold Andersen" },
      to: [{ email: toEmail, name: toName }],
      subject: subject || `${toName}, din Bundniveau-Profil er klar`,
      htmlContent: `<p>Hej ${toName},</p>
<p>Din personlige Bundniveau-Profil er klar. Den er vedhæftet som PDF.</p>
<p>Rapporten viser din pointfordeling, hvad dine svar peger på, og hvilke dele af B.U.N.D.-strukturen der er vigtigst for dig at bygge.</p>
<p>Læs især side 3 og 4. Side 3 gør dit resultat konkret. Side 4 viser, hvorfor en forandring sjældent holder, hvis retning, prioritering, minimumsniveau og en driftssikker hverdag ikke bliver bygget sammen.</p>
<p>På de sidste sider kan du læse om testpilotforløbet. Der er højst otte pladser, og en afklaringssamtale er uforpligtende.</p>
<p>Bedste hilsner<br/>Hagbarth Skjold Andersen<br/>Life System Architect</p>`,
      attachment: [
        {
          content: pdfBuffer.toString("base64"),
          name: filename || "bundniveau-profil.pdf",
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
  const senderEmail = requireEnv("BREVO_SENDER_EMAIL");

  const res = await fetch(`${BREVO_API_BASE}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: "Hagbarth Skjold Andersen" },
      to: [{ email: toEmail, name: toName }],
      subject: "Din uge 4-samtale",
      htmlContent: `<p>Hej ${toName},</p><p>Du er nået til uge 4 — tid til at tage Bundniveau-Testen igen og holde en personlig samtale om, hvordan det er gået.</p><p>Book din samtale her: <a href="${bookingUrl}">${bookingUrl}</a></p><p>Mange hilsner<br/>Hagbarth</p>`,
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

module.exports = { sendReportEmail, sendFollowUpBookingEmail, upsertContact, getContact, logCheckin };

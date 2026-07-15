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
      subject: subject || "Din Bundniveau-Diagnose",
      htmlContent: `<p>Hej ${toName},</p><p>Her er din personlige Bundniveau-Diagnose som lovet — se vedhæftningen.</p><p>Mange hilsner<br/>Hagbarth</p>`,
      attachment: [
        {
          content: pdfBuffer.toString("base64"),
          name: filename || "Bundniveau-Diagnose.pdf",
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

async function upsertContact({ email, name, category, scores }) {
  const apiKey = requireEnv("BREVO_API_KEY");
  const listId = requireEnv("BREVO_LIST_ID");

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
      attributes: {
        FIRSTNAME: name,
        CATEGORY: category,
        SCORE_TOP: scores.TOP,
        SCORE_SPR: scores.SPR,
        SCORE_UDS: scores.UDS,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo kontakt-oprettelse fejlede (${res.status}): ${body}`);
  }

  return res.status === 204 ? {} : res.json();
}

module.exports = { sendReportEmail, upsertContact };

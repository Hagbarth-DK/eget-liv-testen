// Sundhedstjek af testen (30/10-2026).
// Tjekker, at Brevo-nøglen virker herfra — uden at sende noget og uden at vise nøglen.
// Fanger fx en blokeret IP-adresse eller en udløbet/slettet nøgle.
const { corsHeaders, preflightResponse } = require("../../lib/cors");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return preflightResponse();
  const headers = { ...corsHeaders(), "Content-Type": "application/json" };
  const key = process.env.BREVO_API_KEY;
  if (!key) return { statusCode: 503, headers, body: JSON.stringify({ ok: false, brevo: "mangler nøgle" }) };

  try {
    const res = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": key, Accept: "application/json" },
    });
    if (!res.ok) {
      let reason = "";
      try { reason = ((await res.json()).message || "").slice(0, 120); } catch {}
      return { statusCode: 503, headers, body: JSON.stringify({ ok: false, brevo: res.status, reason }) };
    }
    const data = await res.json();
    const email = (data.plan || []).find((p) => p.type === "free" || p.creditsType === "sendLimit") || {};
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, brevo: 200, mailsLeft: typeof email.credits === "number" ? email.credits : null }),
    };
  } catch (e) {
    return { statusCode: 503, headers, body: JSON.stringify({ ok: false, brevo: "netværk" }) };
  }
};

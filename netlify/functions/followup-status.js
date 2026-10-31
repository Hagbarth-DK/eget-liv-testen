// Status for opfølgningsforløbet: kun antal, aldrig navne eller mailadresser. Sender intet.
const { corsHeaders, preflightResponse } = require("../../lib/cors");
const { runFollowups } = require("../../lib/followups");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return preflightResponse();
  const headers = { ...corsHeaders(), "Content-Type": "application/json" };
  try {
    const summary = await runFollowups({ dryRun: true });
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, kontakter: summary.kontakter, klar: summary.klar }) };
  } catch (e) {
    return { statusCode: 503, headers, body: JSON.stringify({ ok: false }) };
  }
};

const { corsHeaders, preflightResponse } = require("../../lib/cors");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return preflightResponse();

  return {
    statusCode: 200,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ status: "ok", version: "2026-10-31-ansigt" }),
  };
};

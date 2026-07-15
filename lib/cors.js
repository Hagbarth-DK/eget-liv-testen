function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function preflightResponse() {
  return {
    statusCode: 204,
    headers: corsHeaders(),
    body: "",
  };
}

module.exports = { corsHeaders, preflightResponse };

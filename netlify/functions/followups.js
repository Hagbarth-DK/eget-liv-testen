// Planlagt kørsel (se netlify.toml): sender opfølgningsmails 2–5 én gang i døgnet.
const { runFollowups } = require("../../lib/followups");

exports.handler = async () => {
  try {
    const summary = await runFollowups();
    console.log("Opfølgning:", JSON.stringify(summary));
    return { statusCode: 200, body: JSON.stringify({ ok: true, ...summary }) };
  } catch (e) {
    console.error("Opfølgning stoppede:", e.message);
    return { statusCode: 500, body: JSON.stringify({ ok: false }) };
  }
};

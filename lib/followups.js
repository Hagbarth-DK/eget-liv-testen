// Opfølgningsforløbet efter testen: mail 2–5 (godkendt af Hagbarth 31/10-2026).
// Kører dagligt. For hver kontakt på testens liste sendes højst én mail pr. kørsel:
// den næste i rækken, når der er gået nok døgn siden testen.
// Stopper, når kontakten er afmeldt, har fået mail 5 eller har FOLLOWUP_STOP = 1 i Brevo (fx efter booking).
const { FOLLOWUPS, renderFollowup } = require("./followupContent");
const {
  listContactsInList,
  ensureNumberAttribute,
  setContactAttributes,
  sendHtmlEmail,
  unsubscribeUrl,
} = require("./brevo");

const DAY_MS = 24 * 60 * 60 * 1000;
// Kun kontakter, der har taget testen efter forløbet blev sat op. Ældre kontakter får ikke mails om "i går".
const START = Date.parse("2026-10-31T00:00:00Z");
const MAX_PER_RUN = 250; // under Brevos 300 mails/døgn, så PDF-mails stadig kan komme igennem

// Kalenderdage i dansk tid, så "i går" passer: test kl. 22 → mail 2 næste morgen.
function dkDate(ts) {
  return Date.parse(new Date(ts).toLocaleDateString("sv-SE", { timeZone: "Europe/Copenhagen" }) + "T00:00:00Z");
}

function nextDue(contact, now) {
  const a = contact.attributes || {};
  if (contact.emailBlacklisted) return null;
  if (Number(a.FOLLOWUP_STOP) === 1) return null;
  const testedAt = Date.parse(a.BASELINE_DATE || "");
  if (!testedAt || testedAt < START) return null;
  const sent = Number(a.FOLLOWUP_STEP) || 1; // mail 1 = PDF'en
  const mail = FOLLOWUPS.find((m) => m.step === sent + 1);
  if (!mail) return null;
  const days = Math.round((dkDate(now) - dkDate(testedAt)) / DAY_MS);
  return days >= mail.day ? mail : null;
}

async function runFollowups({ dryRun = false, now = Date.now() } = {}) {
  const contacts = await listContactsInList();
  const due = [];
  for (const c of contacts) {
    const mail = nextDue(c, now);
    if (mail) due.push({ contact: c, mail });
  }

  const summary = { kontakter: contacts.length, klar: { 2: 0, 3: 0, 4: 0, 5: 0 }, sendt: 0, fejl: 0 };
  for (const d of due) summary.klar[d.mail.step] += 1;
  if (dryRun) return summary;

  await ensureNumberAttribute("FOLLOWUP_STEP");
  await ensureNumberAttribute("FOLLOWUP_STOP");

  for (const { contact, mail } of due.slice(0, MAX_PER_RUN)) {
    const firstName = (contact.attributes && contact.attributes.FIRSTNAME) || "";
    try {
      await sendHtmlEmail({
        toEmail: contact.email,
        toName: firstName,
        subject: mail.subject,
        htmlContent: renderFollowup(mail, { firstName, unsubscribeUrl: unsubscribeUrl(contact.email) }),
        tag: `opfoelgning-${mail.step}`,
      });
      await setContactAttributes(contact.email, { FOLLOWUP_STEP: mail.step });
      summary.sendt += 1;
    } catch (e) {
      summary.fejl += 1;
      console.error(`Opfølgning ${mail.step} fejlede:`, e.message);
    }
  }
  return summary;
}

module.exports = { runFollowups, nextDue };

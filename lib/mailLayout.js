// Fælles udseende for alle mails fra testen (designsystemet, Notion → Designsystem).
// Personligt brev fra et menneske: hvid baggrund, Source Sans 3 med Arial som reserve, ink-tekst,
// én gul knap (navy tekst) når mailen har en handling, fast underskrift og en lille sidefod.

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const PORTRAIT_URL = "https://bejewelled-dragon-5e69df.netlify.app/assets/hagbarth-160.jpg";
const FONT = "'Source Sans 3','Segoe UI',Arial,sans-serif";

// Knap bygget som tabel, så den også vises korrekt i Outlook.
function button(label, url) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px"><tr>
<td bgcolor="#FFD23F" style="border-radius:8px">
<a href="${url}" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:16px;font-weight:700;line-height:20px;color:#1B2A41;text-decoration:none;border-radius:8px">${escapeHtml(label)}</a>
</td></tr></table>`;
}

function renderLetter({ firstName, paragraphs, cta, footerText, unsubscribeUrl }) {
  const p = (html) => `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:25px;color:#1B2A41">${html}</p>`;
  const parts = [p(`Hej ${escapeHtml(firstName) || "der"},`), ...paragraphs.map(p)];
  if (cta) parts.push(button(cta.label, cta.url));
  // Fast underskrift med portræt (samme ansigt som testen, PDF'en og Calendly).
  parts.push(`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 0"><tr>
<td style="padding:0 12px 0 0;vertical-align:middle"><img src="${PORTRAIT_URL}" width="48" height="48" alt="Hagbarth" style="display:block;width:48px;height:48px;border-radius:24px;border:0"></td>
<td style="vertical-align:middle"><p style="margin:0;font-family:${FONT};font-size:16px;line-height:22px;color:#1B2A41">Hagbarth</p>
<p style="margin:0;font-family:${FONT};font-size:13px;line-height:19px;color:#56627A">Hagbarth Skjold Andersen · Life System Architect</p></td>
</tr></table>`);
  const unsub = unsubscribeUrl ? ` <a style="color:#56627A" href="${unsubscribeUrl}">Afmeld flere mails</a>.` : "";
  const footer = `<p style="margin:32px 0 0;padding-top:16px;border-top:1px solid #D3CCBD;font-family:${FONT};font-size:12px;line-height:18px;color:#56627A">${footerText}${unsub}</p>`;
  return `<div style="max-width:560px;padding:8px 0">\n${parts.join("\n")}\n${footer}\n</div>`;
}

module.exports = { renderLetter, button, escapeHtml };

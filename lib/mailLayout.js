// Fælles udseende for alle mails fra testen (designsystemet, Notion → Designsystem).
// Personligt brev fra et menneske: hvid baggrund, Source Sans 3 med Arial som reserve, ink-tekst,
// én gul knap (navy tekst) når mailen har en handling, fast underskrift og en lille sidefod.

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

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
  parts.push(
    `<p style="margin:8px 0 0;font-family:${FONT};font-size:16px;line-height:25px;color:#1B2A41">Hagbarth</p>`,
    `<p style="margin:2px 0 0;font-family:${FONT};font-size:13px;line-height:19px;color:#56627A">Hagbarth Skjold Andersen · Life System Architect</p>`
  );
  const unsub = unsubscribeUrl ? ` <a style="color:#56627A" href="${unsubscribeUrl}">Afmeld flere mails</a>.` : "";
  const footer = `<p style="margin:32px 0 0;padding-top:16px;border-top:1px solid #D3CCBD;font-family:${FONT};font-size:12px;line-height:18px;color:#56627A">${footerText}${unsub}</p>`;
  return `<div style="max-width:560px;padding:8px 0">\n${parts.join("\n")}\n${footer}\n</div>`;
}

module.exports = { renderLetter, button, escapeHtml };

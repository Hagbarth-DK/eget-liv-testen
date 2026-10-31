# Testen "Hvor falder dit eget liv igennem?"

> Omdøbt 30/10-2026 efter Den røde tråd. Testen må ikke hedde Bundniveau i første kontakt.

Diagnostisk quiz til Lumant: 7 spørgsmål → arketype-scoring → gratis teaser →
e-mail-gate → personlig PDF-rapport via Brevo.

## Struktur

```
eget-liv-testen/
├── frontend/
│   ├── test-cors.html      ← §0: minimal CORS/embed-testblok (indsæt FØRST)
│   └── quiz.html            ← §1: fuld quiz (indsæt i Lumant, når CORS-test er OK)
├── netlify/functions/
│   ├── ping.js               GET  /.netlify/functions/ping
│   └── submit-quiz.js        POST /.netlify/functions/submit-quiz
├── lib/
│   ├── cors.js               fælles CORS-headers
│   ├── content.js            kategori-tekster (teaser + fuld tekst til PDF)
│   ├── pdf.js                PDF-generering med pdf-lib
│   └── brevo.js               Brevo transactional e-mail + contacts API
├── package.json
├── netlify.toml
└── .env.example
```

Frontend og backend er allerede testet lokalt (klik-igennem af hele quiz-flowet
og validering af scoring/tie-break — se samtalehistorik). Backend-funktionerne
er kun syntaks-/logik-gennemgået manuelt, da der ikke er Node.js installeret på
denne maskine — kør selv en hurtig `netlify dev`-test (trin 4 herunder), før du
går live.

## 1. Opsæt Brevo

1. Opret gratis konto på [brevo.com](https://www.brevo.com) (300 mails/dag gratis).
2. Verificér afsender-domænet (fx `hagbarthandersen.com`) under Settings → Senders & IP.
3. Opret en mailliste, fx "Testen — leads" → notér dens **List ID**.
4. Under SMTP & API → API Keys: opret en API-nøgle → notér den.
5. Gennemgå og accepter Brevos databehandleraftale (DPA) i kontoindstillingerne.

## 2. Deploy til Netlify

1. Opret gratis konto på [netlify.com](https://netlify.com).
2. Push dette projekt til et git-repo (GitHub/GitLab), eller brug `netlify deploy`
   direkte fra denne mappe via Netlify CLI.
3. I Netlify → Site settings → Environment variables, sæt:
   - `BREVO_API_KEY`
   - `BREVO_LIST_ID`
   - `BOOKING_URL` (link til din booking-side, valgfri — har fallback)

   Afsenderen er hagbarth@hagbarthandersen.com og står i `lib/brevo.js` (ikke i Netlify).
   Opfølgningsmails 2–5 sendes dagligt kl. ca. 8.17 af `netlify/functions/followups.js`.
4. Deploy. Notér din site-URL, fx `https://mit-site-123.netlify.app`.

## 3. Test forbindelsen (§0 — gør dette FØR resten)

1. Åbn [frontend/test-cors.html](frontend/test-cors.html) og erstat
   `[NETLIFY-FUNCTION-URL]` med din Netlify-site-URL.
2. Indsæt hele blokken i Lumants HTML-element (Indhold → Andet).
3. Klik "Test forbindelse". Bekræft at der står `Success: {"status":"ok"}`.
4. Fejler det (CORS/sandboxing): overvej i stedet at hoste hele frontend som et
   selvstændigt Netlify-site og linke til det fra Lumant, jf. spec §0.

## 4. Test backend lokalt (anbefalet før live-test)

```bash
npm install
npx netlify dev
```

Kør derefter fra terminalen:

```bash
curl http://localhost:8888/.netlify/functions/ping

curl -X POST http://localhost:8888/.netlify/functions/submit-quiz \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"din-egen@adresse.dk","category":"UDS","scores":{"TOP":1,"SPR":1,"UDS":5},"consent":true,"consentTimestamp":"2026-07-15T10:00:00Z"}'
```

Bekræft at du modtager PDF'en på mail, og at kontakten dukker op i Brevo-listen
med attributterne `CATEGORY`, `SCORE_TOP`, `SCORE_SPR`, `SCORE_UDS`.

## 5. Indsæt i Lumant

1. Åbn [frontend/quiz.html](frontend/quiz.html).
2. Erstat `https://[NETLIFY-FUNCTION-URL]/.netlify/functions/submit-quiz` med
   din faktiske funktions-URL.
3. Erstat `PRIVACY_POLICY_URL` med linket til privatlivspolitik-siden på Lumant.
4. Indsæt hele filens indhold i Lumants HTML-element.
5. Gennemgå testen selv fra start til slut på den live Lumant-side.

## 6. GDPR-tjekliste

- [ ] Obligatorisk (ikke forudkrydset) samtykke-checkbox — implementeret i `quiz.html`.
- [ ] Backend afviser submit uden `consent === true` — implementeret i `submit-quiz.js`.
- [ ] Synligt link til privatlivspolitik på siden — kræver at du sætter `PRIVACY_POLICY_URL`.
- [ ] DPA med Brevo gennemgået og accepteret.

## Noter om arkitektur-beslutninger

- **Scoring/tie-break**: ved uafgjort vindes i rækkefølgen `UDS > TOP > SPR`
  (arbitrær men deterministisk, jf. spec §1.2). Ligger i `TIE_BREAK_ORDER` i
  `quiz.html`.
- **Fejlhåndtering**: alle eksterne kald (PDF-generering, Brevo) er wrappet i
  try/catch i `submit-quiz.js`. Fejl logges server-side (`console.error`), og
  brugeren ser kun en generisk besked — ingen interne fejl eller API-nøgler
  eksponeres.
- **PDF**: genereres med `pdf-lib` (ingen binære afhængigheder, kører fint i
  Netlify Functions' Node-runtime).

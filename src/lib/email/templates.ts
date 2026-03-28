// ============================================================================
// Quotr — Email Templates
// Clean, responsive HTML templates for all transactional emails.
// ============================================================================

const QUOTR_URL = 'https://getquotr.nl';

// ---------------------------------------------------------------------------
// Shared layout helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function layout({
  companyLogo,
  body,
}: {
  companyLogo?: string | null;
  body: string;
}): string {
  const logoBlock = companyLogo
    ? `<tr><td align="center" style="padding:24px 0 16px">
         <img src="${companyLogo}" alt="Logo" width="120" style="max-width:120px;height:auto;border:0" />
       </td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quotr</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5">
    <tr>
      <td align="center" style="padding:24px 16px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;border-radius:12px 12px 0 0;padding:24px 32px;text-align:center">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px">Quotr</span>
            </td>
          </tr>
          <!-- Logo -->
          ${logoBlock}
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px;${companyLogo ? '' : 'border-radius:0;'}">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#ffffff;border-radius:0 0 12px 12px;padding:16px 32px 24px;border-top:1px solid #e4e4e7;text-align:center">
              <span style="color:#a1a1aa;font-size:12px">
                Powered by <a href="${QUOTR_URL}" style="color:#6366f1;text-decoration:none;font-weight:600">Quotr</a>
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto">
    <tr>
      <td align="center" style="background-color:#6366f1;border-radius:8px">
        <a href="${url}" target="_blank" style="display:inline-block;padding:12px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155">${text}</p>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;font-size:14px;color:#64748b;width:140px">${label}</td>
    <td style="padding:8px 0;font-size:14px;color:#0f172a;font-weight:600">${value}</td>
  </tr>`;
}

function detailsTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;background-color:#f8fafc;border-radius:8px;padding:16px">
    <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>
  </table>`;
}

function messageBox(message: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px">
    <tr>
      <td style="background-color:#f8fafc;border-left:4px solid #6366f1;border-radius:0 8px 8px 0;padding:16px 20px">
        <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;font-style:italic">${message}</p>
      </td>
    </tr>
  </table>`;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export function quotesSentEmail({
  companyName,
  companyLogo,
  quoteName,
  clientName,
  quoteTotal,
  viewUrl,
}: {
  companyName: string;
  companyLogo?: string | null;
  quoteName: string;
  clientName: string;
  quoteTotal: number;
  viewUrl: string;
}): string {
  const body = `
    ${heading(`Offerte van ${companyName}`)}
    ${paragraph(`Beste ${clientName},`)}
    ${paragraph(`${companyName} heeft een offerte voor je opgesteld. Hieronder vind je een samenvatting.`)}
    ${detailsTable(
      detailRow('Offerte', quoteName) +
      detailRow('Bedrag', formatCurrency(quoteTotal))
    )}
    ${paragraph('Klik op de knop hieronder om de volledige offerte te bekijken en te reageren.')}
    ${button('Bekijk offerte', viewUrl)}
    ${paragraph('Met vriendelijke groet,')}
    ${paragraph(`<strong>${companyName}</strong>`)}
  `;
  return layout({ companyLogo, body });
}

export function quoteAcceptedEmail({
  companyName,
  quoteName,
  clientName,
  quoteTotal,
}: {
  companyName: string;
  quoteName: string;
  clientName: string;
  quoteTotal: number;
}): string {
  const body = `
    ${heading('Offerte geaccepteerd! \uD83C\uDF89')}
    ${paragraph(`Goed nieuws! <strong>${clientName}</strong> heeft de offerte <strong>${quoteName}</strong> geaccepteerd.`)}
    ${detailsTable(
      detailRow('Klant', clientName) +
      detailRow('Offerte', quoteName) +
      detailRow('Bedrag', formatCurrency(quoteTotal))
    )}
    ${paragraph('Je kunt nu een factuur aanmaken vanuit deze offerte in je Quotr-dashboard.')}
    ${button('Ga naar dashboard', QUOTR_URL)}
  `;
  return layout({ body });
}

export function quoteChangesRequestedEmail({
  companyName,
  quoteName,
  clientName,
  message,
}: {
  companyName: string;
  quoteName: string;
  clientName: string;
  message: string;
}): string {
  const body = `
    ${heading(`Wijzigingsverzoek voor ${quoteName}`)}
    ${paragraph(`<strong>${clientName}</strong> heeft een wijzigingsverzoek ingediend voor offerte <strong>${quoteName}</strong>.`)}
    ${paragraph('<strong>Bericht van de klant:</strong>')}
    ${messageBox(message)}
    ${paragraph('Open de offerte in je dashboard om de wijzigingen door te voeren.')}
    ${button('Ga naar dashboard', QUOTR_URL)}
  `;
  return layout({ body });
}

export function followUpReminderEmail({
  companyName,
  quoteName,
  clientName,
  talkingPoint,
  quoteUrl,
}: {
  companyName: string;
  quoteName: string;
  clientName: string;
  talkingPoint: string;
  quoteUrl: string;
}): string {
  const body = `
    ${heading(`Follow-up herinnering`)}
    ${paragraph(`Het is tijd om contact op te nemen met <strong>${clientName}</strong> over offerte <strong>${quoteName}</strong>.`)}
    ${paragraph('<strong>Suggestie voor je gesprek:</strong>')}
    ${messageBox(talkingPoint)}
    ${paragraph('Open de offerte om de status te bekijken en actie te ondernemen.')}
    ${button('Bekijk offerte', quoteUrl)}
  `;
  return layout({ body });
}

export function invoiceSentEmail({
  companyName,
  companyLogo,
  invoiceNumber,
  clientName,
  total,
  viewUrl,
}: {
  companyName: string;
  companyLogo?: string | null;
  invoiceNumber: string;
  clientName: string;
  total: number;
  viewUrl: string;
}): string {
  const body = `
    ${heading(`Factuur ${invoiceNumber}`)}
    ${paragraph(`Beste ${clientName},`)}
    ${paragraph(`Hierbij ontvang je factuur <strong>${invoiceNumber}</strong> van <strong>${companyName}</strong>.`)}
    ${detailsTable(
      detailRow('Factuurnummer', invoiceNumber) +
      detailRow('Bedrag', formatCurrency(total))
    )}
    ${paragraph('Klik op de knop hieronder om de factuur te bekijken.')}
    ${button('Bekijk factuur', viewUrl)}
    ${paragraph('Met vriendelijke groet,')}
    ${paragraph(`<strong>${companyName}</strong>`)}
  `;
  return layout({ companyLogo, body });
}

export function invoiceOverdueEmail({
  companyName,
  invoiceNumber,
  clientName,
  total,
  dueDate,
  viewUrl,
}: {
  companyName: string;
  invoiceNumber: string;
  clientName: string;
  total: number;
  dueDate: string;
  viewUrl: string;
}): string {
  const body = `
    ${heading(`Herinnering: Factuur ${invoiceNumber}`)}
    ${paragraph(`Beste ${clientName},`)}
    ${paragraph(`Dit is een vriendelijke herinnering dat factuur <strong>${invoiceNumber}</strong> van <strong>${companyName}</strong> de vervaldatum van <strong>${dueDate}</strong> is gepasseerd.`)}
    ${detailsTable(
      detailRow('Factuurnummer', invoiceNumber) +
      detailRow('Bedrag', formatCurrency(total)) +
      detailRow('Vervaldatum', dueDate)
    )}
    ${paragraph('Klik op de knop hieronder om de factuur te bekijken en te betalen.')}
    ${button('Bekijk factuur', viewUrl)}
    ${paragraph('Heb je al betaald? Dan kun je deze herinnering negeren.')}
    ${paragraph('Met vriendelijke groet,')}
    ${paragraph(`<strong>${companyName}</strong>`)}
  `;
  return layout({ body });
}

export function appointmentConfirmationClientEmail({
  companyName,
  title,
  dateTime,
  location,
  meetingUrl,
}: {
  companyName: string;
  title: string;
  dateTime: string;
  location?: string | null;
  meetingUrl?: string | null;
}): string {
  const locationRow = location ? detailRow('Locatie', location) : '';
  const meetingRow = meetingUrl
    ? detailRow('Online meeting', `<a href="${meetingUrl}" style="color:#6366f1;text-decoration:none">${meetingUrl}</a>`)
    : '';

  const body = `
    ${heading(`Bevestiging: ${title}`)}
    ${paragraph(`Je afspraak met <strong>${companyName}</strong> is bevestigd.`)}
    ${detailsTable(
      detailRow('Afspraak', title) +
      detailRow('Datum & Tijd', dateTime) +
      locationRow +
      meetingRow
    )}
    ${paragraph('We kijken ernaar uit!')}
    ${paragraph('Met vriendelijke groet,')}
    ${paragraph(`<strong>${companyName}</strong>`)}
  `;
  return layout({ body });
}

export function appointmentConfirmationFreelancerEmail({
  clientName,
  clientEmail,
  title,
  dateTime,
  location,
  note,
}: {
  clientName: string;
  clientEmail: string;
  title: string;
  dateTime: string;
  location?: string | null;
  note?: string | null;
}): string {
  const locationRow = location ? detailRow('Locatie', location) : '';
  const noteBlock = note
    ? `${paragraph('<strong>Opmerking van de klant:</strong>')}${messageBox(note)}`
    : '';

  const body = `
    ${heading(`Nieuwe afspraak: ${title}`)}
    ${paragraph('Er is een nieuwe afspraak ingepland.')}
    ${detailsTable(
      detailRow('Klant', clientName) +
      detailRow('E-mail', clientEmail) +
      detailRow('Datum & Tijd', dateTime) +
      locationRow
    )}
    ${noteBlock}
    ${button('Ga naar dashboard', QUOTR_URL)}
  `;
  return layout({ body });
}

export function welcomeEmail({
  userName,
  companyName,
}: {
  userName: string;
  companyName: string;
}): string {
  const body = `
    ${heading('Welkom bij Quotr!')}
    ${paragraph(`Hallo ${userName},`)}
    ${paragraph(`Geweldig dat je <strong>${companyName}</strong> hebt aangemeld bij Quotr. Je bent klaar om professionele offertes te versturen en je bedrijf te laten groeien.`)}
    ${paragraph('<strong>Aan de slag in 3 stappen:</strong>')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px">
      <tr>
        <td style="padding:12px 16px;background-color:#f8fafc;border-radius:8px;margin-bottom:8px">
          <span style="display:inline-block;width:28px;height:28px;background-color:#6366f1;color:#ffffff;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px">1</span>
          <span style="font-size:15px;color:#0f172a;font-weight:600">Voeg je diensten toe</span>
          <br /><span style="font-size:13px;color:#64748b;margin-left:40px;display:inline-block">Stel je producten en services in met prijzen.</span>
        </td>
      </tr>
      <tr><td style="height:8px"></td></tr>
      <tr>
        <td style="padding:12px 16px;background-color:#f8fafc;border-radius:8px">
          <span style="display:inline-block;width:28px;height:28px;background-color:#6366f1;color:#ffffff;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px">2</span>
          <span style="font-size:15px;color:#0f172a;font-weight:600">Maak je eerste offerte</span>
          <br /><span style="font-size:13px;color:#64748b;margin-left:40px;display:inline-block">Stel een offerte op en verstuur deze naar je klant.</span>
        </td>
      </tr>
      <tr><td style="height:8px"></td></tr>
      <tr>
        <td style="padding:12px 16px;background-color:#f8fafc;border-radius:8px">
          <span style="display:inline-block;width:28px;height:28px;background-color:#6366f1;color:#ffffff;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px">3</span>
          <span style="font-size:15px;color:#0f172a;font-weight:600">Ontdek de mogelijkheden</span>
          <br /><span style="font-size:13px;color:#64748b;margin-left:40px;display:inline-block">Facturen, afspraken, AI-suggesties en meer.</span>
        </td>
      </tr>
    </table>
    ${button('Ga naar je dashboard', QUOTR_URL)}
    ${paragraph('Veel succes!')}
    ${paragraph('<strong>Het Quotr-team</strong>')}
  `;
  return layout({ body });
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resend } from '@/lib/resend';
import { formatCurrency } from '@/lib/utils';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    const supabase = await createClient();

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', authUser.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: 'Geen bedrijf gevonden.' },
        { status: 404 }
      );
    }

    // Fetch quote with client info
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*, client:clients!client_id(id, name, email)')
      .eq('id', quoteId)
      .eq('company_id', profile.company_id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Offerte niet gevonden.' },
        { status: 404 }
      );
    }

    // Fetch company info for the email
    const { data: company } = await supabase
      .from('companies')
      .select('name, email')
      .eq('id', profile.company_id)
      .single();

    const companyName = company?.name ?? 'Quotr';
    const companyEmail = company?.email ?? 'noreply@quotr.nl';

    // Resolve the client object (Supabase join)
    const client = quote.client as unknown as { id: string; name: string; email: string } | null;

    if (!client?.email) {
      return NextResponse.json(
        { error: 'Klant heeft geen e-mailadres.' },
        { status: 400 }
      );
    }

    // Build the public quote URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://quotr.nl';
    const quoteUrl = `${baseUrl}/q/${quote.public_token}`;

    // Build a simple HTML email
    const emailHtml = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f5f5f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">
          <!-- Header -->
          <tr>
            <td style="background-color:#111112;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">${companyName}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
                Beste ${client.name},
              </p>
              <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
                Hierbij ontvangt u een offerte van ${companyName}.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">
                <tr>
                  <td style="padding:16px;background-color:#fafafa;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#71717a;font-size:13px;padding-bottom:8px;">Offertenummer</td>
                        <td align="right" style="color:#18181b;font-size:13px;font-weight:600;padding-bottom:8px;">${quote.quote_number}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a;font-size:13px;padding-bottom:8px;">Titel</td>
                        <td align="right" style="color:#18181b;font-size:13px;font-weight:600;padding-bottom:8px;">${quote.title}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a;font-size:13px;">Totaalbedrag</td>
                        <td align="right" style="color:#18181b;font-size:18px;font-weight:700;">${formatCurrency(quote.total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${quoteUrl}" style="display:inline-block;background-color:#111112;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:6px;">
                      Offerte bekijken
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#a1a1aa;font-size:13px;line-height:1.5;">
                ${quote.valid_until ? `Deze offerte is geldig tot ${new Date(quote.valid_until).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}.` : ''}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e4e4e7;background-color:#fafafa;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;">
                Verstuurd via Quotr &mdash; ${companyName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: `${companyName} <${companyEmail}>`,
      to: [client.email],
      subject: `Offerte ${quote.quote_number} — ${quote.title}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Resend email error:', emailError);
      // Still mark as sent even if email fails — we log the error
    }

    // Update quote status
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'sent',
        sent_at: now,
      })
      .eq('id', quoteId);

    if (updateError) {
      console.error('Error updating quote status:', updateError);
    }

    // Create event
    await supabase.from('quote_events').insert({
      quote_id: quoteId,
      user_id: authUser.id,
      event_type: 'sent',
      description: `Offerte verstuurd naar ${client.email}`,
      metadata: {
        recipient_email: client.email,
        sent_at: now,
        email_error: emailError ? String(emailError) : null,
      },
    });

    return NextResponse.json({
      success: true,
      sent_to: client.email,
      email_error: emailError ? 'E-mail versturen mislukt, maar offerte is gemarkeerd als verzonden.' : null,
    });
  } catch (err) {
    console.error('Quote send error:', err);
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden bij het versturen.' },
      { status: 500 }
    );
  }
}

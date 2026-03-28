import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { resend } from '@/lib/resend';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const supabase = createServiceClient();

    const body = await request.json();
    const { name, email, note, start, end } = body;

    if (!name || !email || !start || !end) {
      return NextResponse.json(
        { error: 'Naam, e-mail, starttijd en eindtijd zijn verplicht.' },
        { status: 400 },
      );
    }

    // Find company by slug
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, email, slug')
      .eq('slug', slug)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Bedrijf niet gevonden.' }, { status: 404 });
    }

    // Find the first user of this company (owner) to assign the appointment
    const { data: companyUser } = await supabase
      .from('users')
      .select('id')
      .eq('company_id', company.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (!companyUser) {
      return NextResponse.json(
        { error: 'Geen gebruiker gevonden voor dit bedrijf.' },
        { status: 404 },
      );
    }

    // Check the slot is still available
    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id')
      .eq('company_id', company.id)
      .lt('start_time', end)
      .gt('end_time', start);

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Dit tijdslot is helaas al bezet. Kies een ander tijdstip.' },
        { status: 409 },
      );
    }

    // Create appointment
    const startDate = new Date(start);
    const formattedDate = startDate.toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = startDate.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const endDate = new Date(end);
    const formattedEndTime = endDate.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        company_id: company.id,
        user_id: companyUser.id,
        title: `Afspraak met ${name}`,
        description: note || null,
        start_time: start,
        end_time: end,
        status: 'booked',
        client_name: name,
        client_email: email,
        public_token: crypto.randomUUID(),
        metadata: {
          type: 'meeting',
          is_booked_externally: true,
        },
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Send confirmation emails
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quotr.nl';

    try {
      // Email to customer
      await resend.emails.send({
        from: 'Quotr <noreply@quotr.nl>',
        to: email,
        subject: `Bevestiging: je afspraak bij ${company.name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #18181b; padding: 24px;">
            <div style="max-width: 480px; margin: 0 auto;">
              <h2 style="font-size: 20px; margin-bottom: 16px;">Je afspraak is bevestigd</h2>
              <p style="color: #71717a; margin-bottom: 24px;">Hallo ${name},</p>
              <div style="background: #f5f5f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0;"><strong>Bedrijf:</strong> ${company.name}</p>
                <p style="margin: 0 0 8px 0;"><strong>Datum:</strong> ${formattedDate}</p>
                <p style="margin: 0;"><strong>Tijd:</strong> ${formattedTime} - ${formattedEndTime}</p>
              </div>
              <p style="color: #71717a; font-size: 14px;">
                Wil je de afspraak wijzigen of annuleren? Neem dan contact op met ${company.name} via ${company.email}.
              </p>
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
              <p style="color: #a1a1aa; font-size: 12px;">Verstuurd via <a href="${baseUrl}?utm_source=booking_email&utm_medium=email" style="color: #2563eb;">Quotr</a></p>
            </div>
          </body>
          </html>
        `,
      });

      // Email to company
      await resend.emails.send({
        from: 'Quotr <noreply@quotr.nl>',
        to: company.email,
        subject: `Nieuwe boeking: ${name} op ${formattedDate}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #18181b; padding: 24px;">
            <div style="max-width: 480px; margin: 0 auto;">
              <h2 style="font-size: 20px; margin-bottom: 16px;">Nieuwe boeking ontvangen</h2>
              <div style="background: #f5f5f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0;"><strong>Klant:</strong> ${name}</p>
                <p style="margin: 0 0 8px 0;"><strong>E-mail:</strong> ${email}</p>
                <p style="margin: 0 0 8px 0;"><strong>Datum:</strong> ${formattedDate}</p>
                <p style="margin: 0 0 8px 0;"><strong>Tijd:</strong> ${formattedTime} - ${formattedEndTime}</p>
                ${note ? `<p style="margin: 0;"><strong>Notitie:</strong> ${note}</p>` : ''}
              </div>
              <a href="${baseUrl}/app/agenda" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px;">Bekijk in agenda</a>
            </div>
          </body>
          </html>
        `,
      });
    } catch (emailError) {
      // Log but don't fail the booking
      console.error('Failed to send booking confirmation emails:', emailError);
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    );
  }
}

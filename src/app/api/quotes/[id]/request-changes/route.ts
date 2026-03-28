import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { resend } from '@/lib/resend';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Ongeldig verzoek' },
      { status: 400 }
    );
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json(
      { error: 'Bericht is verplicht' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Verify quote exists
  const { data: quote, error: fetchError } = await supabase
    .from('quotes')
    .select('id, quote_number, company_id, client_id')
    .eq('id', id)
    .single();

  if (fetchError || !quote) {
    return NextResponse.json(
      { error: 'Offerte niet gevonden' },
      { status: 404 }
    );
  }

  // Log event
  const { error: eventError } = await supabase.from('quote_events').insert({
    quote_id: id,
    event_type: 'change_requested',
    description: 'Klant heeft wijzigingen aangevraagd',
    metadata: { actor: 'client', message },
  });

  if (eventError) {
    return NextResponse.json(
      { error: 'Fout bij het opslaan van het verzoek' },
      { status: 500 }
    );
  }

  // Send email notification to the freelancer (best-effort)
  try {
    // Fetch company + client info for the email
    const [companyResult, clientResult] = await Promise.all([
      supabase.from('companies').select('name, email').eq('id', quote.company_id).single(),
      supabase.from('clients').select('name, email').eq('id', quote.client_id).single(),
    ]);

    const company = companyResult.data;
    const client = clientResult.data;

    if (company?.email) {
      await resend.emails.send({
        from: 'Quotr <noreply@getquotr.nl>',
        to: company.email,
        subject: `Wijzigingsverzoek voor offerte ${quote.quote_number}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 0;">
            <h2 style="font-size: 18px; font-weight: 600; color: #18181b; margin: 0 0 16px;">
              Wijzigingsverzoek ontvangen
            </h2>
            <p style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 8px;">
              ${client?.name ?? 'Een klant'} heeft wijzigingen aangevraagd voor offerte
              <strong>${quote.quote_number}</strong>:
            </p>
            <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 14px; color: #3f3f46; line-height: 1.6; white-space: pre-wrap;">
              ${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
            </div>
            <p style="font-size: 13px; color: #a1a1aa; margin: 24px 0 0;">
              — Quotr
            </p>
          </div>
        `,
      });
    }
  } catch {
    // Email is best-effort; don't fail the request if it doesn't send
  }

  return NextResponse.json({ success: true });
}

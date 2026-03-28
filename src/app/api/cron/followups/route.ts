import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { followUpReminderEmail } from '@/lib/email/templates';

// Vercel cron — runs daily
// vercel.json: { "crons": [{ "path": "/api/cron/followups", "schedule": "0 8 * * *" }] }

export async function GET(request: Request) {
  // Optional: verify cron secret
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    // Find quotes that have a follow-up date of today and are still pending response
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id, title, total, client_id, user_id, company_id, metadata')
      .in('status', ['sent', 'viewed'])
      .not('metadata', 'is', null);

    if (quotesError) {
      console.error('[cron/followups] Error fetching quotes:', quotesError);
      return NextResponse.json({ error: quotesError.message }, { status: 500 });
    }

    // Filter to quotes where metadata.follow_up_date matches today
    const dueQuotes = (quotes ?? []).filter((q) => {
      const meta = q.metadata as Record<string, unknown>;
      return meta?.follow_up_date === today;
    });

    let processed = 0;

    for (const quote of dueQuotes) {
      // Fetch freelancer (user) details
      const { data: user } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', quote.user_id)
        .single();

      if (!user?.email) continue;

      // Fetch client details
      const { data: client } = await supabase
        .from('clients')
        .select('name')
        .eq('id', quote.client_id)
        .single();

      if (!client) continue;

      // Fetch company details
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', quote.company_id)
        .single();

      const companyName = company?.name ?? 'Je bedrijf';
      const quoteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://getquotr.nl'}/quotes/${quote.id}`;

      // Generate an AI-style talking point based on the quote context
      const talkingPoint = generateTalkingPoint(client.name, quote.title);

      const html = followUpReminderEmail({
        companyName,
        quoteName: quote.title,
        clientName: client.name,
        talkingPoint,
        quoteUrl,
      });

      await sendEmail({
        to: user.email,
        subject: `Follow-up herinnering: ${quote.title}`,
        html,
      });

      // Create a quote event to track the follow-up
      await supabase.from('quote_events').insert({
        quote_id: quote.id,
        user_id: null,
        event_type: 'followed_up',
        description: 'Automatische follow-up herinnering verstuurd',
        metadata: { actor: 'system', sent_to: user.email },
      });

      processed++;
    }

    return NextResponse.json({ processed });
  } catch (error) {
    console.error('[cron/followups] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * Generate a contextual talking point for the follow-up.
 * In a full implementation this could call an LLM; for now we use
 * smart template-based suggestions.
 */
function generateTalkingPoint(clientName: string, quoteTitle: string): string {
  const suggestions = [
    `Vraag ${clientName} of ze nog vragen hebben over de offerte "${quoteTitle}" en of je iets kunt verduidelijken.`,
    `Check in met ${clientName} — misschien is het handig om een kort telefoongesprek in te plannen om de offerte te bespreken.`,
    `Informeer bij ${clientName} of de tijdlijn en scope van "${quoteTitle}" nog aansluiten bij hun verwachtingen.`,
    `Laat ${clientName} weten dat je openstaat voor aanpassingen aan "${quoteTitle}" als dat nodig is.`,
    `Stuur ${clientName} een kort bericht om te laten weten dat je beschikbaar bent voor vragen over "${quoteTitle}".`,
  ];

  // Deterministic pick based on the date so it feels varied but is reproducible
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  return suggestions[dayOfYear % suggestions.length];
}

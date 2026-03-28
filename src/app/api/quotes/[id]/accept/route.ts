import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  // Verify quote exists and is in an acceptable state
  const { data: quote, error: fetchError } = await supabase
    .from('quotes')
    .select('id, status, valid_until')
    .eq('id', id)
    .single();

  if (fetchError || !quote) {
    return NextResponse.json(
      { error: 'Offerte niet gevonden' },
      { status: 404 }
    );
  }

  // Only allow accepting quotes that are sent or viewed
  if (quote.status !== 'sent' && quote.status !== 'viewed') {
    return NextResponse.json(
      { error: 'Deze offerte kan niet meer geaccepteerd worden' },
      { status: 400 }
    );
  }

  // Check expiration
  if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
    return NextResponse.json(
      { error: 'Deze offerte is verlopen' },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  // Update quote status
  const { error: updateError } = await supabase
    .from('quotes')
    .update({ status: 'accepted', accepted_at: now })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json(
      { error: 'Fout bij het accepteren van de offerte' },
      { status: 500 }
    );
  }

  // Log event
  await supabase.from('quote_events').insert({
    quote_id: id,
    event_type: 'accepted',
    description: 'Offerte geaccepteerd door klant',
    metadata: { actor: 'client' },
  });

  return NextResponse.json({ success: true });
}

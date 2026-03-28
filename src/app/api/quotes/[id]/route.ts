import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Shared auth + ownership check
// ---------------------------------------------------------------------------

async function getQuoteWithAuth(quoteId: string) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { error: NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', authUser.id)
    .single();

  if (!profile?.company_id) {
    return { error: NextResponse.json({ error: 'Geen bedrijf gevonden.' }, { status: 404 }) };
  }

  return { supabase, authUser, companyId: profile.company_id, quoteId };
}

// ---------------------------------------------------------------------------
// GET — fetch a single quote with lines and events
// ---------------------------------------------------------------------------

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getQuoteWithAuth(id);
    if ('error' in result) return result.error;
    const { supabase, companyId, quoteId } = result;

    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*, client:clients!client_id(id, name, email, phone, address_line1, postal_code, city)')
      .eq('id', quoteId)
      .eq('company_id', companyId)
      .single();

    if (error || !quote) {
      return NextResponse.json(
        { error: 'Offerte niet gevonden.' },
        { status: 404 }
      );
    }

    // Fetch lines and events in parallel
    const [linesResult, eventsResult] = await Promise.all([
      supabase
        .from('quote_lines')
        .select('*')
        .eq('quote_id', quoteId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('quote_events')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: false }),
    ]);

    return NextResponse.json({
      quote,
      lines: linesResult.data ?? [],
      events: eventsResult.data ?? [],
    });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT — update a quote and its lines
// ---------------------------------------------------------------------------

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getQuoteWithAuth(id);
    if ('error' in result) return result.error;
    const { supabase, companyId, authUser, quoteId } = result;

    // Verify ownership
    const { data: existing } = await supabase
      .from('quotes')
      .select('id')
      .eq('id', quoteId)
      .eq('company_id', companyId)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Offerte niet gevonden.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      notes,
      valid_until,
      discount_type,
      discount_value,
      lines,
      metadata: extraMetadata,
    } = body;

    // Recalculate totals if lines provided
    const updates: Record<string, unknown> = {};

    if (title !== undefined) updates.title = title;
    if (notes !== undefined) updates.conclusion = notes;
    if (valid_until !== undefined) updates.valid_until = valid_until || null;
    if (discount_type !== undefined) updates.discount_type = discount_type;
    if (discount_value !== undefined) updates.discount_value = discount_value;
    if (extraMetadata !== undefined) updates.metadata = extraMetadata;

    if (Array.isArray(lines) && lines.length > 0) {
      const subtotal = lines.reduce(
        (sum: number, l: { quantity: number; unit_price: number }) =>
          sum + l.quantity * l.unit_price,
        0
      );

      let discountAmount = 0;
      const dv = discount_value ?? body.discount_value ?? 0;
      const dt = discount_type ?? body.discount_type ?? 'fixed';
      if (dv > 0) {
        discountAmount = dt === 'percentage' ? subtotal * (dv / 100) : dv;
      }

      const taxAmount = lines.reduce(
        (
          sum: number,
          l: { quantity: number; unit_price: number; tax_rate: number }
        ) => {
          const lineBase = l.quantity * l.unit_price;
          const proportion = subtotal > 0 ? lineBase / subtotal : 0;
          const adjustedBase = lineBase - discountAmount * proportion;
          return sum + adjustedBase * (l.tax_rate / 100);
        },
        0
      );

      updates.subtotal = Math.round(subtotal * 100) / 100;
      updates.tax_amount = Math.round(taxAmount * 100) / 100;
      updates.total = Math.round((subtotal - discountAmount + taxAmount) * 100) / 100;

      // Replace lines: delete old, insert new
      await supabase.from('quote_lines').delete().eq('quote_id', quoteId);

      const lineInserts = lines.map(
        (
          l: {
            service_id?: string | null;
            description: string;
            quantity: number;
            unit_price: number;
            tax_rate: number;
            sort_order?: number;
          },
          i: number
        ) => ({
          quote_id: quoteId,
          service_id: l.service_id || null,
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          tax_rate: l.tax_rate,
          subtotal: Math.round(l.quantity * l.unit_price * 100) / 100,
          sort_order: l.sort_order ?? i,
        })
      );

      const { error: linesError } = await supabase
        .from('quote_lines')
        .insert(lineInserts);

      if (linesError) {
        console.error('Error updating quote lines:', linesError);
      }
    }

    const { data: quote, error: updateError } = await supabase
      .from('quotes')
      .update(updates)
      .eq('id', quoteId)
      .select('*')
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Offerte bijwerken mislukt: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Log event
    await supabase.from('quote_events').insert({
      quote_id: quoteId,
      user_id: authUser.id,
      event_type: 'updated',
      description: 'Offerte bijgewerkt',
      metadata: {},
    });

    return NextResponse.json({ quote });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE — delete a quote
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getQuoteWithAuth(id);
    if ('error' in result) return result.error;
    const { supabase, companyId, quoteId } = result;

    // Verify ownership
    const { data: existing } = await supabase
      .from('quotes')
      .select('id')
      .eq('id', quoteId)
      .eq('company_id', companyId)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Offerte niet gevonden.' },
        { status: 404 }
      );
    }

    // Delete events and lines first (cascade may handle this, but be explicit)
    await Promise.all([
      supabase.from('quote_events').delete().eq('quote_id', quoteId),
      supabase.from('quote_lines').delete().eq('quote_id', quoteId),
    ]);

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId);

    if (error) {
      return NextResponse.json(
        { error: `Verwijderen mislukt: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 }
    );
  }
}

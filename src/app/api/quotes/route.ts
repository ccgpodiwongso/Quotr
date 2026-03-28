import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateQuoteNumber } from '@/lib/utils';

// ---------------------------------------------------------------------------
// GET — list quotes for the user's company
// ---------------------------------------------------------------------------

export async function GET() {
  try {
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

    const { data: quotes, error } = await supabase
      .from('quotes')
      .select('*, client:clients!client_id(id, name, email)')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ quotes });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — create a new quote with lines
// ---------------------------------------------------------------------------

interface LinePayload {
  service_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  sort_order: number;
}

export async function POST(request: Request) {
  try {
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

    const body = await request.json();
    const {
      client_id,
      client_name,
      client_email,
      title,
      notes,
      valid_until,
      payment_terms,
      deposit_note,
      follow_up_date,
      discount_type,
      discount_value,
      lines,
    } = body;

    // Validate lines
    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        { error: 'Minimaal een offerteregel is vereist.' },
        { status: 400 }
      );
    }

    // Resolve or create client
    let resolvedClientId = client_id;

    if (!resolvedClientId && client_name && client_email) {
      // Check if client already exists by email
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', profile.company_id)
        .eq('email', client_email)
        .single();

      if (existingClient) {
        resolvedClientId = existingClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            company_id: profile.company_id,
            name: client_name,
            email: client_email,
            country: 'NL',
            is_active: true,
          })
          .select('id')
          .single();

        if (clientError) {
          return NextResponse.json(
            { error: `Klant aanmaken mislukt: ${clientError.message}` },
            { status: 500 }
          );
        }
        resolvedClientId = newClient.id;
      }
    }

    if (!resolvedClientId) {
      return NextResponse.json(
        { error: 'Selecteer of voer een klant in.' },
        { status: 400 }
      );
    }

    // Get and increment quote number
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('next_quote_number')
      .eq('id', profile.company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Bedrijf niet gevonden.' },
        { status: 500 }
      );
    }

    const quoteNumber = generateQuoteNumber(company.next_quote_number);

    // Calculate totals from lines
    const typedLines = lines as LinePayload[];
    const subtotal = typedLines.reduce(
      (sum, l) => sum + l.quantity * l.unit_price,
      0
    );

    let discountAmount = 0;
    if (discount_value && discount_value > 0) {
      discountAmount =
        discount_type === 'percentage'
          ? subtotal * (discount_value / 100)
          : discount_value;
    }

    const taxAmount = typedLines.reduce((sum, l) => {
      const lineBase = l.quantity * l.unit_price;
      const proportion = subtotal > 0 ? lineBase / subtotal : 0;
      const adjustedBase = lineBase - discountAmount * proportion;
      return sum + adjustedBase * (l.tax_rate / 100);
    }, 0);

    const total = subtotal - discountAmount + taxAmount;

    // Generate public token
    const publicToken = crypto.randomUUID();

    // Build metadata
    const metadata: Record<string, unknown> = {};
    if (payment_terms) metadata.payment_terms = payment_terms;
    if (deposit_note) metadata.deposit_note = deposit_note;
    if (follow_up_date) metadata.follow_up_date = follow_up_date;

    // Create quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        company_id: profile.company_id,
        client_id: resolvedClientId,
        user_id: authUser.id,
        quote_number: quoteNumber,
        status: 'draft',
        title: title || 'Offerte',
        introduction: null,
        conclusion: notes || null,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_amount: Math.round(taxAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
        discount_type: discount_type || null,
        discount_value: discount_value || null,
        valid_until: valid_until || null,
        public_token: publicToken,
        metadata,
      })
      .select('*')
      .single();

    if (quoteError) {
      return NextResponse.json(
        { error: `Offerte aanmaken mislukt: ${quoteError.message}` },
        { status: 500 }
      );
    }

    // Create quote lines
    const lineInserts = typedLines.map((l, i) => ({
      quote_id: quote.id,
      service_id: l.service_id || null,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unit_price,
      tax_rate: l.tax_rate,
      subtotal: Math.round(l.quantity * l.unit_price * 100) / 100,
      sort_order: l.sort_order ?? i,
    }));

    const { error: linesError } = await supabase
      .from('quote_lines')
      .insert(lineInserts);

    if (linesError) {
      console.error('Error creating quote lines:', linesError);
    }

    // Create quote event
    await supabase.from('quote_events').insert({
      quote_id: quote.id,
      user_id: authUser.id,
      event_type: 'created',
      description: 'Offerte aangemaakt',
      metadata: {},
    });

    // Increment company quote number
    await supabase
      .from('companies')
      .update({ next_quote_number: company.next_quote_number + 1 })
      .eq('id', profile.company_id);

    return NextResponse.json({ quote }, { status: 201 });
  } catch (err) {
    console.error('Quote creation error:', err);
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 }
    );
  }
}

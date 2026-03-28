import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

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
      return NextResponse.json({ error: 'Geen bedrijf gevonden.' }, { status: 404 });
    }

    const { pin } = await request.json();

    if (!pin || !/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN moet 6 cijfers zijn.' },
        { status: 400 },
      );
    }

    const hashedPin = await bcrypt.hash(pin, 12);

    // Store hashed PIN in company settings
    const { data: company } = await supabase
      .from('companies')
      .select('settings')
      .eq('id', profile.company_id)
      .single();

    const currentSettings = (company?.settings || {}) as Record<string, unknown>;

    const { error } = await supabase
      .from('companies')
      .update({
        settings: { ...currentSettings, tax_pin_hash: hashedPin },
      })
      .eq('id', profile.company_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
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
      return NextResponse.json({ error: 'Geen bedrijf gevonden.' }, { status: 404 });
    }

    // Verify PIN from header
    const pin = request.headers.get('X-Tax-Pin');
    if (!pin) {
      return NextResponse.json({ error: 'PIN is vereist.' }, { status: 401 });
    }

    const { data: company } = await supabase
      .from('companies')
      .select('settings')
      .eq('id', profile.company_id)
      .single();

    const settings = (company?.settings || {}) as Record<string, unknown>;
    const storedHash = settings.tax_pin_hash as string | undefined;

    if (!storedHash) {
      return NextResponse.json(
        { error: 'Stel eerst een PIN in.' },
        { status: 400 },
      );
    }

    const pinValid = await bcrypt.compare(pin, storedHash);
    if (!pinValid) {
      return NextResponse.json({ error: 'Ongeldige PIN.' }, { status: 403 });
    }

    // Get year from query params
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Fetch invoices for the year
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('invoice_number, created_at, subtotal, tax_amount, total, client_id')
      .eq('company_id', profile.company_id)
      .gte('created_at', startDate)
      .lte('created_at', `${endDate}T23:59:59`)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch client names
    const clientIds = Array.from(new Set((invoices || []).map((inv: any) => inv.client_id)));
    const clientMap: Record<string, string> = {};

    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', clientIds);

      (clients || []).forEach((c) => {
        clientMap[c.id] = c.name;
      });
    }

    // Generate CSV
    const header = 'Factuurnummer;Datum;Klant;Subtotaal;BTW;Totaal';
    const rows = (invoices || []).map((inv) => {
      const date = new Date(inv.created_at).toLocaleDateString('nl-NL');
      const clientName = clientMap[inv.client_id] || 'Onbekend';
      const subtotal = inv.subtotal.toFixed(2).replace('.', ',');
      const tax = inv.tax_amount.toFixed(2).replace('.', ',');
      const total = inv.total.toFixed(2).replace('.', ',');
      return `${inv.invoice_number};${date};${clientName};${subtotal};${tax};${total}`;
    });

    const csv = [header, ...rows].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="facturen-${year}.csv"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    );
  }
}

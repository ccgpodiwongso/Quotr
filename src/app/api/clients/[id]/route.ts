import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    // Fetch client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Klant niet gevonden.' }, { status: 404 });
    }

    // Fetch related quotes
    const { data: quotes } = await supabase
      .from('quotes')
      .select('id, quote_number, title, status, total, created_at')
      .eq('client_id', id)
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    // Fetch related invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, status, total, due_date, paid_at, created_at')
      .eq('client_id', id)
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    // Fetch related appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, title, start_time, end_time, status, location')
      .eq('client_id', id)
      .eq('company_id', profile.company_id)
      .order('start_time', { ascending: false });

    return NextResponse.json({
      client,
      quotes: quotes ?? [],
      invoices: invoices ?? [],
      appointments: appointments ?? [],
    });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const {
      name,
      email,
      phone,
      contact_person,
      kvk_number,
      btw_number,
      address_line1,
      address_line2,
      postal_code,
      city,
      notes,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Naam is verplicht.' },
        { status: 400 },
      );
    }

    const { data: client, error } = await supabase
      .from('clients')
      .update({
        name,
        email: email || '',
        phone: phone || null,
        contact_person: contact_person || null,
        kvk_number: kvk_number || null,
        btw_number: btw_number || null,
        address_line1: address_line1 || null,
        address_line2: address_line2 || null,
        postal_code: postal_code || null,
        city: city || null,
        notes: notes || null,
      })
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!client) {
      return NextResponse.json({ error: 'Klant niet gevonden.' }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    // Hard delete
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('company_id', profile.company_id);

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

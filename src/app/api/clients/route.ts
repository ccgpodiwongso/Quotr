import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      return NextResponse.json({ error: 'Geen bedrijf gevonden.' }, { status: 404 });
    }

    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clients });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    );
  }
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
      .insert({
        company_id: profile.company_id,
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
        country: 'NL',
        notes: notes || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ client }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    );
  }
}

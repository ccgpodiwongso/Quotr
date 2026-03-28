import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const { name, description, unit_price, unit, tax_rate } = body;

    if (!name || unit_price == null) {
      return NextResponse.json(
        { error: 'Naam en prijs zijn verplicht.' },
        { status: 400 },
      );
    }

    const { data: service, error } = await supabase
      .from('services')
      .update({
        name,
        description: description || null,
        unit_price: Number(unit_price),
        unit: unit || 'fixed',
        tax_rate: tax_rate != null ? Number(tax_rate) : 21,
      })
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!service) {
      return NextResponse.json({ error: 'Dienst niet gevonden.' }, { status: 404 });
    }

    return NextResponse.json({ service });
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

    // Soft-delete: set is_active to false (archive)
    const { error } = await supabase
      .from('services')
      .update({ is_active: false })
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

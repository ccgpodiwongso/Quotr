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

    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('is_active', { ascending: false })
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ services });
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
    const { name, description, unit_price, unit, tax_rate } = body;

    if (!name || unit_price == null) {
      return NextResponse.json(
        { error: 'Naam en prijs zijn verplicht.' },
        { status: 400 },
      );
    }

    // Get the next sort_order
    const { data: lastService } = await supabase
      .from('services')
      .select('sort_order')
      .eq('company_id', profile.company_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (lastService?.sort_order ?? 0) + 1;

    const { data: service, error } = await supabase
      .from('services')
      .insert({
        company_id: profile.company_id,
        name,
        description: description || null,
        unit_price: Number(unit_price),
        unit: unit || 'fixed',
        tax_rate: tax_rate != null ? Number(tax_rate) : 21,
        is_active: true,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ service }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    );
  }
}

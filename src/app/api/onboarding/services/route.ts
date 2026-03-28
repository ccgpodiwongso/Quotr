import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ServiceInput {
  name: string;
  price: string;
  type: 'fixed' | 'hourly';
}

interface ServicesBody {
  services: ServiceInput[];
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd.' }, { status: 401 });
    }

    // Get the user's company_id
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { error: 'Gebruikersprofiel niet gevonden.' },
        { status: 404 },
      );
    }

    const body: ServicesBody = await request.json();
    const { services } = body;

    if (!Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { error: 'Minimaal 1 dienst is verplicht.' },
        { status: 400 },
      );
    }

    if (services.length > 3) {
      return NextResponse.json(
        { error: 'Maximaal 3 diensten tijdens onboarding.' },
        { status: 400 },
      );
    }

    // Validate each service
    for (const service of services) {
      if (!service.name?.trim()) {
        return NextResponse.json(
          { error: 'Elke dienst moet een naam hebben.' },
          { status: 400 },
        );
      }
      const price = parseFloat(service.price);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { error: `Ongeldige prijs voor "${service.name}".` },
          { status: 400 },
        );
      }
    }

    // Build insert records
    const records = services.map((service, index) => ({
      company_id: profile.company_id,
      name: service.name.trim(),
      unit_price: parseFloat(service.price),
      unit: service.type === 'hourly' ? 'hour' : 'piece',
      tax_rate: 21, // Dutch BTW default
      is_active: true,
      sort_order: index,
    }));

    const { error: insertError } = await supabase.from('services').insert(records);

    if (insertError) {
      return NextResponse.json(
        { error: 'Kon diensten niet aanmaken.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: `${records.length} dienst(en) aangemaakt.` },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    );
  }
}

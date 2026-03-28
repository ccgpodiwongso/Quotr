import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface CompanyDetailsBody {
  companyName: string;
  kvkNumber: string;
  btwNumber: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  iban: string;
}

export async function PUT(request: Request) {
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

    const body: CompanyDetailsBody = await request.json();
    const { companyName, kvkNumber, btwNumber, addressLine1, city, postalCode, iban } = body;

    if (!companyName) {
      return NextResponse.json(
        { error: 'Bedrijfsnaam is verplicht.' },
        { status: 400 },
      );
    }

    // Update the company record
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        name: companyName,
        kvk_number: kvkNumber || null,
        btw_number: btwNumber || null,
        address_line1: addressLine1 || null,
        city: city || null,
        postal_code: postalCode || null,
        iban: iban || null,
      })
      .eq('id', profile.company_id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Kon bedrijfsgegevens niet bijwerken.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: 'Bedrijfsgegevens bijgewerkt.' });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: Request) {
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

    const { locale } = await request.json();

    if (!locale || !['nl', 'en'].includes(locale)) {
      return NextResponse.json({ error: 'Ongeldige taal.' }, { status: 400 });
    }

    // Update company settings with locale
    const { data: company } = await supabase
      .from('companies')
      .select('settings')
      .eq('id', profile.company_id)
      .single();

    const currentSettings = (company?.settings || {}) as Record<string, unknown>;

    const { error: companyError } = await supabase
      .from('companies')
      .update({
        settings: { ...currentSettings, locale },
      })
      .eq('id', profile.company_id);

    if (companyError) {
      return NextResponse.json({ error: companyError.message }, { status: 500 });
    }

    // Update auth user metadata with locale
    const { error: authError } = await supabase.auth.updateUser({
      data: { locale },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, locale });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    );
  }
}

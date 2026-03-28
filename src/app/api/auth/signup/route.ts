import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface SignupBody {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
}

export async function POST(request: Request) {
  try {
    const body: SignupBody = await request.json();
    const { fullName, email, password, companyName } = body;

    if (!fullName || !email || !password || !companyName) {
      return NextResponse.json(
        { error: 'Alle velden zijn verplicht.' },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Wachtwoord moet minimaal 8 tekens bevatten.' },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // 1. Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (authError) {
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'Dit e-mailadres is al geregistreerd.' },
          { status: 409 },
        );
      }
      console.error('Auth error:', authError.message);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 },
      );
    }

    const userId = authData.user.id;

    // 2. Create the company record
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        slug: `${slug}-${userId.slice(0, 8)}`,
        email,
        country: 'NL',
        plan: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        quote_next_number: 1,
        invoice_next_number: 1,
        locale: 'nl',
      })
      .select('id')
      .single();

    if (companyError) {
      console.error('Company error:', companyError.message);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: `Kon bedrijf niet aanmaken: ${companyError.message}` },
        { status: 500 },
      );
    }

    // 3. Create the user record linking auth user to company
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        company_id: company.id,
        email,
        full_name: fullName,
        role: 'owner',
        locale: 'nl',
      });

    if (userError) {
      console.error('User error:', userError.message);
      await supabase.from('companies').delete().eq('id', company.id);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: `Kon gebruiker niet aanmaken: ${userError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: 'Account aangemaakt.', userId, companyId: company.id },
      { status: 201 },
    );
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { error: `Er is een onverwachte fout opgetreden: ${err instanceof Error ? err.message : 'Onbekend'}` },
      { status: 500 },
    );
  }
}

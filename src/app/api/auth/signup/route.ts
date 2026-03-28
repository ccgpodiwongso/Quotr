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
      // Map common Supabase errors to Dutch
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'Dit e-mailadres is al geregistreerd.' },
          { status: 409 },
        );
      }
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
        settings: {},
        subscription_plan: 'trial',
        subscription_status: 'active',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        next_quote_number: 1,
        next_invoice_number: 1,
      })
      .select('id')
      .single();

    if (companyError) {
      // Cleanup: delete the auth user if company creation fails
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Kon bedrijf niet aanmaken. Probeer het opnieuw.' },
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
        is_active: true,
      });

    if (userError) {
      // Cleanup: delete both the company and auth user
      await supabase.from('companies').delete().eq('id', company.id);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Kon gebruiker niet aanmaken. Probeer het opnieuw.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: 'Account aangemaakt.', userId, companyId: company.id },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    const { searchParams } = request.nextUrl;
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
      return NextResponse.json(
        { error: 'Start en einddatum zijn verplicht.' },
        { status: 400 },
      );
    }

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*, clients(id, name, email)')
      .eq('company_id', profile.company_id)
      .gte('start_time', start)
      .lte('start_time', end)
      .order('start_time', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointments: appointments ?? [] });
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
      title,
      description,
      start_time,
      end_time,
      location,
      client_id,
      quote_id,
      type,
      meeting_url,
    } = body;

    if (!title || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Titel, starttijd en eindtijd zijn verplicht.' },
        { status: 400 },
      );
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        company_id: profile.company_id,
        user_id: authUser.id,
        title,
        description: description || null,
        start_time,
        end_time,
        location: location || null,
        client_id: client_id || null,
        quote_id: quote_id || null,
        status: 'scheduled',
        public_token: crypto.randomUUID(),
        metadata: {
          type: type || 'other',
          meeting_url: meeting_url || null,
        },
      })
      .select('*, clients(id, name, email)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    );
  }
}

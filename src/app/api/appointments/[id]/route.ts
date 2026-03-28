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
      .update({
        title,
        description: description || null,
        start_time,
        end_time,
        location: location || null,
        client_id: client_id || null,
        quote_id: quote_id || null,
        metadata: {
          type: type || 'other',
          meeting_url: meeting_url || null,
        },
      })
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .select('*, clients(id, name, email)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!appointment) {
      return NextResponse.json({ error: 'Afspraak niet gevonden.' }, { status: 404 });
    }

    return NextResponse.json({ appointment });
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

    const { error } = await supabase
      .from('appointments')
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

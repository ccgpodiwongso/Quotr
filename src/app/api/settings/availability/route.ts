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

    const { data: slots, error } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('user_id', authUser.id)
      .order('day_of_week', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ slots });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    );
  }
}

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

    const { slots } = await request.json();

    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: 'Ongeldige data.' }, { status: 400 });
    }

    // Delete existing slots for this user
    const { error: deleteError } = await supabase
      .from('availability_slots')
      .delete()
      .eq('company_id', profile.company_id)
      .eq('user_id', authUser.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Insert new slots
    const slotsToInsert = slots.map(
      (slot: { day_of_week: number; start_time: string; end_time: string; is_active: boolean }) => ({
        company_id: profile.company_id,
        user_id: authUser.id,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_active: slot.is_active,
      }),
    );

    if (slotsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('availability_slots')
        .insert(slotsToInsert);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    // Fetch the newly created slots
    const { data: newSlots, error: fetchError } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('user_id', authUser.id)
      .order('day_of_week', { ascending: true });

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ slots: newSlots });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    );
  }
}

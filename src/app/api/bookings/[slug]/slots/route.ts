import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const supabase = createServiceClient();

    const { searchParams } = request.nextUrl;
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Datum is verplicht.' },
        { status: 400 },
      );
    }

    // Find company by slug
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', slug)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Bedrijf niet gevonden.' }, { status: 404 });
    }

    // Determine day of week (0 = Sunday, 6 = Saturday)
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();

    // Fetch availability slots for this day
    const { data: slots } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('company_id', company.id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .order('start_time', { ascending: true });

    if (!slots || slots.length === 0) {
      return NextResponse.json({ available_slots: [] });
    }

    // Fetch existing appointments for that date
    const dayStart = `${date}T00:00:00`;
    const dayEnd = `${date}T23:59:59`;

    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('company_id', company.id)
      .gte('start_time', dayStart)
      .lte('start_time', dayEnd);

    const booked = (existingAppointments ?? []).map((a) => ({
      start: a.start_time,
      end: a.end_time,
    }));

    // Generate 30-minute time slots from availability, minus booked
    const availableSlots: { start: string; end: string }[] = [];

    for (const slot of slots) {
      const slotStart = parseTime(date, slot.start_time);
      const slotEnd = parseTime(date, slot.end_time);

      let cursor = slotStart.getTime();
      const intervalMs = 30 * 60 * 1000; // 30 minutes

      while (cursor + intervalMs <= slotEnd.getTime()) {
        const blockStart = new Date(cursor);
        const blockEnd = new Date(cursor + intervalMs);

        const isBooked = booked.some((b) => {
          const bStart = new Date(b.start).getTime();
          const bEnd = new Date(b.end).getTime();
          return blockStart.getTime() < bEnd && blockEnd.getTime() > bStart;
        });

        if (!isBooked) {
          availableSlots.push({
            start: blockStart.toISOString(),
            end: blockEnd.toISOString(),
          });
        }

        cursor += intervalMs;
      }
    }

    return NextResponse.json({ available_slots: availableSlots });
  } catch {
    return NextResponse.json(
      { error: 'Er is een onverwachte fout opgetreden.' },
      { status: 500 },
    );
  }
}

function parseTime(date: string, time: string): Date {
  // time is in "HH:MM" or "HH:MM:SS" format
  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date(date + 'T00:00:00');
  d.setHours(hours, minutes, 0, 0);
  return d;
}

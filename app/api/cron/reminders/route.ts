import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendGuestReminder } from '@/lib/email';
import { Booking, BookingType } from '@/lib/types';
import { addHours } from 'date-fns';

export async function POST() {
  const now = new Date();
  const windowStart = addHours(now, 23);
  const windowEnd = addHours(now, 25);

  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select('*, booking_type:booking_types(*)')
    .eq('status', 'confirmed')
    .eq('reminder_sent', false)
    .gte('start_time', windowStart.toISOString())
    .lte('start_time', windowEnd.toISOString());

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  for (const b of bookings) {
    const booking = b as Booking & { booking_type: BookingType };
    await sendGuestReminder(booking, booking.booking_type);
    await supabaseAdmin
      .from('bookings')
      .update({ reminder_sent: true })
      .eq('id', booking.id);
    sent++;
  }

  return NextResponse.json({ sent });
}

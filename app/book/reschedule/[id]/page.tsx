import { supabaseAdmin } from '@/lib/supabase';
import { Booking, BookingType } from '@/lib/types';
import { getAvailableDates } from '@/lib/availability';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { notFound } from 'next/navigation';
import RescheduleFlow from './reschedule-flow';

export default async function ReschedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data } = await supabaseAdmin
    .from('bookings')
    .select('*, booking_type:booking_types(*)')
    .eq('id', id)
    .single();

  if (!data) notFound();

  const booking = data as Booking & { booking_type: BookingType };

  if (booking.status === 'cancelled') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Cannot Reschedule</h1>
        <p className="text-muted-foreground">This booking has been cancelled.</p>
      </main>
    );
  }

  const tz = booking.timezone || 'America/Denver';
  const displayTime = toZonedTime(new Date(booking.start_time), tz);
  const bookingType = booking.booking_type;
  const availableDates = getAvailableDates();

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">Reschedule Booking</h1>

      <div className="bg-secondary rounded-lg p-4 mb-8 border border-border">
        <p className="text-sm text-muted-foreground">Current time:</p>
        <p className="font-semibold text-foreground">
          {bookingType.name} · {format(displayTime, 'EEEE, MMMM d')} at {format(displayTime, 'h:mm a')}
        </p>
      </div>

      <p className="text-sm text-muted-foreground mb-6">Select a new date and time:</p>

      <RescheduleFlow
        bookingId={booking.id}
        bookingType={bookingType}
        availableDates={availableDates}
      />
    </main>
  );
}

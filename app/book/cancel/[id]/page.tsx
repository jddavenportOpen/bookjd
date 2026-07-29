import { supabaseAdmin } from '@/lib/supabase';
import { Booking, BookingType } from '@/lib/types';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { notFound } from 'next/navigation';
import CancelForm from './cancel-form';

export default async function CancelPage({
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
        <h1 className="text-2xl font-bold text-foreground mb-2">Already Cancelled</h1>
        <p className="text-muted-foreground">This booking has already been cancelled.</p>
      </main>
    );
  }

  const tz = booking.timezone || 'America/Denver';
  const displayTime = toZonedTime(new Date(booking.start_time), tz);
  const bookingType = booking.booking_type;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Cancel Booking</h1>

      <div className="bg-secondary rounded-lg p-4 mb-6 border border-border">
        <p className="font-semibold text-foreground">{bookingType.name}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {format(displayTime, 'EEEE, MMMM d')} at {format(displayTime, 'h:mm a')}
        </p>
        <p className="text-sm text-muted-foreground">Guest: {booking.guest_name}</p>
      </div>

      <CancelForm bookingId={booking.id} />
    </main>
  );
}

import { supabaseAdmin } from '@/lib/supabase';
import { Booking, BookingType } from '@/lib/types';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import Link from 'next/link';

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string; session_id?: string }>;
}) {
  const { slug } = await params;
  const { id, session_id } = await searchParams;

  type BookingWithType = Booking & { booking_type: BookingType };
  let booking: BookingWithType | null = null;

  if (id) {
    const { data } = await supabaseAdmin
      .from('bookings')
      .select('*, booking_type:booking_types(*)')
      .eq('id', id)
      .single();
    booking = data as BookingWithType | null;
  } else if (session_id) {
    const { data } = await supabaseAdmin
      .from('bookings')
      .select('*, booking_type:booking_types(*)')
      .eq('stripe_checkout_session_id', session_id)
      .single();
    booking = data as BookingWithType | null;
  }

  if (!booking) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">You&apos;re Booked!</h1>
        <p className="text-muted-foreground mb-8">A confirmation email has been sent.</p>
        <Link href="/book" className="text-sm text-muted-foreground hover:text-green underline transition-colors">
          Book another time
        </Link>
      </main>
    );
  }

  const tz = booking.timezone || 'America/Denver';
  const displayTime = toZonedTime(new Date(booking.start_time), tz);
  const bookingType = booking.booking_type;
  const price = bookingType.price_cents === 0 ? 'Free' : `$${bookingType.price_cents / 100}`;

  // Generate ICS file content
  const icsStart = format(new Date(booking.start_time), "yyyyMMdd'T'HHmmss'Z'");
  const icsEnd = format(new Date(booking.end_time), "yyyyMMdd'T'HHmmss'Z'");
  const icsContent = encodeURIComponent(
    `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${icsStart}\nDTEND:${icsEnd}\nSUMMARY:${bookingType.name} with JD Davenport\nEND:VEVENT\nEND:VCALENDAR`
  );

  return (
    <main className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-dim mb-6 border border-green/30">
        <svg className="w-8 h-8 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">You&apos;re Booked!</h1>

      <div className="bg-secondary rounded-lg p-4 my-6 inline-block text-left border border-border">
        <p className="font-semibold text-foreground">{bookingType.name}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {format(displayTime, 'EEEE, MMMM d')} at {format(displayTime, 'h:mm a')}
        </p>
        <p className="text-sm text-muted-foreground">{bookingType.duration_minutes} min · {price}</p>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        A confirmation email has been sent to {booking.guest_email}
      </p>

      {bookingType.price_cents > 0 && (
        <p className="text-sm text-muted-foreground mb-6">A receipt has been sent to your email.</p>
      )}

      <div className="flex items-center justify-center gap-4 mb-8">
        <a
          href={`data:text/calendar;charset=utf-8,${icsContent}`}
          download={`bookjd-${slug}.ics`}
          className="text-sm text-green underline hover:brightness-110 transition-colors"
        >
          Add to Calendar
        </a>
        <span className="text-border">·</span>
        <Link
          href={`/book/reschedule/${booking.id}`}
          className="text-sm text-muted-foreground hover:text-green transition-colors"
        >
          Reschedule
        </Link>
        <span className="text-border">·</span>
        <Link
          href={`/book/cancel/${booking.id}`}
          className="text-sm text-muted-foreground hover:text-green transition-colors"
        >
          Cancel
        </Link>
      </div>

      <Link href="/book" className="text-sm text-muted-foreground hover:text-green transition-colors">
        Book another time
      </Link>
    </main>
  );
}

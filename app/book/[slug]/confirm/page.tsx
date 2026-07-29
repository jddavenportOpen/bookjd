import { supabaseAdmin } from '@/lib/supabase';
import { BookingType } from '@/lib/types';
import { notFound } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import GuestForm from './guest-form';
import Link from 'next/link';

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string; time?: string; tz?: string }>;
}) {
  const { slug } = await params;
  const { date, time, tz } = await searchParams;
  
  if (!date || !time || !tz) notFound();

  const { data } = await supabaseAdmin
    .from('booking_types')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single();

  if (!data) notFound();

  const bookingType = data as BookingType;
  const startTime = parseISO(time);
  const displayTime = toZonedTime(startTime, tz);
  const price = bookingType.price_cents === 0 ? 'Free' : `$${bookingType.price_cents / 100}`;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/book/${slug}`} className="text-sm text-muted-foreground hover:text-green transition-colors">
          ← Back to time selection
        </Link>
      </div>

      <div className="bg-secondary rounded-lg p-4 mb-8 border border-border">
        <h2 className="font-semibold text-foreground">{bookingType.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {format(displayTime, 'EEEE, MMMM d')} at {format(displayTime, 'h:mm a')} · {bookingType.duration_minutes} min · {price}
        </p>
      </div>

      <GuestForm
        bookingType={bookingType}
        startTime={time}
        timezone={tz}
      />
    </main>
  );
}

import { supabaseAdmin } from '@/lib/supabase';
import { BookingType } from '@/lib/types';
import { getAvailableDates } from '@/lib/availability';
import { notFound } from 'next/navigation';
import DateTimePicker from './date-time-picker';
import Link from 'next/link';

export default async function BookSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data } = await supabaseAdmin
    .from('booking_types')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single();

  if (!data) notFound();

  const bookingType = data as BookingType;
  const availableDates = getAvailableDates();
  const price = bookingType.price_cents === 0 ? 'Free' : `$${bookingType.price_cents / 100}`;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/book" className="text-sm text-muted-foreground hover:text-green transition-colors">
          ← Back to booking types
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{bookingType.name}</h1>
        <p className="text-muted-foreground mt-1">
          {bookingType.duration_minutes} min · {price}
        </p>
      </div>

      <DateTimePicker
        bookingType={bookingType}
        availableDates={availableDates}
      />
    </main>
  );
}

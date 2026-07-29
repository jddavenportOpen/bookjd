import { supabaseAdmin } from '@/lib/supabase';
import { BookingType } from '@/lib/types';
import BookingTypeCard from '@/components/booking-type-card';

export const revalidate = 60;

export default async function BookPage() {
  const { data: types } = await supabaseAdmin
    .from('booking_types')
    .select('*')
    .eq('active', true)
    .order('sort_order');

  const bookingTypes = (types || []) as BookingType[];

  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2 text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Book a Time with <span className="text-green">JD</span>
        </h1>
        <p className="text-muted-foreground">Choose the session that fits your needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {bookingTypes.map((type) => (
          <BookingTypeCard key={type.id} type={type} />
        ))}
      </div>

      <div className="text-center mt-16 text-sm text-muted-foreground">
        <p>Need to manage an existing booking?</p>
        <p className="mt-1">Check your confirmation email for reschedule/cancel links.</p>
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookingType } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function GuestForm({
  bookingType,
  startTime,
  timezone,
}: {
  bookingType: BookingType;
  startTime: string;
  timezone: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPaid = bookingType.price_cents > 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_type_slug: bookingType.slug,
          start_time: startTime,
          timezone,
          guest_name: formData.get('name'),
          guest_email: formData.get('email'),
          guest_phone: formData.get('phone') || null,
          guest_company: formData.get('company') || null,
          guest_notes: formData.get('notes') || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      if (data.checkout_url) {
        // Redirect to Stripe
        window.location.href = data.checkout_url;
      } else {
        // Free booking — redirect to success
        router.push(`/book/${bookingType.slug}/success?id=${data.booking_id}`);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-lg font-semibold text-foreground">Your Details</h3>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="name" className="text-foreground">Name *</Label>
        <Input id="name" name="name" required className="mt-1 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground" />
      </div>

      <div>
        <Label htmlFor="email" className="text-foreground">Email *</Label>
        <Input id="email" name="email" type="email" required className="mt-1 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground" />
      </div>

      <div>
        <Label htmlFor="phone" className="text-foreground">Phone</Label>
        <Input id="phone" name="phone" type="tel" className="mt-1 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground" />
      </div>

      <div>
        <Label htmlFor="company" className="text-foreground">Company</Label>
        <Input id="company" name="company" className="mt-1 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground" />
      </div>

      <div>
        <Label htmlFor="notes" className="text-foreground">
          What would you like to discuss? {isPaid && '*'}
        </Label>
        <Textarea
          id="notes"
          name="notes"
          required={isPaid}
          rows={3}
          className="mt-1 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green text-primary-foreground py-2.5 px-4 rounded-lg text-sm font-medium hover:brightness-110 transition-colors disabled:opacity-50"
      >
        {loading
          ? 'Processing...'
          : isPaid
            ? 'Continue to Payment'
            : 'Confirm Booking'}
      </button>

      {isPaid && (
        <p className="text-xs text-muted-foreground text-center">
          You&apos;ll be redirected to Stripe for secure payment
        </p>
      )}
    </form>
  );
}

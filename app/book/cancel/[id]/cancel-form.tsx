'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function CancelForm({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          cancellation_reason: formData.get('reason') || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to cancel');
        setLoading(false);
        return;
      }

      setDone(true);
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✓</div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Booking Cancelled</h2>
        <p className="text-sm text-muted-foreground">A confirmation email has been sent.</p>
        <a href="/book" className="inline-block mt-4 text-sm text-muted-foreground hover:text-green underline transition-colors">
          Book a new time
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleCancel} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="reason" className="text-foreground">Why are you cancelling? (optional)</Label>
        <Textarea id="reason" name="reason" rows={3} className="mt-1 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground" />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-red-500/80 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
      >
        {loading ? 'Cancelling...' : 'Confirm Cancellation'}
      </button>
    </form>
  );
}

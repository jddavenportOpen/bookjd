'use client';

import { useState } from 'react';
import { BookingType, TimeSlot } from '@/lib/types';
import CalendarPicker from '@/components/calendar-picker';
import TimeSlotGrid from '@/components/time-slot-grid';
import { addMinutes } from 'date-fns';

export default function RescheduleFlow({
  bookingId,
  bookingType,
  availableDates,
}: {
  bookingId: string;
  bookingType: BookingType;
  availableDates: string[];
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visitorTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/availability?date=${date}&slug=${bookingType.slug}&tz=${encodeURIComponent(visitorTz)}`
      );
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    setError(null);

    const newStart = new Date(selectedSlot);
    const newEnd = addMinutes(newStart, bookingType.duration_minutes);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          new_start_time: newStart.toISOString(),
          new_end_time: newEnd.toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to reschedule');
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
        <h2 className="text-xl font-semibold text-foreground mb-2">Rescheduled!</h2>
        <p className="text-sm text-muted-foreground">A confirmation email has been sent.</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <CalendarPicker
            availableDates={availableDates}
            selectedDate={selectedDate}
            onSelectDate={handleDateSelect}
          />
        </div>
        <div>
          {selectedDate && (
            <TimeSlotGrid
              slots={slots}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              loading={loading}
            />
          )}
          {selectedSlot && (
            <button
              onClick={handleReschedule}
              disabled={loading}
              className="mt-6 w-full bg-green text-primary-foreground py-2.5 px-4 rounded-lg text-sm font-medium hover:brightness-110 transition-colors disabled:opacity-50"
            >
              {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookingType, TimeSlot } from '@/lib/types';
import CalendarPicker from '@/components/calendar-picker';
import TimeSlotGrid from '@/components/time-slot-grid';

export default function DateTimePicker({
  bookingType,
  availableDates,
}: {
  bookingType: BookingType;
  availableDates: string[];
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleContinue = () => {
    if (!selectedSlot || !selectedDate) return;
    const params = new URLSearchParams({
      date: selectedDate,
      time: selectedSlot,
      tz: visitorTz,
    });
    router.push(`/book/${bookingType.slug}/confirm?${params.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Select a date</h3>
        <CalendarPicker
          availableDates={availableDates}
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">
          {selectedDate ? 'Select a time' : 'Pick a date first'}
        </h3>
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
            onClick={handleContinue}
            className="mt-6 w-full bg-green text-primary-foreground py-2.5 px-4 rounded-lg text-sm font-medium hover:brightness-110 transition-colors duration-200"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

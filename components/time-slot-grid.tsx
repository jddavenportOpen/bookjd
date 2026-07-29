'use client';

import { TimeSlot } from '@/lib/types';

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelectSlot: (time: string) => void;
  loading?: boolean;
}

export default function TimeSlotGrid({
  slots,
  selectedSlot,
  onSelectSlot,
  loading,
}: TimeSlotGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-sm text-muted-foreground">Loading times...</div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No available times for this date
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot) => (
        <button
          key={slot.time}
          onClick={() => onSelectSlot(slot.time)}
          className={`
            px-3 py-2 text-sm rounded-lg border transition-all duration-200 font-medium font-mono
            ${
              selectedSlot === slot.time
                ? 'bg-green text-primary-foreground border-green'
                : 'bg-surface2 text-foreground border-border hover:border-green/50 hover:text-green'
            }
          `}
        >
          {slot.display}
        </button>
      ))}
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  format,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay,
} from 'date-fns';

interface CalendarPickerProps {
  availableDates: string[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export default function CalendarPicker({
  availableDates,
  selectedDate,
  onSelectDate,
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfDay(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let d = calStart;
  while (d <= calEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  const isAvailable = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availableDates.includes(dateStr) && !isBefore(date, today);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
          className="p-2 text-muted-foreground hover:text-green transition-colors"
        >
          ←
        </button>
        <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 text-muted-foreground hover:text-green transition-colors"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const available = isAvailable(day);
          const selected = selectedDate === dateStr;
          const inMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, today);

          return (
            <button
              key={i}
              onClick={() => available && onSelectDate(dateStr)}
              disabled={!available}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-md transition-colors font-medium
                ${!inMonth ? 'text-border' : ''}
                ${inMonth && !available ? 'text-border cursor-not-allowed' : ''}
                ${available && !selected ? 'text-foreground hover:bg-green-dim cursor-pointer' : ''}
                ${selected ? 'bg-green text-primary-foreground' : ''}
                ${isToday && !selected ? 'ring-1 ring-green/50' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

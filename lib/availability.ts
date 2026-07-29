import { AVAILABILITY_CONFIG } from './availability-config';
import { supabaseAdmin } from './supabase';
import { getBusyPeriods } from './google-calendar';
import { BookingType, TimeSlot, AvailabilityOverride } from './types';
import {
  startOfDay,
  endOfDay,
  addMinutes,
  addHours,
  isBefore,
  isAfter,
  getDay,
  format,
  parseISO,
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

interface BusyPeriod {
  start: Date;
  end: Date;
}

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return isBefore(aStart, bEnd) && isAfter(aEnd, bStart);
}

export async function getAvailableSlots(
  date: string, // YYYY-MM-DD
  bookingType: BookingType,
  visitorTz: string
): Promise<TimeSlot[]> {
  const config = AVAILABILITY_CONFIG;
  const hostTz = config.timezone;

  // Parse date in host timezone
  const dateInHostTz = fromZonedTime(
    new Date(`${date}T00:00:00`),
    hostTz
  );
  const dayOfWeek = getDay(toZonedTime(dateInHostTz, hostTz));

  // Check if it's a valid weekday
  if (!config.weekdays.includes(dayOfWeek)) {
    return [];
  }

  // Check availability overrides
  const { data: overrides } = await supabaseAdmin
    .from('availability_overrides')
    .select('*')
    .eq('date', date);

  const override = (overrides as AvailabilityOverride[] | null)?.[0];
  if (override && !override.available) {
    return [];
  }

  // Determine hours
  let startHour = config.startHour;
  let startMinute = config.startMinute;
  let endHour = config.endHour;
  let endMinute = config.endMinute;

  if (override && override.available && override.start_time && override.end_time) {
    const [sh, sm] = override.start_time.split(':').map(Number);
    const [eh, em] = override.end_time.split(':').map(Number);
    startHour = sh;
    startMinute = sm;
    endHour = eh;
    endMinute = em;
  }

  // Generate candidate slots in host timezone
  const dayStart = fromZonedTime(
    new Date(`${date}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00`),
    hostTz
  );
  const dayEnd = fromZonedTime(
    new Date(`${date}T${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00`),
    hostTz
  );

  const candidates: Date[] = [];
  let current = dayStart;
  while (isBefore(current, dayEnd)) {
    const slotEnd = addMinutes(current, bookingType.duration_minutes);
    if (!isAfter(slotEnd, dayEnd)) {
      candidates.push(current);
    }
    current = addMinutes(current, config.slotInterval);
  }

  if (candidates.length === 0) return [];

  // Fetch Google Calendar busy periods
  const gcalBusy = await getBusyPeriods(
    startOfDay(dateInHostTz).toISOString(),
    endOfDay(dateInHostTz).toISOString()
  );

  // Fetch existing bookings
  const { data: existingBookings } = await supabaseAdmin
    .from('bookings')
    .select('start_time, end_time, status')
    .gte('start_time', startOfDay(dateInHostTz).toISOString())
    .lt('start_time', endOfDay(dateInHostTz).toISOString())
    .in('status', ['confirmed', 'pending']);

  // Build busy periods list
  const busyPeriods: BusyPeriod[] = [
    ...gcalBusy.map((b) => ({
      start: parseISO(b.start),
      end: parseISO(b.end),
    })),
    ...(existingBookings || []).map((b: { start_time: string; end_time: string }) => ({
      start: addMinutes(parseISO(b.start_time), -config.bufferBefore),
      end: addMinutes(parseISO(b.end_time), config.bufferAfter),
    })),
  ];

  const now = new Date();
  const minimumStart = addHours(now, config.minimumNotice);

  // Filter slots
  const available = candidates.filter((slot) => {
    if (isBefore(slot, minimumStart)) return false;

    const slotEnd = addMinutes(slot, bookingType.duration_minutes);
    const bufferedStart = addMinutes(slot, -config.bufferBefore);
    const bufferedEnd = addMinutes(slotEnd, config.bufferAfter);

    for (const busy of busyPeriods) {
      if (overlaps(bufferedStart, bufferedEnd, busy.start, busy.end)) {
        return false;
      }
    }

    return true;
  });

  // Convert to visitor timezone for display
  return available.map((slot) => {
    const inVisitorTz = toZonedTime(slot, visitorTz);
    return {
      time: slot.toISOString(),
      display: format(inVisitorTz, 'h:mm a'),
    };
  });
}

export function getAvailableDates(maxDaysAhead: number = AVAILABILITY_CONFIG.maxDaysAhead): string[] {
  const config = AVAILABILITY_CONFIG;
  const dates: string[] = [];
  const now = new Date();
  const hostNow = toZonedTime(now, config.timezone);

  for (let i = 0; i <= maxDaysAhead; i++) {
    const d = new Date(hostNow);
    d.setDate(d.getDate() + i);
    const day = getDay(d);
    if (config.weekdays.includes(day)) {
      dates.push(format(d, 'yyyy-MM-dd'));
    }
  }

  return dates;
}

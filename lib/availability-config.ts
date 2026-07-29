export const AVAILABILITY_CONFIG = {
  timezone: 'America/Denver',
  weekdays: [1, 2, 3, 4, 5] as number[], // Mon-Fri (date-fns: 0=Sun, 1=Mon, ...)
  startHour: 9,
  startMinute: 0,
  endHour: 17,
  endMinute: 0,
  bufferBefore: 10, // minutes
  bufferAfter: 10,
  minimumNotice: 4, // hours
  maxDaysAhead: 30,
  slotInterval: 15, // minutes
};

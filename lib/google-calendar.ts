import { google } from 'googleapis';

function getCalendarClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

export async function getBusyPeriods(
  timeMin: string,
  timeMax: string
): Promise<{ start: string; end: string }[]> {
  const calendar = getCalendarClient();
  if (!calendar) {
    console.log('[Google Calendar] Not configured, returning empty busy periods');
    return [];
  }

  try {
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: calendarId }],
      },
    });

    const busy = res.data.calendars?.[calendarId]?.busy || [];
    return busy.map((b) => ({
      start: b.start!,
      end: b.end!,
    }));
  } catch (error) {
    console.error('[Google Calendar] Error fetching busy periods:', error);
    return [];
  }
}

export async function createCalendarEvent(params: {
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
  attendeeEmail: string;
  colorId?: string;
}): Promise<string | null> {
  const calendar = getCalendarClient();
  if (!calendar) {
    console.log('[Google Calendar] Not configured, skipping event creation');
    return null;
  }

  try {
    const res = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: params.summary,
        description: params.description,
        start: { dateTime: params.startTime, timeZone: 'America/Denver' },
        end: { dateTime: params.endTime, timeZone: 'America/Denver' },
        attendees: [{ email: params.attendeeEmail }],
        reminders: {
          useDefault: false,
          overrides: [{ method: 'popup', minutes: 15 }],
        },
      },
    });
    return res.data.id || null;
  } catch (error) {
    console.error('[Google Calendar] Error creating event:', error);
    return null;
  }
}

export async function updateCalendarEvent(
  eventId: string,
  params: { startTime: string; endTime: string }
): Promise<void> {
  const calendar = getCalendarClient();
  if (!calendar) return;

  try {
    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: {
        start: { dateTime: params.startTime, timeZone: 'America/Denver' },
        end: { dateTime: params.endTime, timeZone: 'America/Denver' },
      },
    });
  } catch (error) {
    console.error('[Google Calendar] Error updating event:', error);
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const calendar = getCalendarClient();
  if (!calendar) return;

  try {
    await calendar.events.delete({ calendarId, eventId });
  } catch (error) {
    console.error('[Google Calendar] Error deleting event:', error);
  }
}

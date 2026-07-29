import { Booking, BookingType } from './types';

const webhookUrl = process.env.OPENCLAW_WEBHOOK_URL;

export async function fireWebhook(
  event: 'booking.confirmed' | 'booking.cancelled' | 'booking.rescheduled',
  booking: Booking,
  bookingType: BookingType
) {
  if (!webhookUrl) {
    console.log(`[OpenClaw Webhook] ${event}:`, booking.id);
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        booking: {
          id: booking.id,
          type_name: bookingType.name,
          type_slug: bookingType.slug,
          duration_minutes: bookingType.duration_minutes,
          start_time: booking.start_time,
          end_time: booking.end_time,
          timezone: booking.timezone,
          guest_name: booking.guest_name,
          guest_email: booking.guest_email,
          guest_phone: booking.guest_phone,
          guest_company: booking.guest_company,
          guest_notes: booking.guest_notes,
          amount_paid_cents: booking.amount_paid_cents,
          payment_status: booking.payment_status,
          google_calendar_event_id: booking.google_calendar_event_id,
        },
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('[OpenClaw Webhook] Failed:', error);
  }
}

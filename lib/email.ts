import { Booking, BookingType } from './types';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const resendApiKey = process.env.RESEND_API_KEY;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
// Set these for your own deployment.
const emailFrom = process.env.EMAIL_FROM || 'Bookings <bookings@example.com>';
const hostEmail = process.env.HOST_EMAIL || 'owner@example.com';

async function sendEmail(to: string, subject: string, html: string) {
  if (!resendApiKey) {
    console.log(`[Email] Would send to ${to}: ${subject}`);
    console.log(`[Email] Body: ${html.substring(0, 200)}...`);
    return;
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to,
        subject,
        html,
      }),
    });
  } catch (error) {
    console.error('[Email] Failed to send:', error);
  }
}

function formatBookingTime(booking: Booking): string {
  const tz = booking.timezone || 'America/Denver';
  const start = toZonedTime(new Date(booking.start_time), tz);
  return format(start, "EEEE, MMMM d 'at' h:mm a");
}

export async function sendGuestConfirmation(booking: Booking, bookingType: BookingType) {
  const time = formatBookingTime(booking);
  const priceText = bookingType.price_cents > 0 ? `$${bookingType.price_cents / 100}` : 'Free';
  
  await sendEmail(
    booking.guest_email,
    `Confirmed: ${bookingType.name} with JD on ${format(new Date(booking.start_time), 'MMM d')}`,
    `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#111827;">You're booked! ✓</h2>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
        <p><strong>${bookingType.name}</strong> (${bookingType.duration_minutes} min) — ${priceText}</p>
        <p>${time} (${booking.timezone})</p>
      </div>
      <p>Need to make changes?</p>
      <p>
        <a href="${baseUrl}/book/reschedule/${booking.id}">Reschedule</a> · 
        <a href="${baseUrl}/book/cancel/${booking.id}">Cancel</a>
      </p>
    </div>`
  );
}

export async function sendHostConfirmation(booking: Booking, bookingType: BookingType) {
  const time = formatBookingTime(booking);
  
  await sendEmail(
    hostEmail,
    `New booking: ${booking.guest_name} - ${bookingType.name}`,
    `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2>New Booking</h2>
      <p><strong>${bookingType.name}</strong> — ${time}</p>
      <p>Guest: ${booking.guest_name} (${booking.guest_email})</p>
      ${booking.guest_company ? `<p>Company: ${booking.guest_company}</p>` : ''}
      ${booking.guest_notes ? `<p>Notes: ${booking.guest_notes}</p>` : ''}
    </div>`
  );
}

export async function sendGuestReminder(booking: Booking, bookingType: BookingType) {
  const time = formatBookingTime(booking);
  
  await sendEmail(
    booking.guest_email,
    `Reminder: Your call with JD is tomorrow`,
    `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2>Reminder: Tomorrow's Call</h2>
      <p><strong>${bookingType.name}</strong> — ${time}</p>
      <p>
        <a href="${baseUrl}/book/reschedule/${booking.id}">Reschedule</a> · 
        <a href="${baseUrl}/book/cancel/${booking.id}">Cancel</a>
      </p>
    </div>`
  );
}

export async function sendCancellationEmail(booking: Booking, bookingType: BookingType) {
  const time = formatBookingTime(booking);
  const refundText = booking.payment_status === 'refunded' ? 'A refund has been issued.' : '';
  
  await sendEmail(
    booking.guest_email,
    `Cancelled: ${bookingType.name} with JD`,
    `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2>Booking Cancelled</h2>
      <p><strong>${bookingType.name}</strong> — ${time}</p>
      ${refundText ? `<p>${refundText}</p>` : ''}
      <p><a href="${baseUrl}/book">Book a new time</a></p>
    </div>`
  );
}

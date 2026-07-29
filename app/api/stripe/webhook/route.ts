import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { createCalendarEvent } from '@/lib/google-calendar';
import { sendGuestConfirmation, sendHostConfirmation } from '@/lib/email';
import { fireWebhook } from '@/lib/openclaw-webhook';
import { Booking, BookingType } from '@/lib/types';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    if (!bookingId) return NextResponse.json({ received: true });

    // Idempotency: check if already confirmed
    const { data: existing } = await supabaseAdmin
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .single();

    if (existing?.status === 'confirmed') {
      return NextResponse.json({ received: true });
    }

    // Update booking
    await supabaseAdmin
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        stripe_payment_intent_id: session.payment_intent as string,
        amount_paid_cents: session.amount_total || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    // Fetch full booking + type
    const { data } = await supabaseAdmin
      .from('bookings')
      .select('*, booking_type:booking_types(*)')
      .eq('id', bookingId)
      .single();

    if (data) {
      const booking = data as Booking & { booking_type: BookingType };
      const bookingType = booking.booking_type;

      // Create calendar event
      const eventId = await createCalendarEvent({
        summary: `${bookingType.name} - ${booking.guest_name}`,
        description: `Guest: ${booking.guest_name}\nEmail: ${booking.guest_email}\nPhone: ${booking.guest_phone || 'N/A'}\nCompany: ${booking.guest_company || 'N/A'}\nNotes: ${booking.guest_notes || 'None'}\n\nBooking ID: ${booking.id}`,
        startTime: booking.start_time,
        endTime: booking.end_time,
        attendeeEmail: booking.guest_email,
      });

      if (eventId) {
        await supabaseAdmin
          .from('bookings')
          .update({ google_calendar_event_id: eventId })
          .eq('id', bookingId);
      }

      await sendGuestConfirmation(booking, bookingType);
      await sendHostConfirmation(booking, bookingType);
      await fireWebhook('booking.confirmed', booking, bookingType);
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    if (bookingId) {
      await supabaseAdmin
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);
    }
  }

  return NextResponse.json({ received: true });
}

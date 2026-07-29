import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { deleteCalendarEvent, updateCalendarEvent } from '@/lib/google-calendar';
import { sendCancellationEmail } from '@/lib/email';
import { fireWebhook } from '@/lib/openclaw-webhook';
import { Booking, BookingType } from '@/lib/types';
import { differenceInHours } from 'date-fns';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from('bookings')
    .select('*, booking_type:booking_types(*)')
    .eq('id', id)
    .single();

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { action, cancellation_reason, new_start_time, new_end_time } = body;

  const { data } = await supabaseAdmin
    .from('bookings')
    .select('*, booking_type:booking_types(*)')
    .eq('id', id)
    .single();

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const booking = data as Booking & { booking_type: BookingType };
  const bookingType = booking.booking_type;

  if (action === 'cancel') {
    // Update booking
    await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Delete calendar event
    if (booking.google_calendar_event_id) {
      await deleteCalendarEvent(booking.google_calendar_event_id);
    }

    // Handle refund
    if (booking.payment_status === 'paid' && booking.stripe_payment_intent_id && isStripeConfigured() && stripe) {
      const hoursUntil = differenceInHours(new Date(booking.start_time), new Date());
      const refundAmount = hoursUntil > 24
        ? booking.amount_paid_cents
        : Math.floor(booking.amount_paid_cents / 2);

      await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        amount: refundAmount,
      });

      await supabaseAdmin
        .from('bookings')
        .update({ payment_status: 'refunded' })
        .eq('id', id);
    }

    booking.status = 'cancelled';
    await sendCancellationEmail(booking, bookingType);
    await fireWebhook('booking.cancelled', booking, bookingType);

    return NextResponse.json({ success: true });
  }

  if (action === 'reschedule') {
    if (!new_start_time || !new_end_time) {
      return NextResponse.json({ error: 'Missing new times' }, { status: 400 });
    }

    await supabaseAdmin
      .from('bookings')
      .update({
        start_time: new_start_time,
        end_time: new_end_time,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (booking.google_calendar_event_id) {
      await updateCalendarEvent(booking.google_calendar_event_id, {
        startTime: new_start_time,
        endTime: new_end_time,
      });
    }

    booking.start_time = new_start_time;
    booking.end_time = new_end_time;
    await fireWebhook('booking.rescheduled', booking, bookingType);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

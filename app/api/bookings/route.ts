import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { createCalendarEvent } from '@/lib/google-calendar';
import { sendGuestConfirmation, sendHostConfirmation } from '@/lib/email';
import { fireWebhook } from '@/lib/booking-webhook';
import { BookingType, Booking } from '@/lib/types';
import { addMinutes } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      booking_type_slug,
      start_time,
      timezone,
      guest_name,
      guest_email,
      guest_phone,
      guest_company,
      guest_notes,
    } = body;

    if (!booking_type_slug || !start_time || !timezone || !guest_name || !guest_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get booking type
    const { data: btData } = await supabaseAdmin
      .from('booking_types')
      .select('*')
      .eq('slug', booking_type_slug)
      .eq('active', true)
      .single();

    if (!btData) {
      return NextResponse.json({ error: 'Invalid booking type' }, { status: 400 });
    }

    const bookingType = btData as BookingType;
    const startDate = new Date(start_time);
    const endDate = addMinutes(startDate, bookingType.duration_minutes);

    // Check for double booking (overlapping confirmed/pending bookings)
    const { data: conflicts } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .in('status', ['confirmed', 'pending'])
      .lt('start_time', endDate.toISOString())
      .gt('end_time', startDate.toISOString());

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({ error: 'This time slot is no longer available' }, { status: 409 });
    }

    const isPaid = bookingType.price_cents > 0;

    // Create the booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        booking_type_id: bookingType.id,
        status: isPaid ? 'pending' : 'confirmed',
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        timezone,
        guest_name,
        guest_email,
        guest_phone,
        guest_company,
        guest_notes,
        payment_status: isPaid ? 'pending' : 'none',
        amount_paid_cents: 0,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error('Booking creation error:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    const bookingData = booking as Booking;

    if (isPaid && isStripeConfigured() && stripe) {
      // Create Stripe Checkout Session
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: bookingType.price_cents,
              product_data: {
                name: bookingType.name,
                description: `${bookingType.duration_minutes}-minute session with JD Davenport`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: { booking_id: bookingData.id },
        customer_email: guest_email,
        success_url: `${baseUrl}/book/${booking_type_slug}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/book/${booking_type_slug}?cancelled=true`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
      });

      // Store session ID
      await supabaseAdmin
        .from('bookings')
        .update({ stripe_checkout_session_id: session.id })
        .eq('id', bookingData.id);

      return NextResponse.json({ checkout_url: session.url });
    }

    if (isPaid && !isStripeConfigured()) {
      // Stripe not configured — auto-confirm for dev
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'confirmed', payment_status: 'none' })
        .eq('id', bookingData.id);
      bookingData.status = 'confirmed';
    }

    // Free booking or stripe not configured — confirm immediately
    const eventId = await createCalendarEvent({
      summary: `${bookingType.name} - ${guest_name}`,
      description: `Guest: ${guest_name}\nEmail: ${guest_email}\nPhone: ${guest_phone || 'N/A'}\nCompany: ${guest_company || 'N/A'}\nNotes: ${guest_notes || 'None'}\n\nBooking ID: ${bookingData.id}`,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      attendeeEmail: guest_email,
    });

    if (eventId) {
      await supabaseAdmin
        .from('bookings')
        .update({ google_calendar_event_id: eventId })
        .eq('id', bookingData.id);
    }

    await sendGuestConfirmation(bookingData, bookingType);
    await sendHostConfirmation(bookingData, bookingType);
    await fireWebhook('booking.confirmed', bookingData, bookingType);

    return NextResponse.json({ booking_id: bookingData.id });
  } catch (error) {
    console.error('Booking API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

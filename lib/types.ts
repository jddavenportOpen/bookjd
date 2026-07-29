export interface BookingType {
  id: string;
  name: string;
  slug: string;
  duration_minutes: number;
  price_cents: number;
  description: string | null;
  color: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_type_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  start_time: string;
  end_time: string;
  timezone: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  guest_company: string | null;
  guest_notes: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_paid_cents: number;
  payment_status: 'none' | 'pending' | 'paid' | 'refunded' | 'expired';
  google_calendar_event_id: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  booking_type?: BookingType;
}

export interface AvailabilityOverride {
  id: string;
  date: string;
  available: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
}

export interface TimeSlot {
  time: string; // ISO string in UTC
  display: string; // formatted in visitor's tz
}

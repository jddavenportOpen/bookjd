-- BookJD Database Schema

CREATE TABLE IF NOT EXISTS booking_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  duration_minutes INT NOT NULL,
  price_cents INT NOT NULL DEFAULT 0,
  description TEXT,
  color TEXT,
  active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_type_id UUID REFERENCES booking_types(id),
  status TEXT NOT NULL DEFAULT 'pending',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  guest_company TEXT,
  guest_notes TEXT,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  amount_paid_cents INT DEFAULT 0,
  payment_status TEXT DEFAULT 'none',
  google_calendar_event_id TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  available BOOLEAN DEFAULT false,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_start ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(guest_email);
CREATE INDEX IF NOT EXISTS idx_overrides_date ON availability_overrides(date);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active booking types" ON booking_types;
CREATE POLICY "Anyone can view active booking types"
  ON booking_types FOR SELECT USING (active = true);

-- Seed data
INSERT INTO booking_types (name, slug, duration_minutes, price_cents, description, color, sort_order) VALUES
  ('Quick Intro', 'intro', 15, 0, 'Free 15-minute introductory call. Let''s see if we''re a good fit.', '#00BCD4', 1),
  ('Consultation', 'consultation', 30, 7500, '30-minute focused consultation on your specific challenge.', '#7C4DFF', 2),
  ('Deep Dive', 'deep-dive', 60, 15000, '60-minute in-depth strategy session with action items.', '#FF6B35', 3)
ON CONFLICT (slug) DO NOTHING;

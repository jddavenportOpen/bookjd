import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAvailableSlots } from '@/lib/availability';
import { BookingType } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const slug = searchParams.get('slug');
  const tz = searchParams.get('tz') || 'America/Denver';

  if (!date || !slug) {
    return NextResponse.json({ error: 'Missing date or slug' }, { status: 400 });
  }

  const { data } = await supabaseAdmin
    .from('booking_types')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single();

  if (!data) {
    return NextResponse.json({ error: 'Booking type not found' }, { status: 404 });
  }

  const slots = await getAvailableSlots(date, data as BookingType, tz);
  return NextResponse.json({ slots });
}

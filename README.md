# BookJD

A self-hosted booking app. Your own Calendly, minus the SaaS bill and the black box.

Live at [book.jddavenport.com](https://book.jddavenport.com).

Someone picks a session type, sees only the times you're actually free, books it, pays if it's a paid session, and both calendars update. You own every piece of it: the availability logic, the payment flow, the email, the data.

Built with Next.js, Supabase, Google Calendar, and Stripe.

## How it works, end to end

1. **Pick a session type.** Types live in the database, free or paid, any duration. A free intro, a paid strategy call, whatever you define.
2. **See real availability.** The availability engine reads your Google Calendar for busy periods, cross-checks bookings already in the database, applies your working hours, buffers, minimum notice, and timezone, then returns only the open slots, converted to the visitor's timezone.
3. **Book it.** The guest picks a slot and enters their details. A booking row is written immediately.
4. **Pay, if it's paid.** Free sessions confirm on the spot. Paid sessions hand off to Stripe Checkout and confirm nothing until the payment webhook comes back.
5. **Everything fires on confirm.** A real event is created on your Google Calendar with the guest as an attendee, confirmation emails go to the guest and to you, and the booking is marked confirmed.
6. **Reminders and self-service.** A cron job sends reminders before the meeting. Guests get their own links to reschedule or cancel, no back-and-forth.
7. **Optional webhook.** Set `BOOKING_WEBHOOK_URL` and every confirm, cancel and reschedule POSTs a JSON event there, so another system (mine is my agent setup) can react to it.

## Stack

| Piece | What it does |
|---|---|
| Next.js (App Router) on Vercel | App + API routes |
| Supabase (Postgres) | Bookings + session types |
| Google Calendar API | Availability (free/busy) and invites |
| Stripe | Checkout + webhooks for paid sessions |
| Resend | Transactional confirmation + reminder email |
| Vercel Cron | Pre-meeting reminders |

## Getting started

```bash
git clone https://github.com/jddavenportOpen/bookjd.git
cd bookjd
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

Open http://localhost:3000/book.

Stripe and Resend are optional in development: leave their keys unset and paid types confirm like free ones while emails print to the console. Supabase and Google Calendar are required.

### Database

The schema lives in [`lib/setup-db.sql`](lib/setup-db.sql). Run it against your Supabase project, then add your session types to the `booking_types` table.

### Availability rules

Your hours, weekdays, buffers, minimum notice, and slot interval are in [`lib/availability-config.ts`](lib/availability-config.ts). Edit that one file to change when people can book you.

### Make it yours

- `lib/availability-config.ts`: your hours and timezone
- `lib/email.ts`: email copy (`EMAIL_FROM` and `HOST_EMAIL` come from env)
- `app/globals.css`: theme colors
- `app/layout.tsx`: header + branding

## Deploy

Push to a Vercel project, set the same env vars in the dashboard, and point your Stripe webhook at `/api/stripe/webhook`. The reminder cron is configured in [`vercel.json`](vercel.json).

Set `CRON_SECRET` in Vercel and the reminder route only answers Vercel Cron.

## License

MIT. See [LICENSE](LICENSE).

---

Built in public by [JD Davenport](https://jddavenport.com). This is the actual code behind my booking page, cleaned up so you can run your own.

Most of this code was written by Claude Code agents I run. I pick what gets built and check it by using it. It has no automated tests yet. Every variable is listed and commented in [`.env.example`](.env.example).

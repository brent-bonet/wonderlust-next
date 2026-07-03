# Wonderlust Next — Project Spec

Build a Next.js 16 app called `wonderlust-next` — a full-stack salon management and booking platform used as a portfolio demo for Wonderlust Salon in Denver's RiNo neighborhood.

## Tech Stack

- Next.js 16 (App Router, current stable as of mid-2026 — do not use Next.js 15, it's on its way to end-of-support)
- TypeScript
- Tailwind CSS
- Supabase (auth, database, real-time)
- Stripe (prepayment and deposits)
- Resend (confirmation emails)
- Anthropic SDK (server-side chatbot via API route)

### Notes on Next.js 16 specifics

- Turbopack is the default bundler for both `dev` and `build` — no config needed to enable it
- Use `proxy.ts` instead of `middleware.ts` for any routing/auth interception (renamed in 16)
- Adopt Cache Components' explicit caching model — don't rely on implicit fetch caching the way Next.js 15 did; be explicit about what's cached and for how long, especially for the admin panel's live booking data
- Requires Node.js 20+
- Some `next/image` props were removed in 16: no `priority` as a boolean prop the old way, no `onLoadingComplete`, `lazyBoundary`, or `lazyRoot` — check current docs for the replacement patterns before using them
- `next lint` was removed — use ESLint directly if linting is needed

## CRITICAL — Design Fidelity Requirement

The file at `/reference/index.html` is not inspiration — it is the exact design spec. Read the full file first, including its `<style>` block, before writing any component. Extract the literal CSS custom properties, font imports, and spacing values and reuse them exactly. Do not substitute fonts, do not adjust the color palette, do not "improve" the typography scale. If something in the reference looks unconventional, keep it anyway — it was chosen deliberately.

Do not use Tailwind's default color palette, font stack, or spacing scale unless it happens to exactly match the reference values. Configure `tailwind.config.ts` with the reference site's exact values as custom theme extensions:

```js
colors: {
  bg: '#f7f4f0',
  surface: '#eeeae4',
  border: '#d6cfc5',
  rose: '#9e6b5e',
  'rose-light': '#c9a99a',
  'rose-muted': '#b8887a',
  text: '#1e1b18',
  'text-muted': '#5c5048',
  'text-dim': '#9a8e84',
}
```

Fonts: Cormorant Garamond (weights 300, 400, 600, italic) for display text, Inter (weights 300, 400, 500) for body text. Import via `next/font/google` using these exact family names — do not substitute similar-looking fonts.

### Design elements to replicate exactly, pulled from the reference file

- Fixed nav: logo left, links center, phone right, blurred translucent background
- Split hero: text left, full-height sticky image right (`position: sticky; top: 0; height: 100vh`)
- Section labels: small uppercase, letter-spacing 0.22em, rose color
- Hairline dividers between sections (`border-top: 1px solid var(--border)`)
- Services in a 2×2 grid of bordered blocks, prices right-aligned in rose
- Hours as single-column stacked rows
- Contact as label/value row pairs
- Footer with surface background
- Chat bubble fixed bottom-right, slide-up panel with the same transition timing (`0.25s ease`)
- Image hover: `scale(1.03)` over `0.5s`
- Color transitions: `0.2s`

**After building the home page, do a self-check:** open both the reference file and your new component side by side and confirm every color hex value, font family, and spacing value matches exactly. List any place you deviated and why.

## Public-Facing Pages

**`/`** — Hero, gallery, team, services, hours, contact. All content pulled from Supabase, nothing hardcoded. Matches the static site layout exactly.

**`/book`** — Custom booking flow:
1. Pick service
2. Pick stylist
3. Pick available date and time slot
4. Enter name, email, phone
5. Stripe prepayment — deposit or full amount depending on service configuration
6. Confirmation screen + email via Resend

Chatbot widget on every page, powered by `/api/chat` route using the Anthropic SDK. API key is server-side only, never exposed to the client.

## Admin Panel (`/admin`, protected by Supabase Auth)

- `/admin/login` — Email/password login for salon owner
- `/admin/services` — Add, edit, remove services. Fields: name, description, price, deposit amount, duration in minutes, active/inactive toggle
- `/admin/stylists` — Add, edit, remove stylists. Fields: name, bio, photo upload, active/inactive toggle
- `/admin/availability` — Set working hours per stylist per day of week. Block specific dates off.
- `/admin/hours` — Business hours displayed on the public site. Edit per day, mark closed.
- `/admin/bookings` — View all bookings. Filter by upcoming/past/cancelled. Cancel or reschedule. Show payment status.

## Supabase Schema

Scaffold all of these tables:

```sql
services (id, name, description, price, deposit_amount, duration_minutes, full_prepayment, active, created_at)
stylists (id, name, bio, photo_url, active, created_at)
availability (id, stylist_id, day_of_week, start_time, end_time, active)
blocked_dates (id, stylist_id, date, reason)
business_hours (id, day_of_week, opens, closes, closed)
bookings (id, service_id, stylist_id, client_name, client_email, client_phone, appointment_date, appointment_time, status, payment_status, stripe_payment_intent_id, deposit_paid, total_paid, created_at)
payments (id, booking_id, stripe_payment_intent_id, amount, type, status, created_at)
```

## Stripe

- Each service has a configurable deposit amount and a `full_prepayment` boolean
- At booking, charge either the deposit or full amount via Stripe Payment Intent
- Webhook handler at `/api/webhooks/stripe` confirms payment and updates booking status in Supabase
- Card saved for remainder collection at appointment (if deposit only)

## Resend

- Confirmation email to client on successful booking with appointment details
- Reminder email 24 hours before appointment (use a cron route or Supabase scheduled function)

## Chatbot

System prompt gives the bot full knowledge of services, pricing, team, hours, and booking flow. It directs users to `/book` for availability. It does not have access to live availability data. API key lives only in server environment variables, called via `/api/chat` POST route with streaming.

## Seed Data

Populate Supabase with Wonderlust Salon's real services and pricing as demo data so the app looks real from day one:

**Services:**
- Women's Cut — $60
- Men's Cut — $40
- Kids' Cut — $25
- All Over Color — $70
- Partial Highlight — $100
- Full Highlight — $120
- Balayage — $100
- Toner — $20
- Blow Out — $40
- Updo — $60
- Bridal Styling — $90
- Brazilian Blowout — $150
- Perm — $125
- Extensions — consult
- Facial Waxing — $15

**Stylist:** Lindsey Kubla — Owner & Master Stylist

**Business hours:** Tuesday–Saturday 9am–8pm, closed Sunday and Monday

## Project Structure

Scaffold the full directory structure first, then install all dependencies, then set up the Supabase client and run the schema, then build in this order:

1. Public home page `/` matching the static site design
2. `/book` booking flow
3. `/api/chat` chatbot route
4. `/admin` panel pages
5. `/api/webhooks/stripe` handler
6. Seed script

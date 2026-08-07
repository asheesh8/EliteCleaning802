# Elite Cleaning 802

Marketing website + private CRM for Laura and Lisa's cleaning business in
Rutland County, Vermont.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 · Prisma 7 ·
SQLite · TypeScript. No UI framework dependency — the component kit and
icon set are local, so nothing breaks on someone else's release schedule.

---

## Running it

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Website at `http://localhost:3000`, workspace at `/crew`.

**Sign in:** `laura@elitecleaning802.com` or `lisa@elitecleaning802.com`
— password `elite802`. Change these before this goes anywhere near
production.

---

## The two things that make this more than a website

### Estimated time

Every service carries its own time formula:

```
minutes = base
        + (sqFt / 1000) × minutesPer1kSqFt
        + bedrooms × minutesPerBedroom
        + bathrooms × minutesPerBathroom
        → × condition multiplier (1–5)
        → × frequency multiplier (weekly cleans get faster)
        → × first-visit premium
        + setup & supplies
        ÷ crew size (with coordination overhead)
```

One function — `src/lib/estimate.ts` — powers all three places a number
appears: the public estimator, the job editor, and the estimator
sandbox. They cannot disagree.

Every estimate returns its own **breakdown**, so any number on screen
can be expanded into the line items behind it.

Jobs store the estimate *and* the actual clocked time. `/crew/reports`
turns that into per-service accuracy and tells the owners exactly which
base times to adjust. The system gets more accurate the longer it's used.

### Travel

Drive time is the hidden cost in this trade: two jobs that bill the same
earn very differently once you count the 40 minutes between them.

`src/lib/travel.ts` turns a day's jobs into an ordered route with
per-leg drive time, mileage, and cost. The dashboard and `/crew/travel`
render the day as **alternating drive and work blocks**, so an
over-packed day is visible before it's booked.

Also included: a nearest-neighbour route suggestion (offered as advice,
since real bookings have client time windows), a weekly mileage log for
reimbursement and taxes, and a warning when driving exceeds 30% of the
day.

Distances use the haversine formula against stored client coordinates,
scaled by a road-winding factor — dependency-free and works offline.
`estimateLeg()` is the single seam for swapping in Google Distance
Matrix or Mapbox later.

---

## Structure

```
src/
  app/
    (site)/          public website
    crew/            the CRM — noindex, session-gated
  components/
    site/            public components
    crm/             workspace components
    ui/              shared primitives + local icon set
  lib/
    estimate.ts      ← time engine
    travel.ts        ← route engine
    auth.ts          scrypt + server-side sessions
prisma/
  schema.prisma      swap `sqlite` → `postgresql` to deploy; no model changes
scripts/
  import-gallery.ts  bulk photo import
photos-inbox/        drop photos here, then `npm run gallery:import`
```

---

## Photos

Facebook keeps page photos behind a login, so they can't be pulled in
automatically. Two ways in, both landing photos **unpublished** so
nothing goes live until approved at `/crew/gallery`:

**Bulk:** drop files into `photos-inbox/` and run

```bash
npm run gallery:import
```

Filenames become titles; anything containing `before` or `after` is
filed under Before / After automatically.

**One at a time:** drag onto the uploader at `/crew/gallery`.

---

## Branding

The client has two Facebook pages under similar names. Both real logos
ship in `public/brand/`:

| | Page | Mark |
|---|---|---|
| **Current** | Elite Cleaning 802 (Rutland) | plum `#4e2f72` / cream — `logo.jpg` |
| Alternate | Elite Cleaning LLC (Burlington) | navy / gold Rosie — `logo-alt.jpg` |

The whole palette is sampled from the plum mark. To switch identity,
edit `src/lib/brand.ts` and swap the two files. Contact details and
home-page copy are overridden at runtime from `/crew/settings` — no
deploy needed.

---

## Before launch

- [ ] Change both owner passwords
- [ ] Set the real phone and email in `/crew/settings`
- [ ] Replace the four placeholder reviews at `/crew/reviews` with real
      Facebook recommendations (they're written to match the page's tone,
      but they are not real quotes)
- [ ] Import real photos
- [ ] Confirm the mileage rate and average speed in `/crew/settings`
- [ ] Set a real `SESSION_SECRET` in `.env`
- [ ] Clear the sample clients and jobs

## Deploying

Switch `datasource db { provider }` in `prisma/schema.prisma` to
`postgresql`, point `DATABASE_URL` at the database, and swap the adapter
in `src/lib/db.ts`. No model changes are needed — nothing SQLite-specific
is used.

Note that gallery uploads write to `public/gallery`, which does not
survive on ephemeral filesystems (Vercel). Move uploads to object
storage before deploying there; `src/app/crew/(app)/gallery/actions.ts`
is the only file that writes images.

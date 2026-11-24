# OpenHouse

OpenHouse is a demo for the **Home Showing Schedule Application** challenge. Sellers list homes and set showing times. Buyers enter their availability and book a showing that fits their schedule.

## Run locally

You’ll need Node.js 20.19 or later and npm. The app uses a local SQLite database and requires no credentials.

```sh
npm ci
npm run db:setup
npm run dev
```

Open [OpenHouse locally](http://127.0.0.1:3000). On a fresh database, setup applies the migration and adds two sample homes with showings over the next two days. Running setup again preserves existing listings and bookings. If the sample times have expired, add new ones in the seller dashboard.

```sh
npm test
npm run typecheck
npm run build
```

To run the production build locally, use `npm start` after applying the database migration.

## Try the app

1. Open **Seller dashboard** and sign in with the demo account. Publish a listing with bedrooms, bathrooms, area in square meters, and up to four photos. Add a future showing time.
2. On the home page, select **Find showings** and search for a range that includes the full 30-minute showing.
3. Browse the property's photos and select **Choose a showing**. Pick a time in the dialog, enter a sample name, mobile number, and email, and select **Book showing**.
4. Check **Recent bookings** in the seller dashboard for the property, showing time, and contact details. The dashboard refreshes every 15 seconds while visible and also has a **Refresh bookings** button. The agenda marks the time **Booked**, and a fresh buyer search excludes it.
5. Save the private confirmation link. Use it to reschedule to another open time for the same property, cancel an upcoming showing, or download its calendar event. After rescheduling, download a fresh calendar file if you imported the earlier time.

## Project structure

| Path | Responsibility |
| --- | --- |
| `app/` | Next.js App Router pages, forms, and navigation |
| `features/showings/` | Server actions, validation, availability queries, date handling, and booking |
| `features/seller/` | Demo sign-in, sign-out, and seller session checks |
| `lib/db.ts` | Shared Prisma client |
| `prisma/` | Database schema, SQL migration, and demo data |
| `tests/` | Tests for date parsing, availability boundaries, and concurrent bookings in SQLite |

## Design decisions

- **One application and a local database.** Next.js renders the interface and runs the server actions. Prisma stores data in `prisma/local.db`. The data model uses `Listing`, `ShowingSlot`, and `Booking`.
- **Consistent scheduling.** The interface uses `America/Guatemala` and prices use Guatemalan quetzales (GTQ). Each showing lasts 30 minutes and starts on the hour or half hour, which prevents showing times from overlapping within a listing. The buyer’s availability must cover the whole showing.
- **One booking per showing.** A unique constraint on `Booking.slotId` ensures that only one of two competing requests can book the same showing. The server gives the other buyer a message prompting them to search again.
- **Booking changes.** The confirmation URL is a private bearer link. A successful move releases the original time and claims the new time in one database update. A conflicting move preserves the original booking. Cancellation removes the active reservation and releases the time.
- **Buyer access.** My showings lists bookings saved in the current browser. New bookings are saved automatically. To add an older booking or use another device, open the private confirmation link and select **Save to My showings**.
- **Seller schedule.** Publish up to five times in one submission. If any time is already on the schedule, the batch is rejected. Only future unbooked times can be closed. **Upcoming showings** displays the next ten reservations in chronological order.
- **Seller cancellations.** Cancel a future booking from its listing schedule to close the time. The buyer’s private confirmation shows the seller cancellation and disables calendar downloads. Previously imported events must be updated or removed in the calendar.
- **Property photos.** The seller can upload up to four JPEG, PNG, or WebP files of up to 2 MB each. The app stores photos in SQLite and serves them through `/photos/[id]`.
- **Demo imagery.** The two sample listings include AI-generated photos of fictional homes.
- **Seller notifications.** Recent bookings appear in the dashboard. Email and SMS delivery would require a configured messaging provider.
- **Seller overview.** The dashboard shows published listings, upcoming booked and open times, and the booking rate for today plus the next six calendar days in Guatemala. The rate is booked times divided by all upcoming times in that period. Listings with no remaining open times appear first so the seller can add availability.
- **Demo access.** The catalog is public. The seller dashboard and seller actions require an eight-hour demo session. The shared credentials are `seller` / `OpenHouse123!` and are shown on the sign-in page. Use fictional contact details. A multi-user deployment would require individual accounts and listing ownership checks.

## Five-minute demo

| Time | What to show |
| --- | --- |
| 0:00–0:35 | Start on the home page and introduce the buyer and seller flows. |
| 0:35–1:35 | Sign in as the demo seller, publish a listing, and add a future showing time. |
| 1:35–2:40 | Find the listing by availability, browse the photo carousel, and open the booking dialog for the same time in two tabs. Book from the first tab. |
| 2:40–3:35 | Submit the second booking and show the conflict message. Then open **Recent bookings** in the seller dashboard and show the contact details and **Booked** status. |
| 3:35–5:00 | Explain the data model, availability filter, and unique constraint. Show how to run and test the project. |

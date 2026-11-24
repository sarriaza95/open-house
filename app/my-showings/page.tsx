import type { Metadata } from "next";
import Link from "next/link";
import { db } from "../../lib/db";
import { buyerBookingIds } from "../../features/showings/buyer-bookings";
import { formatSlot } from "../../features/showings/time.mjs";
import { Navigation } from "../navigation";

export const metadata: Metadata = { title: "My showings", robots: { index: false } };

export default async function MyShowingsPage() {
  const ids = await buyerBookingIds();
  const bookings = ids.length ? await db.booking.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      canceledBySellerAt: true,
      slot: { select: { startAt: true, listing: { select: { title: true, location: true } } } },
    },
    orderBy: { slot: { startAt: "asc" } },
  }) : [];
  const now = new Date();
  const upcoming = (booking: typeof bookings[number]) => !booking.canceledBySellerAt && booking.slot.startAt > now;
  const groups = [
    { title: "Upcoming showings", bookings: bookings.filter(upcoming) },
    { title: "Past and canceled showings", bookings: bookings.filter((booking) => !upcoming(booking)).reverse() },
  ];

  return (
    <>
      <Navigation active="my-showings" />
      <main className="shell main">
        <section className="hero">
          <h1>My showings</h1>
          <p>Find and manage the visits saved in this browser.</p>
        </section>
        {bookings.length === 0 && (
          <section className="panel empty">
            <h2>No saved showings</h2>
            <p>New bookings appear here automatically. To save an earlier booking, open its private confirmation link and select <strong>Save to My showings</strong>.</p>
            <Link className="cta" href="/showings">Find showings</Link>
          </section>
        )}
        {groups.filter((group) => group.bookings.length > 0).map((group) => (
          <section className="saved-showings" key={group.title}>
            <h2>{group.title}</h2>
            {group.bookings.map(({ id, canceledBySellerAt, slot }) => (
              <article className="panel saved-showing" key={id}>
                <div>
                  <p className="location">{slot.listing.location}</p>
                  <h3>{slot.listing.title}</h3>
                  <p>{formatSlot(slot.startAt)} · Guatemala time</p>
                </div>
                <div className="saved-showing-actions">
                  <span className="tag">{canceledBySellerAt ? "Canceled by seller" : slot.startAt > now ? "Confirmed" : "Past showing"}</span>
                  <Link className="cta" href={`/confirmation/${id}`}>View showing</Link>
                </div>
              </article>
            ))}
          </section>
        ))}
      </main>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatSlot } from "../../../features/showings/time.mjs";
import { db } from "../../../lib/db";
import { Navigation } from "../../navigation";
import { ActionForm } from "../../action-form";
import { cancelShowing, rescheduleShowing, saveShowing } from "../../../features/showings/actions";
import { buyerBookingIds } from "../../../features/showings/buyer-bookings";

export const metadata: Metadata = { title: "Showing confirmed", robots: { index: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await db.booking.findUnique({
    where: { id },
    select: { slotId: true, canceledBySellerAt: true, slot: { select: {
      startAt: true,
      listing: { select: { id: true, title: true, location: true } },
    } } },
  });
  if (!booking) notFound();
  const saved = (await buyerBookingIds()).includes(id);
  const now = new Date();
  const canceled = Boolean(booking.canceledBySellerAt);
  const upcoming = !canceled && booking.slot.startAt > now;
  const alternatives = upcoming ? await db.showingSlot.findMany({
    where: { listingId: booking.slot.listing.id, startAt: { gt: now }, booking: { is: null } },
    orderBy: { startAt: "asc" },
    select: { id: true, startAt: true },
  }) : [];

  return (
    <>
      <Navigation active="buyer" />
      <main className="shell main">
        <section className="hero">
          <h1>{canceled ? "Canceled by seller" : upcoming ? "Showing confirmed" : "Past showing"}</h1>
          {upcoming && <p>Keep this private link to manage your booking from another device.</p>}
          {canceled && <p>The seller closed this time. If you added the visit to a calendar, remove the event there too.</p>}
        </section>
        <section className="panel confirmation">
          <p className="location">{booking.slot.listing.location}</p>
          <h2>{booking.slot.listing.title}</h2>
          <p>{formatSlot(booking.slot.startAt)} · Guatemala time</p>
          <div className="confirmation-links">
            {upcoming && <a href={`/confirmation/${id}/calendar`}>Download calendar event</a>}
            <Link href="/showings">Back to showing search</Link>
          </div>
          {saved ? <Link href="/my-showings">View My showings</Link> : (
            <form className="save-showing" action={saveShowing}>
              <input type="hidden" name="id" value={id} />
              <button className="secondary">Save to My showings</button>
            </form>
          )}
          {upcoming && (
            <details className="calendar-help">
              <summary>How to add this to Google Calendar</summary>
              <ol>
                <li>Download the .ics file above.</li>
                <li>On a computer, open Google Calendar and go to <strong>Settings → Import &amp; export</strong>.</li>
                <li>Select the downloaded file, choose a calendar, and click <strong>Import</strong>.</li>
              </ol>
              <p className="muted">If the showing changes, remove the old calendar event before importing the updated file.</p>
              <a href="https://support.google.com/calendar/answer/37118?hl=en">Google Calendar import help</a>
            </details>
          )}
        </section>
        {upcoming && <section className="booking-management" aria-label="Manage showing">
          <details className="panel">
            <summary>Reschedule showing<span aria-hidden="true">+</span></summary>
            {alternatives.length ? (
              <ActionForm action={rescheduleShowing} button="Confirm new time" pending="Rescheduling…">
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="currentSlotId" value={booking.slotId} />
                <label>New showing time
                  <select name="targetSlotId" required>
                    {alternatives.map((slot) => <option key={slot.id} value={slot.id}>{formatSlot(slot.startAt)}</option>)}
                  </select>
                </label>
              </ActionForm>
            ) : <p className="management-empty muted">There are no other open times for this property.</p>}
          </details>
          <details className="panel">
            <summary>Cancel showing<span aria-hidden="true">+</span></summary>
            <ActionForm action={cancelShowing} button="Cancel showing" pending="Canceling…">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="currentSlotId" value={booking.slotId} />
              <label className="confirm-check"><input type="checkbox" name="confirm" required /> Release this time and cancel my booking.</label>
            </ActionForm>
          </details>
        </section>}
      </main>
    </>
  );
}

import type { Metadata } from "next";
import { cancelSellerShowing, closeShowingTime, createListing, createSlot } from "../../features/showings/actions";
import { recentBookings, sellerListings, upcomingBookings } from "../../features/showings/queries";
import { formatSlot } from "../../features/showings/time.mjs";
import { ActionForm } from "../action-form";
import { Navigation } from "../navigation";
import { BookingRefresh } from "./booking-refresh";
import { requireSellerSession } from "../../features/seller/session";
import { signOut } from "../../features/seller/actions";
import { Overview } from "./overview";

export const metadata: Metadata = { title: "Seller dashboard" };
export const dynamic = "force-dynamic";

export default async function SellerPage() {
  await requireSellerSession();
  const [listings, bookings, upcoming] = await Promise.all([sellerListings(), recentBookings(), upcomingBookings()]);
  const now = new Date();

  return (
    <>
      <Navigation active="seller" />
      <main className="shell main admin-main">
        <section className="seller-hero admin-header">
          <div>
            <h1>Seller dashboard</h1>
            <p className="muted">Track visits and manage your property schedules.</p>
          </div>
          <div className="admin-header-actions">
            <a className="cta" href="#publish">Publish listing</a>
            <form action={signOut}><button className="secondary">Sign out</button></form>
          </div>
        </section>
        <nav className="admin-nav" aria-label="Dashboard sections">
          <a href="#overview">Overview</a>
          <a href="#upcoming">Upcoming showings</a>
          <a href="#bookings">Recent bookings</a>
          <a href="#listings">My listings</a>
        </nav>

        <Overview listings={listings} now={now} />

        <section id="upcoming" className="panel bookings" aria-labelledby="upcoming-heading">
          <div className="section-header"><h2 id="upcoming-heading">Upcoming showings</h2></div>
          {upcoming.length === 0 ? <p className="muted">No upcoming bookings.</p> : (
            <ul className="booking-list">
              {upcoming.map(({ id, name, slot }) => (
                <li key={id}>
                  <div><strong>{slot.listing.title}</strong><p className="muted">{name}</p></div>
                  <span>{formatSlot(slot.startAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="bookings" className="panel bookings" aria-labelledby="bookings-heading">
          <div className="section-header">
            <h2 id="bookings-heading">Recent bookings</h2>
            <BookingRefresh />
          </div>
          {bookings.length === 0 && <p className="muted">New bookings will appear here.</p>}
          {bookings.length > 0 && (
            <ul className="booking-list">
              {bookings.map((booking) => (
                <li key={booking.id}>
                  <div><strong>{booking.slot.listing.title}</strong><p className="muted">{formatSlot(booking.slot.startAt)}</p></div>
                  <div>
                    <strong>{booking.name}</strong>
                    {booking.canceledBySellerAt && <p className="muted">Canceled by seller</p>}
                    <p className="booking-contact">{booking.phone && <a href={`tel:${booking.phone}`}>{booking.phone}</a>}
                      <a href={`mailto:${booking.email}`}>{booking.email}</a>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="seller-grid">
          <section id="publish" className="panel publish" aria-labelledby="publish-heading">
            <h2 id="publish-heading">Publish listing</h2>
            <ActionForm action={createListing} button="Publish listing" pending="Publishing…">
              <label>Title<input name="title" required minLength={3} maxLength={90} /></label>
              <label>Location<input name="location" required minLength={3} maxLength={120} /></label>
              <label>Price in GTQ<input name="price" type="number" required min={1} max={100_000_000} step={1} /></label>
              <div className="listing-fields">
                <label>Bedrooms<input name="bedrooms" type="number" required min={0} max={99} /></label>
                <label>Bathrooms<input name="bathrooms" type="number" required min={1} max={99} /></label>
                <label>Area (m²)<input name="areaSqm" type="number" required min={1} max={1_000_000} /></label>
              </div>
              <label>Description<textarea name="description" rows={4} required minLength={10} maxLength={600} /></label>
              <label>Property photos<input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-describedby="photo-help" /></label>
              <small id="photo-help">Up to 4 JPEG, PNG, or WebP photos, 2 MB each.</small>
            </ActionForm>
          </section>

          <section id="listings" aria-labelledby="listings-heading">
            <div className="section-header">
              <h2 id="listings-heading">My listings</h2>
              <span className="muted">{listings.length}</span>
            </div>
            {listings.length === 0 && <p className="panel empty">Publish your first listing to add showing times.</p>}
            <div className="seller-list">
              {listings.map((listing) => (
                <article id={`listing-${listing.id}`} className="panel listing" key={listing.id}>
                  <div className="listing-content">
                    <p className="location">{listing.location}</p>
                    <h3>{listing.title}</h3>
                  </div>
                  <div className="slots">
                    <h4>Showing schedule</h4>
                    {listing.slots.length === 0 && <p className="muted">This listing has no showing times yet.</p>}
                    <ul className="schedule">
                      {listing.slots.map((slot) => (
                        <li key={slot.id}>
                          <span>{formatSlot(slot.startAt)}</span>
                          <span className={slot.booking ? "tag booked" : "tag"}>
                            {slot.booking?.canceledBySellerAt ? "Canceled · Closed" : slot.booking ? "Booked" : slot.startAt <= now ? "Expired" : "Available"}
                          </span>
                          {!slot.booking && slot.startAt > now && (
                            <ActionForm action={closeShowingTime} button="Close time" pending="Closing…">
                              <input type="hidden" name="slotId" value={slot.id} />
                            </ActionForm>
                          )}
                          {slot.booking && !slot.booking.canceledBySellerAt && slot.startAt > now && (
                            <details className="seller-cancel">
                              <summary>Cancel showing</summary>
                              <ActionForm action={cancelSellerShowing} button="Cancel and close time" pending="Canceling…">
                                <input type="hidden" name="id" value={slot.booking.id} />
                                <input type="hidden" name="currentSlotId" value={slot.id} />
                                <label className="confirm-check"><input type="checkbox" name="confirm" required /> Cancel this booking and close its time.</label>
                              </ActionForm>
                            </details>
                          )}
                        </li>
                      ))}
                    </ul>
                    <details>
                      <summary>Add showing times<span aria-hidden="true">+</span></summary>
                      <ActionForm action={createSlot} button="Save showing times" pending="Saving…">
                        <input type="hidden" name="listingId" value={listing.id} />
                        <label>Start date and time<input type="datetime-local" name="startAt" step={1800} required /></label>
                        <details className="extra-times">
                          <summary>Add up to four more times<span aria-hidden="true">+</span></summary>
                          {Array.from({ length: 4 }, (_, index) => (
                            <label key={index}>Additional time {index + 2}<input type="datetime-local" name="startAt" step={1800} /></label>
                          ))}
                        </details>
                        <small>Guatemala time · Choose a start time on the hour or half hour.</small>
                      </ActionForm>
                    </details>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

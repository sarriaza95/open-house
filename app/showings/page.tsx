import type { Metadata } from "next";
import { availableListings } from "../../features/showings/queries";
import { formatSlot, localInput, searchWindow } from "../../features/showings/time.mjs";
import { BookingDialog } from "../booking-dialog";
import { ListingGallery } from "../listing-gallery";
import { Navigation } from "../navigation";

export const metadata: Metadata = { title: "Find showings" };
export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("en-GT", {
  style: "currency", currency: "GTQ", maximumFractionDigits: 0,
});

export default async function BuyerPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[]; to?: string | string[] }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const from = params.from === undefined ? localInput(now) : typeof params.from === "string" ? params.from : "";
  const to = params.to === undefined ? localInput(new Date(now.getTime() + 7 * 86_400_000)) : typeof params.to === "string" ? params.to : "";
  const window = searchWindow(from, to);
  const listings = window ? await availableListings(window) : [];

  return (
    <>
      <Navigation active="buyer" />
      <main className="shell main">
        <section className="hero">
          <h1>Find your next home showing</h1>
          <p>Tell us when you’re free and choose an available time.</p>
        </section>

        <form action="/showings" className="panel search" aria-label="Search by availability">
          <label>From<input name="from" type="datetime-local" defaultValue={from} required /></label>
          <label>To<input name="to" type="datetime-local" defaultValue={to} required /></label>
          <button>Find showings</button>
          <small>Guatemala time · Each showing lasts 30 minutes</small>
        </form>

        <section className="results" aria-labelledby="results-heading">
          <div className="section-header">
            <h2 id="results-heading">Available properties</h2>
            {window && <span className="muted">{listings.length} {listings.length === 1 ? "property" : "properties"}</span>}
          </div>
          {!window && <p className="panel feedback error" role="alert">Enter a valid time range of at least 30 minutes.</p>}
          {window && listings.length === 0 && (
            <div className="panel empty">
              <h3>No showings in this time range</h3>
              <p>Try a wider time range to see more showings.</p>
            </div>
          )}
          <div className="listing-grid">
            {listings.map((listing) => (
              <article className="panel listing" key={listing.id}>
                <ListingGallery title={listing.title} photos={listing.photos} />
                <div className="listing-content">
                  <p className="location">{listing.location}</p>
                  <h3>{listing.title}</h3>
                  <p className="price">{currency.format(listing.price)}</p>
                  {listing.bedrooms !== null && listing.bathrooms !== null && listing.areaSqm !== null && (
                    <ul className="property-specs" aria-label="Property details">
                      <li><strong>{listing.bedrooms}</strong> {listing.bedrooms === 1 ? "bed" : "beds"}</li>
                      <li><strong>{listing.bathrooms}</strong> {listing.bathrooms === 1 ? "bath" : "baths"}</li>
                      <li><strong>{listing.areaSqm.toLocaleString("en")}</strong> m²</li>
                    </ul>
                  )}
                  <p className="description">{listing.description}</p>
                </div>
                <div className="slots card-actions">
                  <span>{listing.slots.length} {listing.slots.length === 1 ? "available time" : "available times"}</span>
                  <BookingDialog title={listing.title} slots={listing.slots.map((slot) => ({
                    id: slot.id, label: formatSlot(slot.startAt),
                  }))} />
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

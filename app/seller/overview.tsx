import { localInput, ZONE } from "../../features/showings/time.mjs";

type Listing = {
  id: string;
  title: string;
  slots: { startAt: Date; booking: { canceledBySellerAt: Date | null } | null }[];
};

const dayFormat = new Intl.DateTimeFormat("en-GT", {
  timeZone: ZONE, weekday: "short",
});
const dateFormat = new Intl.DateTimeFormat("en-GT", {
  timeZone: ZONE, month: "short", day: "numeric",
});

export function Overview({ listings, now }: { listings: Listing[]; now: Date }) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getTime() + index * 86_400_000);
    return { key: localInput(date).slice(0, 10), date, booked: 0, open: 0 };
  });
  const byDate = new Map(days.map((day) => [day.key, day]));
  let totalBooked = 0;
  let totalOpen = 0;

  const coverage = listings.map((listing) => {
    let booked = 0;
    let open = 0;
    for (const slot of listing.slots) {
      if (slot.startAt <= now || slot.booking?.canceledBySellerAt) continue;
      const day = byDate.get(localInput(slot.startAt).slice(0, 10));
      if (!day) continue;
      if (slot.booking) {
        day.booked++;
        booked++;
      } else {
        day.open++;
        open++;
      }
    }
    totalBooked += booked;
    totalOpen += open;
    return { id: listing.id, title: listing.title, booked, open };
  }).sort((a, b) => a.open - b.open || a.title.localeCompare(b.title));

  const capacity = totalBooked + totalOpen;
  const maxDay = Math.max(1, ...days.map(({ booked, open }) => booked + open));
  const maxListing = Math.max(1, ...coverage.map(({ booked, open }) => booked + open));
  const needsTimes = coverage.filter(({ open }) => open === 0).length;
  const metrics = [
    { label: "Published listings", value: listings.length },
    { label: "Booked showings", value: totalBooked },
    { label: "Open time slots", value: totalOpen },
    { label: "Booking rate", value: capacity ? `${Math.round(totalBooked / capacity * 100)}%` : "—" },
  ];

  return (
    <section id="overview" className="admin-overview" aria-labelledby="overview-heading">
      <div className="section-header admin-section-heading">
        <h2 id="overview-heading">Overview</h2>
        <span className="muted">{dateFormat.format(days[0].date)} – {dateFormat.format(days[6].date)} · Guatemala time</span>
      </div>
      <dl className="metric-grid">
        {metrics.map(({ label, value }) => (
          <div className="panel metric" key={label}>
            <dt>{label}</dt><dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="admin-charts">
        <figure className="panel admin-chart" aria-labelledby="capacity-heading">
          <figcaption>
            <h3 id="capacity-heading">Showing capacity</h3>
            <p className="muted">Upcoming booked and open times by day</p>
          </figcaption>
          <div className="chart-legend" aria-hidden="true"><span>Booked</span><span>Open</span></div>
          {capacity === 0 && <p className="chart-empty muted">No upcoming times in this period.</p>}
          <ol className="capacity-bars">
            {days.map(({ key, date, booked, open }) => (
              <li key={key} aria-label={`${dateFormat.format(date)}: ${booked} booked, ${open} open`}>
                <div className="capacity-track" aria-hidden="true">
                  <span>{booked + open}</span>
                  <div className="capacity-stack">
                    <i className="capacity-booked" style={{ height: `${booked / maxDay * 100}%` }} />
                    <i className="capacity-open" style={{ height: `${open / maxDay * 100}%` }} />
                  </div>
                </div>
                <span aria-hidden="true">{dayFormat.format(date)}</span>
              </li>
            ))}
          </ol>
        </figure>
        <section className="panel admin-chart" aria-labelledby="coverage-heading">
          <h3 id="coverage-heading">Availability by listing</h3>
          <p className="muted">
            {coverage.length === 0 ? "Publish a listing to track its availability." :
              needsTimes === 0 ? "Every listing has an open time in this period." :
                `${needsTimes} ${needsTimes === 1 ? "listing has" : "listings have"} no open times in this period.`}
          </p>
          <ul className="coverage-list">
            {coverage.map(({ id, title, booked, open }) => (
              <li key={id}>
                <div><a href={`#listing-${id}`}>{title}</a><span>{booked} booked · {open} open</span></div>
                <div className="coverage-bar" aria-hidden="true">
                  <i className="capacity-booked" style={{ width: `${booked / maxListing * 100}%` }} />
                  <i className="capacity-open" style={{ width: `${open / maxListing * 100}%` }} />
                </div>
                {open === 0 && <a className="coverage-action" href={`#listing-${id}`}>Manage times</a>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}

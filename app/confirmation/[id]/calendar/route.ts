import { db } from "../../../../lib/db";
import { createHash } from "node:crypto";
import { formatSlot, SLOT_MS } from "../../../../features/showings/time.mjs";

function stamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/[;,]/g, "\\$&");
}

function fold(line: string) {
  let text = "";
  let bytes = 0;
  for (const character of line) {
    const size = Buffer.byteLength(character);
    if (bytes + size > 75) {
      text += "\r\n ";
      bytes = 1;
    }
    text += character;
    bytes += size;
  }
  return text;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await db.booking.findUnique({
    where: { id },
    select: {
      canceledBySellerAt: true,
      slot: { select: { startAt: true, listing: { select: {
        title: true, location: true, description: true, bedrooms: true, bathrooms: true, areaSqm: true,
      } } } },
    },
  });
  if (!booking || booking.canceledBySellerAt || booking.slot.startAt <= new Date()) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }
  const { startAt, listing } = booking.slot;
  const uid = createHash("sha256").update(id).digest("hex");
  const details = [
    listing.bedrooms === null ? null : `${listing.bedrooms} ${listing.bedrooms === 1 ? "bedroom" : "bedrooms"}`,
    listing.bathrooms === null ? null : `${listing.bathrooms} ${listing.bathrooms === 1 ? "bathroom" : "bathrooms"}`,
    listing.areaSqm === null ? null : `${listing.areaSqm} m²`,
  ].filter(Boolean).join(" · ");
  const description = [
    `Confirmed property showing: ${listing.title}`,
    `Showing time: ${formatSlot(startAt)} (Guatemala time, 30 minutes)`,
    details ? `Property details: ${details}` : null,
    listing.description,
    "To reschedule or cancel, open your private OpenHouse confirmation link. Update your calendar separately if the booking changes.",
  ].filter(Boolean).join("\n\n");
  const event = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//OpenHouse//Showings//EN", "BEGIN:VEVENT",
    `UID:${uid}@openhouse.local`, `DTSTAMP:${stamp(new Date())}`, "STATUS:CONFIRMED",
    `DTSTART:${stamp(startAt)}`, `DTEND:${stamp(new Date(startAt.getTime() + SLOT_MS))}`,
    `SUMMARY:${escapeText(`Showing: ${listing.title}`)}`, `LOCATION:${escapeText(listing.location)}`,
    `DESCRIPTION:${escapeText(description)}`,
    "END:VEVENT", "END:VCALENDAR", "",
  ].map(fold).join("\r\n");

  return new Response(event, { headers: {
    "Content-Type": "text/calendar; charset=utf-8",
    "Content-Disposition": 'attachment; filename="openhouse-showing.ics"',
    "Cache-Control": "private, no-store",
  } });
}

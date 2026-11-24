import { db } from "../../lib/db";

export function availableListings(window: { start: Date; lastStart: Date }) {
  const range = {
    startAt: { gte: window.start, lte: window.lastStart, gt: new Date() },
    booking: { is: null },
  };

  return db.listing.findMany({
    where: { slots: { some: range } },
    include: {
      slots: { where: range, orderBy: { startAt: "asc" } },
      photos: { select: { id: true }, orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function recentBookings() {
  return db.booking.findMany({
    take: 10,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      canceledBySellerAt: true,
      slot: { select: { startAt: true, listing: { select: { title: true } } } },
    },
  });
}

export function upcomingBookings() {
  return db.booking.findMany({
    where: { canceledBySellerAt: null, slot: { startAt: { gt: new Date() } } },
    take: 10,
    orderBy: [{ slot: { startAt: "asc" } }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      slot: { select: { startAt: true, listing: { select: { title: true } } } },
    },
  });
}

export function sellerListings() {
  return db.listing.findMany({
    include: { slots: { include: { booking: { select: { id: true, canceledBySellerAt: true } } }, orderBy: { startAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}

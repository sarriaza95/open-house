import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

/**
 * @param {import("@prisma/client").PrismaClient} db
 * @param {{slotId: string, name: string, email: string, phone?: string}} booking
 */
export async function reserveSlot(db, booking) {
  const slot = await db.showingSlot.findUnique({
    where: { id: booking.slotId }, select: { startAt: true },
  });
  if (!slot || slot.startAt <= new Date()) return null;

  try {
    return await db.booking.create({ data: { ...booking, id: randomUUID() }, select: { id: true } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2003")) return null;
    throw error;
  }
}

/**
 * @param {import("@prisma/client").PrismaClient} db
 * @param {string} id
 * @param {string} currentSlotId
 * @param {string} targetSlotId
 */
export async function moveBooking(db, id, currentSlotId, targetSlotId) {
  if (currentSlotId === targetSlotId) return false;
  const now = new Date();
  const target = await db.showingSlot.findFirst({
    where: { id: targetSlotId, startAt: { gt: now } },
    select: { listingId: true },
  });
  if (!target) return false;

  try {
    const result = await db.booking.updateMany({
      where: { id, slotId: currentSlotId, canceledBySellerAt: null, slot: { listingId: target.listingId, startAt: { gt: now } } },
      data: { slotId: targetSlotId },
    });
    return result.count === 1;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2003")) return false;
    throw error;
  }
}

/** @param {import("@prisma/client").PrismaClient} db @param {string} id @param {string} slotId */
export async function cancelBooking(db, id, slotId) {
  const result = await db.booking.deleteMany({
    where: { id, slotId, canceledBySellerAt: null, slot: { startAt: { gt: new Date() } } },
  });
  return result.count === 1;
}

/** @param {import("@prisma/client").PrismaClient} db @param {string} id @param {string} slotId */
export async function cancelBookingAsSeller(db, id, slotId) {
  const now = new Date();
  // Keep the booking attached so the unique slot stays closed and the buyer can see its status.
  const result = await db.booking.updateMany({
    where: { id, slotId, canceledBySellerAt: null, slot: { startAt: { gt: now } } },
    data: { canceledBySellerAt: now },
  });
  return result.count === 1;
}

/** @param {import("@prisma/client").PrismaClient} db @param {string} slotId */
export async function closeSlot(db, slotId) {
  const result = await db.showingSlot.deleteMany({
    where: { id: slotId, startAt: { gt: new Date() }, booking: { is: null } },
  });
  return result.count === 1;
}

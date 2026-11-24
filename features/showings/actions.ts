"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "../../lib/db";
import { requireSellerSession } from "../seller/session";
import { rememberBooking } from "./buyer-bookings";
import { cancelBooking, cancelBookingAsSeller, closeSlot, moveBooking, reserveSlot } from "./booking.mjs";
import { listingPhotos } from "./photos";
import { parseLocal } from "./time.mjs";

export type ActionState = { status: "success" | "error"; message: string };

const listingSchema = z.object({
  title: z.string().trim().min(3).max(90),
  location: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(600),
  price: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100_000_000)),
  bedrooms: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(99)),
  bathrooms: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(99)),
  areaSqm: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(1_000_000)),
});

const bookingSchema = z.object({
  slotId: z.string().min(1).max(100),
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  phone: z.string().trim().max(30).regex(/^\+?[\d(). -]+$/)
    .refine((phone) => /^\d{7,15}$/.test(phone.replace(/\D/g, ""))),
});
const identifier = z.string().min(1).max(100);
const bookingChangeSchema = z.object({ id: identifier, currentSlotId: identifier });

function finish(message: string): ActionState {
  revalidatePath("/showings");
  revalidatePath("/seller");
  return { status: "success", message };
}

function invalid(message: string): ActionState {
  return { status: "error", message };
}

export async function createListing(_: ActionState | null, form: FormData): Promise<ActionState> {
  await requireSellerSession();
  const result = listingSchema.safeParse(Object.fromEntries(form));
  if (!result.success) return invalid("Check the listing details and try again.");
  const photos = await listingPhotos(form.getAll("photos"));
  if (!photos) return invalid("Choose up to four JPEG, PNG, or WebP photos, each 2 MB or smaller.");
  await db.listing.create({ data: { ...result.data, photos: { create: photos } } });
  return finish("Listing published. You can now add showing times.");
}

export async function createSlot(_: ActionState | null, form: FormData): Promise<ActionState> {
  await requireSellerSession();
  const listingId = form.get("listingId");
  const starts = form.getAll("startAt").filter(Boolean).map((value) => parseLocal(String(value)));
  const now = new Date();
  if (typeof listingId !== "string" || !listingId || listingId.length > 100 ||
      starts.length < 1 || starts.length > 5 ||
      !starts.every((start): start is Date => !!start && start > now && start.getUTCMinutes() % 30 === 0)) {
    return invalid("Choose up to five future times on the hour or half hour.");
  }
  if (new Set(starts.map((start) => start.getTime())).size !== starts.length) return invalid("Choose different times.");

  try {
    await db.showingSlot.createMany({ data: starts.map((startAt) => ({ listingId, startAt })) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return invalid("At least one time already exists. Review the schedule and try again.");
      if (error.code === "P2003") return invalid("This listing is no longer available.");
    }
    throw error;
  }

  return finish(`${starts.length} ${starts.length === 1 ? "showing time" : "showing times"} added.`);
}

export async function closeShowingTime(_: ActionState | null, form: FormData): Promise<ActionState> {
  await requireSellerSession();
  const slot = identifier.safeParse(form.get("slotId"));
  if (!slot.success || !(await closeSlot(db, slot.data))) {
    return invalid("Only an upcoming, unbooked time can be closed. Refresh the schedule and try again.");
  }
  return finish("Showing time closed.");
}

export async function rescheduleShowing(_: ActionState | null, form: FormData): Promise<ActionState> {
  const result = bookingChangeSchema.extend({ targetSlotId: identifier }).safeParse(Object.fromEntries(form));
  if (!result.success) return invalid("Choose a new showing time.");
  const { id, currentSlotId, targetSlotId } = result.data;
  if (!(await moveBooking(db, id, currentSlotId, targetSlotId))) {
    return invalid("The schedule has changed. This request did not move your booking. Refresh and try again.");
  }
  revalidatePath(`/confirmation/${id}`);
  return finish("Showing rescheduled.");
}

export async function cancelShowing(_: ActionState | null, form: FormData): Promise<ActionState> {
  const result = bookingChangeSchema.safeParse(Object.fromEntries(form));
  if (!result.success || form.get("confirm") !== "on") return invalid("Confirm that you want to cancel.");
  const { id, currentSlotId } = result.data;
  if (!(await cancelBooking(db, id, currentSlotId))) return invalid("This showing cannot be canceled. Refresh to check its current status.");
  finish("Showing canceled.");
  redirect("/confirmation/canceled");
}

export async function cancelSellerShowing(_: ActionState | null, form: FormData): Promise<ActionState> {
  await requireSellerSession();
  const result = bookingChangeSchema.safeParse(Object.fromEntries(form));
  if (!result.success || form.get("confirm") !== "on") return invalid("Confirm that you want to cancel.");
  const { id, currentSlotId } = result.data;
  if (!(await cancelBookingAsSeller(db, id, currentSlotId))) {
    return invalid("This booking changed or the showing has already started. Refresh the schedule.");
  }
  revalidatePath(`/confirmation/${id}`);
  return finish("Showing canceled and time closed.");
}

export async function bookShowing(_: ActionState | null, form: FormData): Promise<ActionState> {
  const result = bookingSchema.safeParse(Object.fromEntries(form));
  if (!result.success) return invalid("Enter your name, a valid mobile number, and a valid email address.");
  const booking = await reserveSlot(db, result.data);
  if (!booking) {
    return invalid("This showing time is no longer available. Refresh your search and choose another.");
  }
  await rememberBooking(booking.id);
  revalidatePath("/showings");
  revalidatePath("/seller");
  redirect(`/confirmation/${booking.id}`);
}

export async function saveShowing(form: FormData) {
  const id = identifier.safeParse(form.get("id"));
  if (id.success) {
    const booking = await db.booking.findUnique({ where: { id: id.data }, select: { id: true } });
    if (booking) await rememberBooking(booking.id);
  }
  redirect("/my-showings");
}

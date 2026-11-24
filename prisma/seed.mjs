import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import { localInput, parseLocal } from "../features/showings/time.mjs";

const db = new PrismaClient();
const examples = [
  {
    id: "demo-jardin",
    title: "House with a garden in Zone 16",
    location: "Cayalá, Guatemala City",
    description: "Three bedrooms, a covered terrace, and a private garden. The living room opens onto the patio.",
    price: 1950000,
    bedrooms: 3,
    bathrooms: 3,
    areaSqm: 228,
    photos: ["garden-exterior", "garden-interior"],
    hours: ["10:00", "10:30", "15:00"],
  },
  {
    id: "demo-apartamento",
    title: "Apartment with a balcony",
    location: "Zone 10, Guatemala City",
    description: "Two bedrooms, two parking spaces, and a balcony with city views.",
    price: 1290000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 112,
    photos: ["balcony-exterior", "balcony-interior"],
    hours: ["11:00", "14:00", "14:30"],
  },
];

try {
  for (const [index, { hours, photos, ...listing }] of examples.entries()) {
    const day = localInput(new Date(Date.now() + (index + 1) * 86_400_000)).slice(0, 10);
    const photoData = await Promise.all(
      photos.map((name) => readFile(new URL(`./demo-assets/${name}.webp`, import.meta.url))),
    );
    const photoOperations = photoData.map((data, position) => db.listingPhoto.upsert({
        where: { listingId_position: { listingId: listing.id, position } },
        update: {},
        create: { listingId: listing.id, position, mimeType: "image/webp", data },
    }));

    await db.$transaction([
      db.listing.upsert({
        where: { id: listing.id },
        update: { bedrooms: listing.bedrooms, bathrooms: listing.bathrooms, areaSqm: listing.areaSqm },
        create: {
          ...listing,
          slots: { create: hours.map((hour) => ({ startAt: parseLocal(`${day}T${hour}`) })) },
        },
      }),
      ...photoOperations,
    ]);
  }
  console.log("Demo data is ready.");
} finally {
  await db.$disconnect();
}

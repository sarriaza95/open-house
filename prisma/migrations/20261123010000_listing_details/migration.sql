ALTER TABLE "Listing" ADD COLUMN "bedrooms" INTEGER;
ALTER TABLE "Listing" ADD COLUMN "bathrooms" INTEGER;
ALTER TABLE "Listing" ADD COLUMN "areaSqm" INTEGER;
ALTER TABLE "Booking" ADD COLUMN "phone" TEXT;

CREATE TABLE "ListingPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BLOB NOT NULL,
    CONSTRAINT "ListingPhoto_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ListingPhoto_listingId_position_key" ON "ListingPhoto"("listingId", "position");

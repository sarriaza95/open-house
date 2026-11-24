CREATE TABLE "SellerSession" (
    "tokenHash" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL
);

CREATE INDEX "SellerSession_expiresAt_idx" ON "SellerSession"("expiresAt");

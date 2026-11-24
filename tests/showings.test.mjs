import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { PrismaClient } from "@prisma/client";
import { cancelBooking, cancelBookingAsSeller, closeSlot, moveBooking, reserveSlot } from "../features/showings/booking.mjs";
import { parseLocal, searchWindow } from "../features/showings/time.mjs";

test("interprets dates in Guatemala and rejects invalid calendar dates", () => {
  assert.equal(parseLocal("2030-01-01T20:30")?.toISOString(), "2030-01-02T02:30:00.000Z");
  assert.equal(parseLocal("2030-02-30T10:00"), null);
  assert.equal(parseLocal("2030-01-01T24:00"), null);
});

test("a showing must fit entirely within the buyer's interval", () => {
  assert.equal(searchWindow("2030-01-01T10:00", "2030-01-01T10:29"), null);
  const window = searchWindow("2030-01-01T10:00", "2030-01-01T10:30");
  assert.equal(window.start.getTime(), window.lastStart.getTime());
  assert.equal(searchWindow("2030-01-01T11:00", "2030-01-01T10:00"), null);
});

test("booking and schedule changes are consistent across concurrent clients", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "casaabierta-test-"));
  const datasourceUrl = `file:${join(dir, "test.db").replaceAll("\\", "/")}`;
  const db = new PrismaClient({ datasourceUrl });
  const secondClient = new PrismaClient({ datasourceUrl });

  try {
    const migrations = new URL("../prisma/migrations/", import.meta.url);
    const entries = await readdir(migrations, { withFileTypes: true });
    for (const entry of entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()) {
      const migration = await readFile(new URL(`${entry}/migration.sql`, migrations), "utf8");
      for (const statement of migration.split(";").map((sql) => sql.trim()).filter(Boolean)) {
        await db.$executeRawUnsafe(statement);
      }
    }

    const listing = await db.listing.create({
      data: {
        title: "Test house", location: "Guatemala", description: "Test listing.", price: 100,
        slots: { create: [1, 2, 3].map((hours) => ({ startAt: new Date(Date.now() + hours * 3_600_000) })) },
      },
      include: { slots: true },
    });
    const [slotId, secondSlotId, targetSlotId] = listing.slots.map((slot) => slot.id);
    const attempts = await Promise.all([
      reserveSlot(db, { slotId, name: "Ana", email: "ana@example.com", phone: "+502 5555 0101" }),
      reserveSlot(secondClient, { slotId, name: "Luis", email: "luis@example.com", phone: "+502 5555 0102" }),
    ]);

    assert.equal(attempts.filter(Boolean).length, 1);
    assert.equal(await db.booking.count({ where: { slotId } }), 1);
    const booking = await db.booking.findUniqueOrThrow({ where: { slotId } });
    assert.equal(booking.phone, booking.name === "Ana" ? "+502 5555 0101" : "+502 5555 0102");
    assert.equal(await reserveSlot(db, { slotId: "missing", name: "Ana", email: "ana@example.com" }), null);

    await t.test("competing moves preserve the losing buyer's original booking", async (moveTest) => {
      const other = await reserveSlot(db, { slotId: secondSlotId, name: "Lee", email: "lee@example.com" });
      assert.ok(other);
      const moves = await Promise.all([
        moveBooking(db, booking.id, slotId, targetSlotId),
        moveBooking(secondClient, other.id, secondSlotId, targetSlotId),
      ]);
      assert.deepEqual(moves.slice().sort(), [false, true]);
      const [winner, loser] = moves[0] ? [booking.id, other.id] : [other.id, booking.id];
      const released = moves[0] ? slotId : secondSlotId;
      const retained = moves[0] ? secondSlotId : slotId;
      assert.equal((await db.booking.findUniqueOrThrow({ where: { id: winner } })).slotId, targetSlotId);
      assert.equal((await db.booking.findUniqueOrThrow({ where: { id: loser } })).slotId, retained);
      assert.equal(await db.booking.findUnique({ where: { slotId: released } }), null);

      await moveTest.test("booked slots cannot be closed and canceled slots can be booked again", async () => {
        assert.equal(await closeSlot(db, targetSlotId), false);
        assert.equal(await cancelBooking(db, winner, released), false);
        assert.equal(await cancelBooking(db, winner, targetSlotId), true);
        const replacement = await reserveSlot(db, { slotId: targetSlotId, name: "Alex", email: "alex@example.com" });
        assert.ok(replacement);
        assert.equal(await cancelBookingAsSeller(db, replacement.id, released), false);
        assert.equal(await cancelBookingAsSeller(db, replacement.id, targetSlotId), true);
        assert.ok((await db.booking.findUniqueOrThrow({ where: { id: replacement.id } })).canceledBySellerAt);
        assert.equal(await cancelBooking(db, replacement.id, targetSlotId), false);
        assert.equal(await moveBooking(db, replacement.id, targetSlotId, released), false);
        assert.equal(await reserveSlot(db, { slotId: targetSlotId, name: "Lee", email: "lee@example.com" }), null);
        assert.equal(await closeSlot(db, released), true);
        assert.equal(await db.showingSlot.findUnique({ where: { id: released } }), null);
      });
    });
  } finally {
    await Promise.all([db.$disconnect(), secondClient.$disconnect()]);
    await rm(dir, { recursive: true, force: true });
  }
});

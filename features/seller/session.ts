import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "../../lib/db";

const COOKIE = "openhouse_seller";
const SESSION_SECONDS = 8 * 60 * 60;
export const demoSeller = { username: "seller", password: "OpenHouse123!" };

function hash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function currentToken() {
  const token = (await cookies()).get(COOKIE)?.value;
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

export async function hasSellerSession() {
  const token = await currentToken();
  if (!token) return false;
  const session = await db.sellerSession.findUnique({ where: { tokenHash: hash(token) } });
  return Boolean(session && session.expiresAt > new Date());
}

export async function requireSellerSession() {
  if (!(await hasSellerSession())) redirect("/seller/login");
}

export async function startSellerSession() {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
  await db.$transaction([
    db.sellerSession.deleteMany({ where: { expiresAt: { lte: new Date() } } }),
    db.sellerSession.create({ data: { tokenHash: hash(token), expiresAt } }),
  ]);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSellerSession() {
  const token = await currentToken();
  if (token) await db.sellerSession.deleteMany({ where: { tokenHash: hash(token) } });
  (await cookies()).delete(COOKIE);
}

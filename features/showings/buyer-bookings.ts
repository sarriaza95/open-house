import { cookies } from "next/headers";

const COOKIE = "openhouse_buyer_bookings";
const LIMIT = 40;
const validId = /^[a-z0-9-]{20,40}$/i;

function readIds(value: string | undefined) {
  return (value ?? "").split(",").filter((id) => validId.test(id)).slice(0, LIMIT);
}

export async function buyerBookingIds() {
  return readIds((await cookies()).get(COOKIE)?.value);
}

export async function rememberBooking(id: string) {
  if (!validId.test(id)) return;
  const jar = await cookies();
  const previous = readIds(jar.get(COOKIE)?.value).filter((saved) => saved !== id);
  jar.set(COOKIE, [id, ...previous].slice(0, LIMIT).join(","), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

import { db } from "../../../lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = await db.listingPhoto.findUnique({ where: { id }, select: { data: true, mimeType: true } });
  if (!photo) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.mimeType,
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

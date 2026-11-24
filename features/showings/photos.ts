const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

function imageType(bytes: Buffer) {
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function listingPhotos(entries: FormDataEntryValue[]) {
  const files = entries.filter((entry): entry is File => typeof entry !== "string" && Boolean(entry.name));
  if (files.length > MAX_PHOTOS || files.some((file) => !file.size || file.size > MAX_PHOTO_BYTES)) return null;

  const photos = [];
  for (const [position, file] of files.entries()) {
    const data = Buffer.from(await file.arrayBuffer());
    const mimeType = imageType(data);
    if (!mimeType) return null;
    photos.push({ position, data, mimeType });
  }
  return photos;
}

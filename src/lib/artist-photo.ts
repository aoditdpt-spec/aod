// Artists' profile photos, the parts that run in the browser and the server alike (no imports, so
// they can be tested on their own: npm run check:links). The photos themselves live on AOD's
// Google Drive (src/server/artist-photos.ts).

// The photo's file name on Drive: the main category's code, the name in capitals, the application
// number: PH_AMANSHAH_APP-231.webp ("PH" from categoryCodes in src/lib/order-id.ts).
export function photoFileName(code: string, name: string, ref: string, type: string) {
  const who = name.toUpperCase().replace(/[^A-Z0-9]/g, "") || "ARTIST";
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  return `${code}_${who}_${ref}.${ext}`;
}

// Where a page shows the photo from. `photo` is the record's value: "<Drive file id>~<version>"
// once it's on AOD's Drive (shown through the private /api/artist-photos route), or a
// "data:image/…" picture still in the browser (the application before it's sent, and the
// preview). "" when there's no photo.
export function artistPhotoSrc(id: string | undefined, photo: string | undefined): string {
  if (!photo) return "";
  if (photo.startsWith("data:image/")) return photo;
  const [file, version] = photo.split("~");
  if (!id || !/^[\w-]{10,}$/.test(file)) return "";
  return `/api/artist-photos/${id}.img${version ? `?v=${version}` : ""}`;
}

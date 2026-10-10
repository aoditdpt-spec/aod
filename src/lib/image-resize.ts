// Shrinks a photo in the browser before it's uploaded: at most `maxSide` pixels on the long side,
// re-encoded as WebP. Portfolio photos straight off a camera are often 8–20 MB; this brings them
// to well under 1 MB with no visible loss on screen, which saves the artist's data and AOD's
// storage. Anything it can't read (HEIC on most browsers, videos) is returned unchanged.
export async function shrinkImage(file: File, maxSide = 2560, quality = 0.85): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp", lastModified: file.lastModified });
  } catch {
    return file;
  }
}

"use client";

// Client-seitige Bild-Kompression fuer Profilbild / Flohmi / etc.
// Nimmt ein File, resized auf max. maxSize x maxSize (Longest-Edge),
// komprimiert als JPEG und gibt eine Base64-Data-URL zurueck.

export interface CompressOptions {
  maxSize?: number; // max Breite oder Hoehe in px
  quality?: number; // 0–1
}

export async function compressImage(
  file: File,
  { maxSize = 1024, quality = 0.85 }: CompressOptions = {}
): Promise<string> {
  // Bild laden
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image decode failed"));
    image.src = dataUrl;
  });

  // Skalieren, so dass die laengste Seite maxSize betraegt
  let { width, height } = img;
  if (width > height) {
    if (width > maxSize) {
      height = Math.round((height * maxSize) / width);
      width = maxSize;
    }
  } else {
    if (height > maxSize) {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context failed");
  ctx.drawImage(img, 0, 0, width, height);

  // Als JPEG (deutlich kleiner als PNG fuer Fotos)
  return canvas.toDataURL("image/jpeg", quality);
}

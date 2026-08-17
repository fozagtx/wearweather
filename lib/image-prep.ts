const MAX_EDGE = 2048;
const JPEG_QUALITY = 0.92;

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("PHOTO_FORMAT_INVALID"));
    image.src = url;
  });
}

export async function preparePhotoFile(file: File) {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowed.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    throw new Error("PHOTO_FORMAT_INVALID");
  }
  if (file.size > 12 * 1024 * 1024) throw new Error("PHOTO_TOO_LARGE");

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("PHOTO_FORMAT_INVALID");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((next) => (next ? resolve(next) : reject(new Error("PHOTO_FORMAT_INVALID"))), "image/jpeg", JPEG_QUALITY);
    });
    const prepared = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
    return prepared;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

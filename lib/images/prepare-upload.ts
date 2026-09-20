const HEIC_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const HEIC_EXTENSIONS = [".heic", ".heif"];

export function isHeicFile(file: File): boolean {
  if (HEIC_TYPES.has(file.type.toLowerCase())) {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  return HEIC_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

export async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });

  const blob = Array.isArray(converted) ? converted[0] : converted;
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";

  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };

    image.src = url;
  });
}

function canvasToFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  mimeType: string,
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not prepare that image."));
          return;
        }

        resolve(
          new File([blob], fileName, {
            type: mimeType,
            lastModified: Date.now(),
          }),
        );
      },
      mimeType,
      0.92,
    );
  });
}

export async function downscaleImageIfNeeded(
  file: File,
  maxEdge = 2000,
): Promise<File> {
  const image = await loadImageFromFile(file);
  const longEdge = Math.max(image.width, image.height);

  if (longEdge <= maxEdge) {
    return file;
  }

  const scale = maxEdge / longEdge;
  const targetWidth = Math.round(image.width * scale);
  const targetHeight = Math.round(image.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare that image.");
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const outputType =
    file.type === "image/png" || file.type === "image/webp"
      ? file.type
      : "image/jpeg";
  const extension =
    outputType === "image/png"
      ? "png"
      : outputType === "image/webp"
        ? "webp"
        : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";

  return canvasToFile(canvas, `${baseName}.${extension}`, outputType);
}

/** Convert HEIC so the crop UI can display the image; no downscale yet. */
export async function prepareImageForCrop(file: File): Promise<File> {
  if (isHeicFile(file)) {
    return convertHeicToJpeg(file);
  }

  return file;
}

export async function prepareImageForUpload(file: File): Promise<File> {
  let prepared = await prepareImageForCrop(file);
  prepared = await downscaleImageIfNeeded(prepared, 2000);
  return prepared;
}

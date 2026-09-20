export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read that image."));
    image.src = src;
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
          reject(new Error("Could not crop that image."));
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

export async function cropImageToFile(
  imageSrc: string,
  pixelCrop: PixelCrop,
  fileName: string,
  mimeType = "image/jpeg",
): Promise<File> {
  const image = await loadImageFromSrc(imageSrc);
  const canvas = document.createElement("canvas");
  const width = Math.max(1, Math.round(pixelCrop.width));
  const height = Math.max(1, Math.round(pixelCrop.height));

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not crop that image.");
  }

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height,
  );

  const extension =
    mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const baseName = fileName.replace(/\.[^.]+$/, "") || "photo";

  return canvasToFile(canvas, `${baseName}.${extension}`, mimeType);
}

import path from "node:path";

export function getUploadsDir(): string {
  const configured = process.env.UPLOADS_DIR?.trim();
  if (configured) {
    return configured;
  }
  return path.join(process.cwd(), "data", "uploads");
}

export function photoStorageDir(
  tenantId: string,
  squishId: string,
): string {
  return path.join(getUploadsDir(), tenantId, squishId);
}

export type { PhotoDerivativeSize } from "./urls";
export { photoDerivativeFilename, photoPublicUrl } from "./urls";

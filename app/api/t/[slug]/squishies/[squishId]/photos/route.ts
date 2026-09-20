import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createSquishPhoto, getSquishById } from "@/lib/dal";
import { generatePhotoDerivatives } from "@/lib/images/derivatives";
import {
  probeImageBuffer,
  UPLOAD_INVALID_IMAGE_MESSAGE,
  UPLOAD_INVALID_TYPE_MESSAGE,
  UPLOAD_TOO_LARGE_MESSAGE,
  validateUploadMimeType,
  validateUploadSize,
} from "@/lib/images/validate-upload";
import { requireTenantMember } from "@/lib/tenant/require-tenant-member";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string; squishId: string }> },
) {
  const { slug, squishId } = await context.params;

  try {
    const { tenant } = await requireTenantMember(slug);
    const squish = await getSquishById(tenant.id, squishId);

    if (!squish) {
      return NextResponse.json({ error: "Squish not found." }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("photo");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Choose a photo to upload." },
        { status: 400 },
      );
    }

    if (!validateUploadMimeType(file.type)) {
      return NextResponse.json(
        { error: UPLOAD_INVALID_TYPE_MESSAGE },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!validateUploadSize(buffer.byteLength)) {
      return NextResponse.json(
        { error: UPLOAD_TOO_LARGE_MESSAGE },
        { status: 400 },
      );
    }

    if (!(await probeImageBuffer(buffer))) {
      return NextResponse.json(
        { error: UPLOAD_INVALID_IMAGE_MESSAGE },
        { status: 400 },
      );
    }

    const photoId = randomUUID();
    const dimensions = await generatePhotoDerivatives({
      tenantId: tenant.id,
      squishId,
      photoId,
      input: buffer,
    });

    const photo = await createSquishPhoto(tenant.id, squishId, {
      id: photoId,
      filename: `${photoId}.webp`,
      width: dimensions.width,
      height: dimensions.height,
    });

    return NextResponse.json({ photo });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Photo didn't upload — try again or pick another file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

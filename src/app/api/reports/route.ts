import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authConfig from "@/lib/auth";
import { uploadImage } from "@/lib/uploads";
import { prepareImageUpload } from "@/lib/imageProcessing";

type IncomingImage = {
  name: string;
  type: string;
  data: string;
};

const MAX_IMAGES = 10;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      cultivarSlug,
      providerSlug,
      lampType,
      tentSize,
      medium,
      washerGenetics,
      ratings,
      summary,
      images = [],
      authorName,
      anonymous,
    } = body ?? {};

    if (
      !title ||
      !cultivarSlug ||
      !providerSlug ||
      !summary
    ) {
      return NextResponse.json(
        { error: "Bitte alle Pflichtfelder ausfüllen." },
        { status: 400 },
      );
    }

    const cultivar = await prisma.cultivar.findUnique({ where: { slug: cultivarSlug } });
    if (!cultivar) {
      return NextResponse.json({ error: "Sorte nicht gefunden." }, { status: 404 });
    }

    const provider = await prisma.provider.findUnique({ where: { slug: providerSlug } });
    if (!provider) {
      return NextResponse.json({ error: "Anbieter nicht gefunden." }, { status: 404 });
    }

    const normalizedLampType =
      typeof lampType === "string" && lampType.trim().length > 0 ? lampType.trim() : "";
    const normalizedTentSize =
      typeof tentSize === "string" && tentSize.trim().length > 0 ? tentSize.trim() : "";
    const normalizedMedium =
      typeof medium === "string" && medium.trim().length > 0 ? medium.trim() : "";
    const washerInput = typeof washerGenetics === "string" ? washerGenetics.trim() : "";
    const washerLower = washerInput.toLowerCase();
    const washerLookup: Record<string, "yes" | "no" | "unknown"> = {
      ja: "yes",
      yes: "yes",
      y: "yes",
      nein: "no",
      no: "no",
      n: "no",
      unbekannt: "unknown",
      unknown: "unknown",
      "?": "unknown",
    };
    const normalizedWasher =
      washerLookup[washerLower] ??
      (washerInput.length > 0 ? (washerInput as string) : "");

    const normalizedImages = Array.isArray(images)
      ? (images as IncomingImage[])
          .slice(0, MAX_IMAGES)
          .filter((img) => typeof img?.data === "string" && img.data.trim().length > 0)
      : [];

    const uploadResults = await Promise.all(
      normalizedImages.map(async (image) => {
        try {
          const buffer = Buffer.from(image.data, "base64");
          const fileName = image.name || `report-${Date.now()}`;
          const contentType =
            image.type && typeof image.type === "string" ? image.type : "image/jpeg";

          const prepared = await prepareImageUpload({
            buffer,
            fileName,
            contentType,
          });

          const result = await uploadImage(prepared);

          return {
            directUrl: result.directUrl,
            previewUrl: result.previewUrl,
            provider: result.provider,
            key: result.key,
            originalFileName: prepared.fileName,
          };
        } catch (error) {
          console.error("[REPORT_UPLOAD]", error);
          return null;
        }
      }),
    );

    const successfulUploads = uploadResults.filter(
      (result): result is NonNullable<typeof result> => Boolean(result?.directUrl),
    );

    const savedImages: string[] = successfulUploads.map((upload) => upload.directUrl);

    const session = await getServerSession(authConfig);
    const anonymousFlag = Boolean(anonymous);
    const trimmedAuthorName = typeof authorName === "string" ? authorName.trim() : "";

    let finalAuthorHandle = trimmedAuthorName;
    let authorRelation: { connect: { id: number } } | undefined;

    if (anonymousFlag) {
      finalAuthorHandle = finalAuthorHandle || "Anonym";
    } else {
      if (!finalAuthorHandle) {
        const sessionHandle =
          ((session?.user as unknown as { username?: string | null })?.username?.trim()) ||
          session?.user?.name ||
          session?.user?.email?.split("@")[0] ||
          "Community";
        finalAuthorHandle = sessionHandle;
      }
      if (session?.user?.id) {
        const userIdNumber = Number(session.user.id);
        if (!Number.isNaN(userIdNumber)) {
          authorRelation = { connect: { id: userIdNumber } };
        }
      }
    }

    const ratingsData =
      ratings && typeof ratings === "object"
        ? (ratings as Record<string, unknown>)
        : null;

    const parseRating = (value: unknown) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return 0;
      if (num < 1 || num > 5) return 0;
      return Number(num.toFixed(2));
    };

    const growthRating = parseRating(ratingsData?.growth);
    const stabilityRating = parseRating(ratingsData?.stability);
    const shippingRating = parseRating(ratingsData?.shipping);
    const careRating = parseRating(ratingsData?.care);

    const providedOverall = parseRating(ratingsData?.overall);
    const ratingValues = [growthRating, stabilityRating, shippingRating, careRating].filter(
      (value) => value > 0,
    );
    const computedOverall =
      ratingValues.length > 0
        ? Number((ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length).toFixed(2))
        : 0;
    const overallRating = providedOverall > 0 ? providedOverall : computedOverall;

    const setupInfo =
      normalizedLampType || normalizedTentSize || normalizedMedium
        ? {
            lampType: normalizedLampType || null,
            tentSize: normalizedTentSize || null,
            medium: normalizedMedium || null,
          }
        : null;

    const extrasInfo =
      normalizedWasher.length > 0
        ? {
            washerGenetics:
              normalizedWasher === "yes" || normalizedWasher === "no" || normalizedWasher === "unknown"
                ? normalizedWasher
                : normalizedWasher,
          }
        : null;

    const ratingsInfo =
      ratingValues.length > 0 || overallRating > 0
        ? {
            growth: growthRating || null,
            stability: stabilityRating || null,
            shipping: shippingRating || null,
            care: careRating || null,
            overall: overallRating || null,
          }
        : null;

    const additionalInfo =
      setupInfo || extrasInfo || ratingsInfo
        ? {
            ...(setupInfo ? { setup: setupInfo } : {}),
            ...(extrasInfo ? { extras: extrasInfo } : {}),
            ...(ratingsInfo ? { ratings: ratingsInfo } : {}),
          }
        : null;

    const report = await prisma.report.create({
      data: {
        title,
        slug:
          title
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") +
          `-${Date.now()}`,
        excerpt: summary.slice(0, 200),
        content: `${summary}\n\nSetup:\n- Watt: ${normalizedLampType || "keine Angabe"}\n- Zelt: ${normalizedTentSize || "keine Angabe"}\n- Medium: ${normalizedMedium || "keine Angabe"}`,
        authorHandle: finalAuthorHandle || "@community",
        images: savedImages,
        gallery:
          successfulUploads.length > 0
            ? successfulUploads.map((upload) => ({
                directUrl: upload.directUrl,
                previewUrl: upload.previewUrl,
                provider: upload.provider,
                key: upload.key,
                originalFileName: upload.originalFileName,
              }))
            : null,
        shipping: shippingRating,
        stability: stabilityRating,
        vitality: growthRating,
        overall: overallRating,
        additionalInfo,
        status: "PENDING",
        publishedAt: null,
        cultivar: { connect: { slug: cultivarSlug } },
        provider: { connect: { slug: providerSlug } },
        author: authorRelation,
      },
    });

    return NextResponse.json({ ok: true, report });
  } catch (error) {
    console.error("[REPORT_CREATE]", error);
    return NextResponse.json(
      { error: "Speichern nicht möglich. Bitte erneut versuchen." },
      { status: 500 },
    );
  }
}

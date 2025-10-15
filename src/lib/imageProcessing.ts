import { extname } from "node:path";

type PrepareImageUploadParams = {
  buffer: Buffer;
  fileName: string;
  contentType?: string | null;
};

type PrepareImageUploadResult = {
  buffer: Buffer;
  fileName: string;
  contentType: string;
};

const INVALID_FILENAME_CHARS = /[^a-z0-9-_]+/gi;
const HEIC_PATTERN = /heic/i;

let sharpModule: typeof import("sharp") | null | undefined;
type HeicConvertModule = (options: { buffer: Buffer | ArrayBuffer; format: "JPEG" | "PNG"; quality?: number }) => Promise<Buffer | ArrayBuffer>;
let heicConvertModule: HeicConvertModule | null | undefined;
type HeicDecodeResult = {
  width: number;
  height: number;
  data: Uint8Array;
  channels?: number;
  components?: number;
};
type HeicDecodeModule = (input: { buffer: ArrayBuffer | Uint8Array }) => Promise<HeicDecodeResult>;
let heicDecodeModule: HeicDecodeModule | null | undefined;

const loadSharp = async () => {
  if (sharpModule !== undefined) {
    return sharpModule ?? null;
  }

  try {
    const imported = await import("sharp");
    sharpModule = (imported as unknown as { default?: typeof import("sharp") }).default ?? imported;
  } catch (error) {
    console.warn("[IMAGE_PROCESSING] Sharp not available – HEIC conversion disabled.", error);
    sharpModule = null;
  }

  return sharpModule ?? null;
};

const loadHeicConvert = async () => {
  if (heicConvertModule !== undefined) {
    return heicConvertModule ?? null;
  }

  try {
    const imported = await import("heic-convert");
    const moduleExport = (imported as unknown as { default?: HeicConvertModule }).default ?? imported;
    heicConvertModule = typeof moduleExport === "function" ? moduleExport : null;
  } catch (error) {
    console.warn("[IMAGE_PROCESSING] heic-convert not available – HEIC conversion fallback disabled.", error);
    heicConvertModule = null;
  }

  return heicConvertModule ?? null;
};

const loadHeicDecode = async () => {
  if (heicDecodeModule !== undefined) {
    return heicDecodeModule ?? null;
  }

  try {
    const imported = await import("heic-decode");
    const moduleExport = (imported as unknown as { default?: HeicDecodeModule }).default ?? imported;
    heicDecodeModule = typeof moduleExport === "function" ? moduleExport : null;
  } catch (error) {
    console.warn("[IMAGE_PROCESSING] heic-decode not available – final HEIC fallback disabled.", error);
    heicDecodeModule = null;
  }

  return heicDecodeModule ?? null;
};

const sanitizeFileName = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return `upload-${Date.now()}`;
  }

  const base = trimmed.replace(/\.[^.]+$/, "");
  const normalized = base.replace(INVALID_FILENAME_CHARS, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  return normalized || `upload-${Date.now()}`;
};

const contentTypeToExtension = (input?: string | null) => {
  const value = input?.toLowerCase() ?? "";
  if (value.includes("png")) return ".png";
  if (value.includes("webp")) return ".webp";
  if (value.includes("gif")) return ".gif";
  if (value.includes("bmp")) return ".bmp";
  if (value.includes("heic")) return ".heic";
  if (value.includes("jpeg") || value.includes("jpg")) return ".jpg";
  return null;
};

const normalizeExtension = (value: string | null | undefined) => {
  if (!value) return "";
  return value.startsWith(".") ? value : `.${value}`;
};

export type HeicConversionResult = {
  buffer: Buffer;
  contentType: "image/jpeg";
  extension: ".jpg";
};

export const convertHeicBuffer = async (input: Buffer): Promise<HeicConversionResult | null> => {
  const sharp = await loadSharp();
  if (sharp) {
    try {
      const output = await sharp(input).jpeg({ quality: 90 }).toBuffer();
      return {
        buffer: output,
        contentType: "image/jpeg",
        extension: ".jpg",
      };
    } catch (error) {
      console.warn("[IMAGE_PROCESSING] Sharp HEIC conversion failed, trying heic-convert.", error);
    }
  }

  const heicConvert = await loadHeicConvert();
  if (heicConvert) {
    try {
      const result = await heicConvert({
        buffer: input,
        format: "JPEG",
        quality: 0.9,
      });
      const output = Buffer.isBuffer(result) ? result : Buffer.from(result);
      return {
        buffer: output,
        contentType: "image/jpeg",
        extension: ".jpg",
      };
    } catch (error) {
      console.error("[IMAGE_PROCESSING] heic-convert failed.", error);
    }
  }

  const heicDecode = await loadHeicDecode();
  if (heicDecode) {
    try {
      const decoded = await heicDecode({ buffer: input });
      const sharp = await loadSharp();
      if (sharp && decoded?.data && decoded.width && decoded.height) {
        const channels = decoded.channels ?? decoded.components ?? 4;
        const rawBuffer = Buffer.from(
          decoded.data.buffer,
          decoded.data.byteOffset,
          decoded.data.byteLength,
        );
        let pipeline = sharp(rawBuffer, {
          raw: {
            width: decoded.width,
            height: decoded.height,
            channels,
          },
        });
        if (channels === 4) {
          pipeline = pipeline.removeAlpha();
        }
        const output = await pipeline.jpeg({ quality: 90 }).toBuffer();
        return {
          buffer: output,
          contentType: "image/jpeg",
          extension: ".jpg",
        };
      }
    } catch (error) {
      console.error("[IMAGE_PROCESSING] heic-decode fallback failed.", error);
    }
  }

  return null;
};

export const prepareImageUpload = async ({
  buffer,
  fileName,
  contentType,
}: PrepareImageUploadParams): Promise<PrepareImageUploadResult> => {
  const inputType = contentType?.toLowerCase() ?? "";
  let normalizedType = inputType || "image/jpeg";
  const originalExtension = extname(fileName || "");
  let baseName = sanitizeFileName(fileName || originalExtension || `upload-${Date.now()}`);
  let workingBuffer = buffer;
  let extension = contentTypeToExtension(normalizedType) ?? (originalExtension || ".jpg");

  const needsHeicConversion =
    HEIC_PATTERN.test(normalizedType) || (originalExtension && HEIC_PATTERN.test(originalExtension));

  if (needsHeicConversion) {
    const conversion = await convertHeicBuffer(buffer);
    if (conversion) {
      workingBuffer = conversion.buffer;
      normalizedType = conversion.contentType;
      extension = conversion.extension;
    } else {
      normalizedType = "image/heic";
      extension = ".heic";
    }
  }

  if (!extension || extension === ".bin") {
    extension = contentTypeToExtension(normalizedType) ?? ".jpg";
  }

  const finalExtension = normalizeExtension(extension) || ".jpg";
  const finalName = `${baseName}${finalExtension}`;

  return {
    buffer: workingBuffer,
    fileName: finalName,
    contentType: normalizedType,
  };
};

export const resolveSuggestedFileName = (
  sourceUrl: string,
  fallback: string | null | undefined,
  reportId: number,
  index: number,
) => {
  if (fallback && fallback.trim().length > 0) {
    return fallback.trim();
  }

  try {
    const parsed = new URL(sourceUrl);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const candidate = segments.pop();
    if (candidate && candidate.trim().length > 0) {
      return decodeURIComponent(candidate.trim());
    }
  } catch {
    // ignore parsing errors, fall back to generated name
  }

  return `report-${reportId}-${index + 1}`;
};

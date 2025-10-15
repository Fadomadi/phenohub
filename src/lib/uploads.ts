import { randomUUID } from "crypto";
import { extname } from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { normalizeTmpfilesUrl } from "@/lib/images";

type UploadResult = {
  directUrl: string;
  previewUrl?: string;
  provider: string;
  key?: string;
};

type UploadConfig =
  | {
      provider: "s3";
      bucket: string;
      region: string;
      endpoint?: string;
      accessKeyId: string;
      secretAccessKey: string;
      forcePathStyle: boolean;
      publicBaseUrl?: string;
    }
  | {
      provider: "tmpfiles";
    };

let cachedConfig: UploadConfig | null = null;
let s3Client: S3Client | null = null;

const resolveConfig = (): UploadConfig => {
  if (cachedConfig) return cachedConfig;

  const provider = process.env.UPLOAD_PROVIDER?.toLowerCase() ?? "tmpfiles";

  if (provider === "s3") {
    const bucket = process.env.UPLOAD_S3_BUCKET;
    const region = process.env.UPLOAD_S3_REGION;
    const accessKeyId = process.env.UPLOAD_S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.UPLOAD_S3_SECRET_ACCESS_KEY;

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      console.warn(
        "[UPLOADS] Missing S3 configuration – falling back to tmpfiles provider.",
      );
    } else {
      cachedConfig = {
        provider: "s3",
        bucket,
        region,
        endpoint: process.env.UPLOAD_S3_ENDPOINT,
        accessKeyId,
        secretAccessKey,
        forcePathStyle: process.env.UPLOAD_S3_FORCE_PATH_STYLE === "true",
        publicBaseUrl: process.env.UPLOAD_S3_PUBLIC_BASE_URL,
      };
      return cachedConfig;
    }
  }

  cachedConfig = { provider: "tmpfiles" };
  return cachedConfig;
};

const resolveS3Client = (config: Extract<UploadConfig, { provider: "s3" }>) => {
  if (s3Client) return s3Client;
  s3Client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return s3Client;
};

const buildS3Key = (originalName: string) => {
  const extension = extname(originalName || "").toLowerCase();
  return `reports/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;
};

const resolveS3PublicUrl = (
  config: Extract<UploadConfig, { provider: "s3" }>,
  key: string,
) => {
  if (config.publicBaseUrl) {
    return `${config.publicBaseUrl.replace(/\/+$/, "")}/${key}`;
  }
  if (config.endpoint) {
    const trimmedEndpoint = config.endpoint.replace(/\/+$/, "");
    if (trimmedEndpoint.includes("http")) {
      if (config.forcePathStyle) {
        return `${trimmedEndpoint}/${config.bucket}/${key}`;
      }
      return `${trimmedEndpoint}/${key}`;
    }
  }
  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
};

const uploadToS3 = async (
  config: Extract<UploadConfig, { provider: "s3" }>,
  buffer: Buffer,
  fileName: string,
  contentType: string,
): Promise<UploadResult> => {
  const key = buildS3Key(fileName);
  const client = resolveS3Client(config);

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
    }),
  );

  const publicUrl = resolveS3PublicUrl(config, key);

  return {
    directUrl: publicUrl,
    previewUrl: publicUrl,
    provider: "s3",
    key,
  };
};

const uploadToTmpfiles = async (
  buffer: Buffer,
  fileName: string,
  contentType: string,
): Promise<UploadResult> => {
  const response = await fetch("https://tmpfiles.org/api/v1/upload", {
    method: "POST",
    body: (() => {
      const formData = new FormData();
      formData.append("file", new Blob([buffer], { type: contentType }), fileName);
      return formData;
    })(),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.data?.url) {
    throw new Error(`TMPFILES_UPLOAD_FAILED_${response.status}`);
  }

  const { direct, preview } = normalizeTmpfilesUrl(String(result.data.url));

  return {
    directUrl: direct,
    previewUrl: preview,
    provider: "tmpfiles",
  };
};

export const uploadImage = async (params: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
}) => {
  const config = resolveConfig();

  if (config.provider === "s3") {
    try {
      return await uploadToS3(config, params.buffer, params.fileName, params.contentType);
    } catch (error) {
      console.error("[UPLOADS:S3]", error);
      // fallthrough to tmpfiles if S3 upload fails
    }
  }

  return uploadToTmpfiles(params.buffer, params.fileName, params.contentType);
};

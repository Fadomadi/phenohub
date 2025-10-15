import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { convertHeicBuffer } from "@/lib/imageProcessing";

const guessContentType = (url: URL, upstreamType: string | null) => {
  if (upstreamType && upstreamType !== "application/octet-stream") {
    return upstreamType;
  }

  const pathname = url.pathname.toLowerCase();
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".gif")) return "image/gif";
  if (pathname.endsWith(".bmp")) return "image/bmp";
  if (pathname.endsWith(".svg") || pathname.endsWith(".svgz")) return "image/svg+xml";
  return "image/jpeg";
};

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get("url");

  if (!target) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url parameter" }, { status: 400 });
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return NextResponse.json({ error: "Unsupported protocol" }, { status: 400 });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: "Failed to load upstream image" },
        { status: upstream.status || 502 },
      );
    }

    const upstreamType = upstream.headers.get("content-type");
    const normalizedType = upstreamType?.toLowerCase() ?? "";
    const needsHeicConversion =
      normalizedType.includes("heic") || parsed.pathname.toLowerCase().endsWith(".heic");

    const headers = new Headers();
    headers.set(
      "Cache-Control",
      upstream.headers.get("cache-control") ?? "public, max-age=300, stale-while-revalidate=600",
    );
    headers.set("Access-Control-Allow-Origin", "*");

    if (needsHeicConversion) {
      const arrayBuffer = await upstream.arrayBuffer();
      const originalBuffer = Buffer.from(arrayBuffer);
      const conversion = await convertHeicBuffer(originalBuffer);

      if (conversion) {
        headers.set("Content-Type", conversion.contentType);
        const responseBody = new Uint8Array(conversion.buffer);
        return new NextResponse(responseBody, {
          status: 200,
          headers,
        });
      }

      headers.set("Content-Type", upstreamType ?? "image/heic");
      return new NextResponse(new Uint8Array(originalBuffer), {
        status: 200,
        headers,
      });
    }

    headers.set("Content-Type", guessContentType(parsed, upstreamType));

    return new NextResponse(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[IMAGE_PROXY]", error);
    return NextResponse.json({ error: "Image proxy error" }, { status: 500 });
  }
}

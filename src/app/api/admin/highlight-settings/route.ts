import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import {
  getHighlightSeedConfig,
  normalizeHighlightSeedConfig,
  saveHighlightSeedConfig,
} from "@/lib/highlightSettings";

const SUCCESS_HEADERS = { "Content-Type": "application/json" };

const respondUnauthorized = (status: number) =>
  NextResponse.json({ error: "Unauthorized" }, { status });

export async function GET() {
  const auth = await requireAuth({ roles: ["OWNER"] });
  if (!auth.ok) {
    return respondUnauthorized(auth.status);
  }

  try {
    const config = await getHighlightSeedConfig();
    return new NextResponse(JSON.stringify({ config }), {
      status: 200,
      headers: SUCCESS_HEADERS,
    });
  } catch (error) {
    console.error("[ADMIN_HIGHLIGHT_SETTINGS_GET]", error);
    return NextResponse.json(
      { error: "Einstellungen konnten nicht geladen werden." },
      { status: 500 },
    );
  }
}

type UpdatePayload = {
  showSeeds?: unknown;
  showSupportCTA?: unknown;
  showCommunityFeedback?: unknown;
  showCommunityNav?: unknown;
  plannedNotes?: unknown;
  seeds?: unknown;
};

export async function PUT(request: Request) {
  const auth = await requireAuth({ roles: ["OWNER"] });
  if (!auth.ok) {
    return respondUnauthorized(auth.status);
  }

  let payload: UpdatePayload;
  try {
    payload = (await request.json()) as UpdatePayload;
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const rawConfig = {
    showSeeds: payload.showSeeds,
    showSupportCTA: payload.showSupportCTA,
    showCommunityFeedback: payload.showCommunityFeedback,
    showCommunityNav: payload.showCommunityNav,
    plannedNotes: payload.plannedNotes,
    seeds: Array.isArray(payload.seeds) ? payload.seeds : [],
  };

  const config = normalizeHighlightSeedConfig(rawConfig);

  try {
    const saved = await saveHighlightSeedConfig(config);
    return new NextResponse(JSON.stringify({ config: saved }), {
      status: 200,
      headers: SUCCESS_HEADERS,
    });
  } catch (error) {
    console.error("[ADMIN_HIGHLIGHT_SETTINGS_PUT]", error);
    return NextResponse.json(
      { error: "Einstellungen konnten nicht gespeichert werden." },
      { status: 500 },
    );
  }
}

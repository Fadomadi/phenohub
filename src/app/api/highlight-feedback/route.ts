import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import {
  createHighlightFeedback,
  listHighlightFeedback,
} from "@/lib/highlightFeedback";

const successHeaders = { "Content-Type": "application/json" };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  try {
    const feedback = await listHighlightFeedback({ take: limit && Number.isFinite(limit) ? limit : 20 });
    return new NextResponse(JSON.stringify({ feedback }), {
      status: 200,
      headers: successHeaders,
    });
  } catch (error) {
    console.error("[HIGHLIGHT_FEEDBACK_GET]", error);
    return NextResponse.json(
      { error: "Community-Feedback konnte nicht geladen werden." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok || !auth.session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  let payload: { body?: unknown };
  try {
    payload = (await request.json()) as { body?: unknown };
  } catch (error) {
    console.warn("[HIGHLIGHT_FEEDBACK_POST] invalid JSON", error);
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const message =
    typeof payload.body === "string" ? payload.body : typeof payload.body === "number" ? String(payload.body) : "";
  const normalizedMessage = message.trim();
  if (normalizedMessage.length === 0) {
    return NextResponse.json({ error: "Feedback darf nicht leer sein." }, { status: 400 });
  }

  const { user } = auth.session;
  const parsedUserId =
    typeof user?.id === "number" ? user.id : user?.id ? Number(user.id) : Number.NaN;
  const authorName =
    (typeof user?.username === "string" && user.username.trim().length > 0
      ? user.username
      : typeof user?.name === "string" && user.name.trim().length > 0
        ? user.name
        : typeof user?.email === "string"
          ? user.email.split("@")[0]
          : "Community-Mitglied") ?? "Community-Mitglied";

  try {
    const entry = await createHighlightFeedback({
      body: normalizedMessage,
      userId: Number.isFinite(parsedUserId) ? parsedUserId : null,
      authorName,
    });

    return new NextResponse(JSON.stringify({ feedback: entry }), {
      status: 201,
      headers: successHeaders,
    });
  } catch (error) {
    console.error("[HIGHLIGHT_FEEDBACK_POST]", error);
    const message =
      error instanceof Error ? error.message : "Feedback konnte nicht gespeichert werden.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { listHighlightFeedback } from "@/lib/highlightFeedback";

const successHeaders = { "Content-Type": "application/json" };

export async function GET(request: Request) {
  const auth = await requireAuth({ roles: ["OWNER"] });
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const url = new URL(request.url);
  const includeArchivedParam = url.searchParams.get("includeArchived");
  const includeArchived =
    includeArchivedParam === "true" ||
    includeArchivedParam === "1" ||
    includeArchivedParam === "yes";

  try {
    const feedback = await listHighlightFeedback({
      includeArchived,
      take: 100,
    });
    return new NextResponse(JSON.stringify({ feedback }), {
      status: 200,
      headers: successHeaders,
    });
  } catch (error) {
    console.error("[ADMIN_HIGHLIGHT_FEEDBACK_GET]", error);
    return NextResponse.json(
      { error: "Feedback-Einträge konnten nicht geladen werden." },
      { status: 500 },
    );
  }
}

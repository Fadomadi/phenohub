import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import {
  deleteHighlightFeedback,
  setHighlightFeedbackArchived,
} from "@/lib/highlightFeedback";

const successHeaders = { "Content-Type": "application/json" };

const parseId = (value: string) => {
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth({ roles: ["OWNER"] });
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id: idParam } = await context.params;
  const id = parseId(idParam);
  if (!id) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  let payload: { archived?: unknown };
  try {
    payload = (await request.json()) as { archived?: unknown };
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const archived = typeof payload.archived === "boolean" ? payload.archived : null;
  if (archived === null) {
    return NextResponse.json(
      { error: "Archiv-Status muss als boolescher Wert übermittelt werden." },
      { status: 400 },
    );
  }

  try {
    const entry = await setHighlightFeedbackArchived(id, archived);
    return new NextResponse(JSON.stringify({ feedback: entry }), {
      status: 200,
      headers: successHeaders,
    });
  } catch (error) {
    console.error("[ADMIN_HIGHLIGHT_FEEDBACK_PATCH]", error);
    return NextResponse.json(
      { error: "Feedback konnte nicht aktualisiert werden." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth({ roles: ["OWNER"] });
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id: idParam } = await context.params;
  const id = parseId(idParam);
  if (!id) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  try {
    await deleteHighlightFeedback(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[ADMIN_HIGHLIGHT_FEEDBACK_DELETE]", error);
    return NextResponse.json(
      { error: "Feedback konnte nicht gelöscht werden." },
      { status: 400 },
    );
  }
}

import type { HighlightFeedback, User } from "@prisma/client";
import prisma from "@/lib/prisma";

export type HighlightFeedbackEntry = {
  id: number;
  body: string;
  createdAt: Date;
  authorName: string;
  userId: number | null;
  username: string | null;
  displayName: string;
  archivedAt: Date | null;
};

const mapEntry = (
  feedback: HighlightFeedback & { user: Pick<User, "id" | "username" | "name"> | null },
): HighlightFeedbackEntry => {
  const preferredName =
    feedback.user?.username?.trim() ||
    feedback.user?.name?.trim() ||
    feedback.authorName?.trim() ||
    "Community-Mitglied";

  return {
    id: feedback.id,
    body: feedback.body,
    createdAt: feedback.createdAt,
    authorName: feedback.authorName,
    userId: feedback.userId,
    username: feedback.user?.username ?? null,
    displayName: preferredName,
    archivedAt: feedback.archivedAt,
  };
};

export const listHighlightFeedback = async (options?: {
  take?: number;
  includeArchived?: boolean;
}) => {
  const take = options?.take && options.take > 0 ? Math.min(options.take, 100) : 20;

  const entries = await prisma.highlightFeedback.findMany({
    orderBy: { createdAt: "desc" },
    take,
    where: options?.includeArchived ? undefined : { archivedAt: null },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });

  return entries.map(mapEntry);
};

export const createHighlightFeedback = async (payload: {
  body: string;
  userId: number | null;
  authorName: string;
}) => {
  const trimmedBody = payload.body.trim();
  if (trimmedBody.length === 0) {
    throw new Error("Feedback darf nicht leer sein.");
  }
  if (trimmedBody.length > 600) {
    throw new Error("Feedback ist zu lang (max. 600 Zeichen).");
  }

  const trimmedAuthor = payload.authorName.trim().slice(0, 120) || "Community-Mitglied";

  const entry = await prisma.highlightFeedback.create({
    data: {
      body: trimmedBody,
      userId: payload.userId ?? undefined,
      authorName: trimmedAuthor,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });

  return mapEntry(entry);
};

export const setHighlightFeedbackArchived = async (id: number, archived: boolean) => {
  const entry = await prisma.highlightFeedback.update({
    where: { id },
    data: {
      archivedAt: archived ? new Date() : null,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });

  return mapEntry(entry);
};

export const deleteHighlightFeedback = async (id: number) => {
  await prisma.highlightFeedback.delete({
    where: { id },
  });
};

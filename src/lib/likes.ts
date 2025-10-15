import { cookies } from "next/headers";

export const LIKE_COOKIE_NAME = "phenohub_like_client";

export const getClientLikeId = () => {
  try {
    return cookies().get(LIKE_COOKIE_NAME)?.value ?? null;
  } catch {
    return null;
  }
};

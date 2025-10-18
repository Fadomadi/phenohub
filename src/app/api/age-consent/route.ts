import { NextRequest, NextResponse } from "next/server";
import { AGE_COOKIE_MAX_AGE_SECONDS, AGE_COOKIE_NAME, AGE_COOKIE_VALUE } from "@/lib/ageGate";

type AgeConsentPayload = {
  returnTo?: string;
};

export async function POST(request: NextRequest) {
  let payload: AgeConsentPayload = {};

  try {
    payload = (await request.json()) as AgeConsentPayload;
  } catch {
    payload = {};
  }

  const rawReturnTo = typeof payload.returnTo === "string" ? payload.returnTo : "/";
  const sanitizedReturnTo =
    rawReturnTo.startsWith("/") && rawReturnTo !== "/age-check" ? rawReturnTo : "/";

  const response = NextResponse.json({ redirectTo: sanitizedReturnTo });

  response.cookies.set({
    name: AGE_COOKIE_NAME,
    value: AGE_COOKIE_VALUE,
    maxAge: AGE_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  });

  return response;
}

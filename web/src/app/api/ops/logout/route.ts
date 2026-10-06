import {
  getOperatorCookieName,
} from "@/lib/ops-server";

export const runtime = "nodejs";

export async function POST() {
  const response = Response.json({
    ok: true,
  });

  response.headers.append(
    "Set-Cookie",
    [
      `${getOperatorCookieName()}=`,
      "Path=/",
      "HttpOnly",
      "SameSite=Strict",
      "Max-Age=0",
    ].join("; "),
  );

  return response;
}
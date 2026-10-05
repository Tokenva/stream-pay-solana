import { NextRequest } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL =
  (
    process.env.BACKEND_URL ??
    "http://localhost:4000"
  ).replace(/\/+$/, "");

const API_KEY =
  process.env.STREAMPAY_API_KEY?.trim();

const ALLOWED_PATHS = new Set([
  "/health",
  "/api/ops/metrics",
  "/api/cross-chain/messages",
]);

export async function GET(
  request: NextRequest,
) {
  const backendPath =
    request.nextUrl.pathname.replace(
      /^\/api\/backend/,
      "",
    ) || "/";

  if (!ALLOWED_PATHS.has(backendPath)) {
    return Response.json(
      { error: "Not found" },
      { status: 404 },
    );
  }

  if (!API_KEY) {
    return Response.json(
      {
        error:
          "Backend proxy authentication is not configured",
      },
      { status: 503 },
    );
  }

  let targetUrl: URL;

  try {
    targetUrl = new URL(
      `${backendPath}${request.nextUrl.search}`,
      BACKEND_URL,
    );
  } catch {
    return Response.json(
      { error: "Invalid backend URL" },
      { status: 500 },
    );
  }

  try {
    const response =
      await fetch(targetUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        cache: "no-store",
      });

    const responseHeaders =
      new Headers();

    const contentType =
      response.headers.get(
        "content-type",
      );

    if (contentType) {
      responseHeaders.set(
        "content-type",
        contentType,
      );
    }

    responseHeaders.set(
      "cache-control",
      "no-store",
    );

    const body =
      await response.text();

    return new Response(body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      {
        error:
          "Backend service unavailable",
      },
      { status: 502 },
    );
  }
}
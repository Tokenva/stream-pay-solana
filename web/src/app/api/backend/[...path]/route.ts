import { NextRequest } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL =
  (
    process.env.BACKEND_URL ??
    "http://localhost:4000"
  ).replace(/\/+$/, "");

const API_KEY =
  process.env.TOKENVAPAY_API_KEY?.trim();

const ALLOWED_PATHS = new Set([
  "/health",
  "/api/ops/metrics",
  "/api/cross-chain/messages",

  "/api/auth/nonce",
  "/api/auth/login",
  "/api/auth/session",
  "/api/auth/logout",

  "/api/company",
  "/api/company/access",
  "/api/company/invitations",
  "/api/company/invitations/accept",
  "/api/indexed/streams",

  "/api/application",
  "/api/faucet/claim",

  "/api/activities",
  "/api/activities/stats",

  "/api/reports/payroll",
  "/api/reports/employees",
  "/api/reports/treasury",
  "/api/reports/reconciliation",

  "/api/reports/payroll.csv",
  "/api/reports/employees.csv",
  "/api/reports/transactions.csv",
]);

async function proxy(
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
    const headers = new Headers();

    headers.set(
      "content-type",
      request.headers.get(
        "content-type",
      ) ?? "application/json",
    );

    const cookie =
      request.headers.get("cookie");

    if (cookie) {
      headers.set("cookie", cookie);
    }

    if (
      API_KEY &&
      backendPath !== "/api/auth/nonce" &&
      backendPath !== "/api/auth/login" &&
      backendPath !== "/api/auth/session" &&
      backendPath !== "/api/auth/logout"
    ) {
      headers.set(
        "authorization",
        `Bearer ${API_KEY}`,
      );
    }

    const body =
      request.method === "GET" ||
        request.method === "HEAD"
        ? undefined
        : await request.text();

    const response =
      await fetch(targetUrl, {
        method: request.method,
        headers,
        body,
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

    const setCookie =
      response.headers.get(
        "set-cookie",
      );

    if (setCookie) {
      responseHeaders.set(
        "set-cookie",
        setCookie,
      );
    }

    responseHeaders.set(
      "cache-control",
      "no-store",
    );

    const responseBody =
      await response.text();

    return new Response(
      responseBody,
      {
        status: response.status,
        headers: responseHeaders,
      },
    );
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

export const GET = proxy;
export const POST = proxy;
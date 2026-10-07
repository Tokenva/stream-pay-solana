import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const OPERATOR_COOKIE = "tokenva-ops-session";

const BACKEND_URL = (
  process.env.BACKEND_URL ??
  "http://localhost:4000"
).replace(/\/+$/, "");

const API_KEY =
  process.env.TOKENVAPAY_API_KEY?.trim();

const OPERATOR_KEY =
  process.env.TOKENVA_OPERATOR_KEY?.trim();

function sessionValue() {
  if (!OPERATOR_KEY) {
    throw new Error(
      "TOKENVA_OPERATOR_KEY is not configured",
    );
  }

  return createHmac(
    "sha256",
    OPERATOR_KEY,
  )
    .update("tokenva-ops-session")
    .digest("hex");
}

export async function isOperatorAuthenticated() {
  const cookieStore = await cookies();

  const provided =
    cookieStore.get(OPERATOR_COOKIE)?.value ?? "";

  if (!provided) {
    return false;
  }

  let expected: string;

  try {
    expected = sessionValue();
  } catch {
    return false;
  }

  const providedBuffer =
    Buffer.from(provided);

  const expectedBuffer =
    Buffer.from(expected);

  if (
    providedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    providedBuffer,
    expectedBuffer,
  );
}

export async function getOperatorSessionValue() {
  return sessionValue();
}

export function getOperatorCookieName() {
  return OPERATOR_COOKIE;
}

export async function backendOpsRequest(
  path: string,
  init: RequestInit = {},
) {
  if (!API_KEY) {
    throw new Error(
      "TOKENVAPAY_API_KEY is not configured",
    );
  }

  const headers = new Headers(
    init.headers,
  );

  headers.set(
    "authorization",
    `Bearer ${API_KEY}`,
  );

  if (
    init.body &&
    !headers.has("content-type")
  ) {
    headers.set(
      "content-type",
      "application/json",
    );
  }

  return fetch(
    `${BACKEND_URL}${path}`,
    {
      ...init,
      headers,
      cache: "no-store",
    },
  );
}
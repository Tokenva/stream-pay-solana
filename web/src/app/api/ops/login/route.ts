import { NextRequest } from "next/server";
import {
  getOperatorCookieName,
  getOperatorSessionValue,
} from "@/lib/ops-server";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
) {
  const configuredKey =
    process.env.TOKENVA_OPERATOR_KEY?.trim();

  if (!configuredKey) {
    return Response.json(
      {
        error:
          "Operator authentication is not configured",
      },
      { status: 503 },
    );
  }

  let body: {
    key?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (
    typeof body.key !== "string" ||
    body.key !== configuredKey
  ) {
    return Response.json(
      { error: "Invalid operator credentials" },
      { status: 401 },
    );
  }

  const response = Response.json({
    ok: true,
  });

  response.headers.append(
    "Set-Cookie",
    [
      `${getOperatorCookieName()}=${await getOperatorSessionValue()}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Strict",
      "Max-Age=28800",
    ].join("; "),
  );

  return response;
}
import {
  backendOpsRequest,
  isOperatorAuthenticated,
} from "@/lib/ops-server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
) {
  if (!(await isOperatorAuthenticated())) {
    return Response.json(
      { error: "Operator authentication required" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const query =
    status
      ? `?status=${encodeURIComponent(status)}`
      : "";

  try {
    const response =
      await backendOpsRequest(
        `/api/ops/applications${query}`,
        {
          method: "GET",
        },
      );

    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get(
            "content-type",
          ) ??
          "application/json",
        "cache-control":
          "no-store",
      },
    });
  } catch {
    return Response.json(
      { error: "Backend service unavailable" },
      { status: 502 },
    );
  }
}
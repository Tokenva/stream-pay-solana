import {
  backendOpsRequest,
  isOperatorAuthenticated,
} from "@/lib/ops-server";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      applicationId: string;
    }>;
  },
) {
  if (!(await isOperatorAuthenticated())) {
    return Response.json(
      { error: "Operator authentication required" },
      { status: 401 },
    );
  }

  const { applicationId } =
    await context.params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const response =
      await backendOpsRequest(
        `/api/ops/applications/${encodeURIComponent(
          applicationId,
        )}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
      );

    const responseBody =
      await response.text();

    return new Response(responseBody, {
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
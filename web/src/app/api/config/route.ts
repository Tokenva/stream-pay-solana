export const runtime = "nodejs";

export async function GET() {
  const mint = process.env.TOKEN_MINT?.trim();

  if (!mint) {
    return Response.json(
      { error: "TOKEN_MINT is not configured" },
      { status: 500 },
    );
  }

  return Response.json({
    mint,
  });
}

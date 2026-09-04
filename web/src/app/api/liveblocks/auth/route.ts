import { liveblocks } from "@/lib/liveblocks";

export async function POST() {
  if (!process.env.LIVEBLOCKS_SECRET_KEY) {
    return Response.json({ error: "Liveblocks is not configured" }, { status: 501 });
  }

  try {
    const session = liveblocks.prepareSession("tradenum-operator", {
      userInfo: {
        name: "Operator",
        color: "#22d3ee",
      },
    });
    session.allow("tradenum-desk", session.FULL_ACCESS);
    const { status, body } = await session.authorize();
    return new Response(body, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "authorize failed";
    return Response.json({ error: "watch_unavailable", detail }, { status: 503 });
  }
}

import { Liveblocks } from "@liveblocks/node";

let client: Liveblocks | null = null;

export function getLiveblocks(): Liveblocks {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error("Liveblocks is not configured");
  }
  if (!client) {
    client = new Liveblocks({ secret });
  }
  return client;
}

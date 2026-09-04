declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      role: "operator";
    };
    UserMeta: {
      id: string;
      info: {
        name: string;
        color?: string;
      };
    };
    RoomEvent: {
      type: "agent-step";
      nodeId: string | null;
    };
  }
}

export {};

"use client";

import {
  createContext,
  Component,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  useBroadcastEvent,
  useErrorListener,
  useEventListener,
} from "@liveblocks/react";

import { toast } from "@/components/ui/toast";

import "@liveblocks/react-ui/styles.css";

type AgentBus = {
  broadcastStep: (nodeId: string | null) => void;
  remoteNode: string | null;
};

const LOCAL_BUS: AgentBus = {
  broadcastStep: () => {},
  remoteNode: null,
};

const AgentBusContext = createContext<AgentBus>(LOCAL_BUS);

const WATCH_OFFLINE =
  "Watch room is down. Desk still runs locally.";

let watchOfflineToasted = false;

function toastWatchOffline(message = WATCH_OFFLINE) {
  if (watchOfflineToasted) return;
  watchOfflineToasted = true;
  toast(message);
}

export function useAgentBus() {
  return useContext(AgentBusContext);
}

function LocalBus({ children }: { children: ReactNode }) {
  return <AgentBusContext.Provider value={LOCAL_BUS}>{children}</AgentBusContext.Provider>;
}

function LiveBus({ children }: { children: ReactNode }) {
  const broadcast = useBroadcastEvent();
  const [remoteNode, setRemoteNode] = useState<string | null>(null);
  useEventListener(({ event }) => {
    if (event.type === "agent-step") {
      setRemoteNode(event.nodeId);
    }
  });
  const value = useMemo<AgentBus>(
    () => ({
      broadcastStep: (nodeId) => broadcast({ type: "agent-step", nodeId }),
      remoteNode,
    }),
    [broadcast, remoteNode]
  );
  return <AgentBusContext.Provider value={value}>{children}</AgentBusContext.Provider>;
}

function WatchErrorBridge({ onFatal }: { onFatal: () => void }) {
  useErrorListener((err) => {
    const authFailed =
      err.context.type === "ROOM_CONNECTION_ERROR" || /auth/i.test(err.message);
    toastWatchOffline(
      authFailed ? WATCH_OFFLINE : "Watch room dropped. Desk still runs locally."
    );
    if (authFailed) onFatal();
  });
  return null;
}

class RoomErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onError?: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

async function probeWatchRoom(): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 2500);
  try {
    const res = await fetch("/api/liveblocks/auth", {
      method: "POST",
      cache: "no-store",
      signal: ctrl.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

export function Room({ children }: { children: ReactNode }) {
  const [watch, setWatch] = useState(false);
  const local = <LocalBus>{children}</LocalBus>;

  useEffect(() => {
    let cancelled = false;
    void probeWatchRoom().then((ok) => {
      if (cancelled) return;
      if (ok) {
        setWatch(true);
        return;
      }
      toastWatchOffline();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!watch) return local;

  return (
    <RoomErrorBoundary
      fallback={local}
      onError={() => {
        toastWatchOffline();
        setWatch(false);
      }}
    >
      <LiveblocksProvider authEndpoint="/api/liveblocks/auth" throttle={16}>
        <RoomProvider
          id="tradenum-desk"
          initialPresence={{ cursor: null, role: "operator" }}
        >
          <WatchErrorBridge onFatal={() => setWatch(false)} />
          <LiveBus>{children}</LiveBus>
        </RoomProvider>
      </LiveblocksProvider>
    </RoomErrorBoundary>
  );
}

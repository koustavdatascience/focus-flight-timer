import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export type WaypointPresenceStatus = "exploring" | "flying";

type WaypointPresencePayload = {
  client_id: string;
  status: WaypointPresenceStatus;
};

export type WaypointPresenceCounts = {
  explorers: number;
  flyers: number;
  connected: boolean;
};

const EMPTY_COUNTS: WaypointPresenceCounts = { explorers: 0, flyers: 0, connected: false };
const CLIENT_ID_KEY = "waypoint-live-client-id";

function getClientId() {
  if (typeof window === "undefined") return "waypoint-server";
  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;
  const generated = typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `waypoint-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(CLIENT_ID_KEY, generated);
  return generated;
}

/** Collapse multiple open tabs from one browser into a single anonymous live visitor. */
export function countWaypointPresence(presenceState: Record<string, WaypointPresencePayload[]>) {
  const visitors = new Map<string, WaypointPresenceStatus>();

  Object.values(presenceState).forEach((entries) => {
    entries.forEach((entry) => {
      if (!entry?.client_id) return;
      const previous = visitors.get(entry.client_id);
      visitors.set(entry.client_id, previous === "flying" || entry.status === "flying" ? "flying" : "exploring");
    });
  });

  return {
    explorers: visitors.size,
    flyers: Array.from(visitors.values()).filter((status) => status === "flying").length,
  };
}

export function useWaypointPresence(status: WaypointPresenceStatus) {
  const clientId = useMemo(getClientId, []);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [counts, setCounts] = useState<WaypointPresenceCounts>(EMPTY_COUNTS);

  useEffect(() => {
    const channel = supabase.channel("waypoint-live", {
      config: { presence: { key: clientId } },
    });
    channelRef.current = channel;

    const updateCounts = () => {
      const liveCounts = countWaypointPresence(channel.presenceState() as Record<string, WaypointPresencePayload[]>);
      setCounts({ ...liveCounts, connected: true });
    };

    channel
      .on("presence", { event: "sync" }, updateCounts)
      .on("presence", { event: "join" }, updateCounts)
      .on("presence", { event: "leave" }, updateCounts)
      .subscribe((subscriptionStatus) => {
        if (subscriptionStatus === "SUBSCRIBED") {
          void channel.track({ client_id: clientId, status });
        }
      });

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [clientId]);

  useEffect(() => {
    if (!channelRef.current) return;
    void channelRef.current.track({ client_id: clientId, status });
  }, [clientId, status]);

  return counts;
}

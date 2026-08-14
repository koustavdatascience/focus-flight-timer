import { supabase } from "@/lib/supabase";

export type FocusRoom = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  visibility: "invite_only" | "unlisted";
  max_members: number;
  created_at: string;
  updated_at: string;
};

export type FocusRoomMembership = { role: "owner" | "member"; rooms: FocusRoom | null };

export type GroupFlightSession = {
  id: string;
  room_id: string;
  created_by: string;
  origin_airport_id: string;
  destination_airport_id: string;
  distance_km: number;
  focus_duration_seconds: number;
  elapsed_active_seconds: number;
  status: "boarding" | "active" | "paused_waiting_for_members" | "completed" | "abandoned";
  started_at: string | null;
  completed_at: string | null;
  abandoned_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GroupFlightRosterMember = {
  user_id: string;
  is_ready: boolean;
  is_present: boolean;
  last_seen_at: string | null;
};

async function callRoomRpc<T>(name: string, args: Record<string, unknown>) {
  const { data, error } = await supabase.rpc(name as never, args as never);
  if (error) throw error;
  return data as T;
}

export async function getMyFocusRooms() {
  const { data, error } = await supabase
    .from("room_members")
    .select("role, rooms(*)")
    .is("left_at", null)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as FocusRoomMembership[];
}

export async function getLatestGroupFlight(roomId: string) {
  const { data, error } = await supabase
    .from("group_flight_sessions")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as GroupFlightSession | null;
}

export function createFocusRoom(name: string) {
  return callRoomRpc<string>("create_focus_room", { p_name: name, p_visibility: "invite_only", p_max_members: 10 });
}

export function joinFocusRoom(inviteCode: string) {
  return callRoomRpc<string>("join_focus_room", { p_invite_code: inviteCode });
}

export function startGroupFlight(input: { roomId: string; originAirportId: string; destinationAirportId: string; distanceKm: number; focusDurationSeconds: number }) {
  return callRoomRpc<string>("start_group_flight", {
    p_room_id: input.roomId,
    p_origin_airport_id: input.originAirportId,
    p_destination_airport_id: input.destinationAirportId,
    p_distance_km: input.distanceKm,
    p_focus_duration_seconds: input.focusDurationSeconds,
  });
}

export function setGroupFlightReady(sessionId: string, isReady: boolean) {
  return callRoomRpc<GroupFlightSession>("set_group_flight_ready", { p_session_id: sessionId, p_is_ready: isReady });
}

export function heartbeatGroupFlight(sessionId: string, present = true) {
  return callRoomRpc<GroupFlightSession>("heartbeat_group_flight", { p_session_id: sessionId, p_present: present });
}

export function abandonGroupFlight(sessionId: string) {
  return callRoomRpc<GroupFlightSession>("abandon_group_flight", { p_session_id: sessionId });
}

export async function getGroupFlightRoster(sessionId: string) {
  const { data, error } = await supabase.rpc("get_group_flight_roster" as never, { p_session_id: sessionId } as never);
  if (error) throw error;
  return (data ?? []) as GroupFlightRosterMember[];
}

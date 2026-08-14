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

export type GroupTrip = {
  id: string;
  session_id: string;
  room_id: string;
  origin_airport_id: string;
  destination_airport_id: string;
  distance_km: number;
  focus_duration_seconds: number;
  completed_at: string;
  rooms: { name: string } | null;
};

export type GroupLocationSyncOffer = {
  id: string;
  group_session_id: string;
  origin_airport_id: string;
  destination_airport_id: string;
  status: "pending" | "used" | "invalidated_by_new_solo_flight" | "unavailable_after_location_change";
  created_at: string;
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

export async function getGroupTripHistory(roomId: string) {
  const { data, error } = await supabase
    .from("group_trips")
    .select("id, session_id, room_id, origin_airport_id, destination_airport_id, distance_km, focus_duration_seconds, completed_at, rooms(name)")
    .eq("room_id", roomId)
    .order("completed_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as unknown as GroupTrip[];
}

export async function getGroupLocationSyncOffers(sessionIds: string[]) {
  if (sessionIds.length === 0) return [];
  const { data, error } = await supabase
    .from("group_location_sync_offers")
    .select("id, group_session_id, origin_airport_id, destination_airport_id, status, created_at")
    .in("group_session_id", sessionIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as GroupLocationSyncOffer[];
}

export function acceptGroupLocationSyncOffer(offerId: string) {
  return callRoomRpc<"used" | "unavailable_after_location_change" | "invalidated_by_new_solo_flight">("accept_group_location_sync_offer", { p_offer_id: offerId });
}

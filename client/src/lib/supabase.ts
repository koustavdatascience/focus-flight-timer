import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("FocusFlight is missing its Supabase browser configuration.");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
});

export type FocusProfile = {
  id: string;
  display_name: string | null;
  home_airport_id: string | null;
  handle: string | null;
  bio: string | null;
  avatar_path: string | null;
  location_visibility: "only_me" | "shared_rooms" | "public";
  leaderboard_opt_in: boolean;
  solo_current_airport_id: string | null;
  solo_location_version: number;
  public_profile_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type FocusProfileUpdate = Partial<Pick<FocusProfile, "display_name" | "home_airport_id" | "handle" | "bio" | "location_visibility" | "leaderboard_opt_in" | "public_profile_enabled">>;

export type PublicProfileCard = {
  profile_id: string;
  handle: string;
  display_name: string | null;
  bio: string | null;
  avatar_path: string | null;
  current_airport_id: string | null;
  solo_completed_focus_seconds: number | null;
  solo_completed_flights: number | null;
  cofocus_completed_focus_seconds: number | null;
  cofocus_completed_flights: number | null;
  pilot_since: string;
  access_level: "self" | "friend" | "public";
};

export type FocusSocialRelation = "friend" | "incoming" | "outgoing" | "blocked";

export type FocusSocialOverviewEntry = {
  relation: FocusSocialRelation;
  request_id: string | null;
  profile_id: string;
  handle: string | null;
  display_name: string | null;
  avatar_path: string | null;
  created_at: string;
};

export type PublicLeaderboardRow = {
  user_id: string;
  category: "solo" | "cofocus";
  period_type: "monthly" | "all_time";
  period_start_utc: string;
  completed_focus_seconds: number;
  completed_flights: number;
  last_score_at: string | null;
  handle: string;
  display_name: string | null;
  avatar_path: string | null;
};

export type FocusTripStatus = "in_progress" | "completed";

export type FocusTrip = {
  id: string;
  user_id: string;
  origin_airport_id: string;
  destination_airport_id: string;
  distance_km: number;
  focus_duration_seconds: number;
  flight_duration_route_key: string | null;
  duration_source: "verified_direct" | "estimated" | null;
  duration_source_label: string | null;
  elapsed_seconds: number;
  is_paused: boolean;
  status: FocusTripStatus;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function ensureFocusProfile(userId: string, fallbackName: string | null) {
  const existing = await getFocusProfile();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userId, display_name: fallbackName, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (!error) return data as FocusProfile;

  // A second tab may have created the profile between the lookup and insert.
  const concurrentProfile = await getFocusProfile();
  if (concurrentProfile) return concurrentProfile;
  throw error;
}

export async function getFocusProfile() {
  const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
  if (error) throw error;
  return data as FocusProfile | null;
}

export async function updateFocusProfile(input: FocusProfileUpdate) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...input, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data as FocusProfile;
}

export async function getPublicProfileCard(handle: string) {
  const { data, error } = await supabase.rpc("get_focusflight_profile", { p_handle: handle.trim().toLowerCase() });
  if (error) throw error;
  return (data?.[0] ?? null) as PublicProfileCard | null;
}

export async function getFocusSocialOverview() {
  const { data, error } = await supabase.rpc("get_focusflight_social_overview");
  if (error) throw error;
  return (data ?? []) as FocusSocialOverviewEntry[];
}

async function invokeSocialAction(functionName: string, args: Record<string, unknown>) {
  const { error } = await supabase.rpc(functionName, args);
  if (error) throw error;
}

export async function sendFocusflightFriendRequest(recipientId: string) {
  return invokeSocialAction("send_focusflight_friend_request", { p_recipient_id: recipientId });
}

export async function respondToFocusflightFriendRequest(requestId: string, accept: boolean) {
  return invokeSocialAction("respond_to_focusflight_friend_request", { p_request_id: requestId, p_accept: accept });
}

export async function cancelFocusflightFriendRequest(requestId: string) {
  return invokeSocialAction("cancel_focusflight_friend_request", { p_request_id: requestId });
}

export async function blockFocusflightUser(profileId: string) {
  return invokeSocialAction("block_focusflight_user", { p_blocked_id: profileId });
}

export async function unblockFocusflightUser(profileId: string) {
  return invokeSocialAction("unblock_focusflight_user", { p_blocked_id: profileId });
}

export async function getFocusLeaderboard(category: PublicLeaderboardRow["category"], period: PublicLeaderboardRow["period_type"], now = new Date()) {
  const periodStart = period === "all_time"
    ? "1970-01-01"
    : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const { data, error } = await supabase
    .from("public_leaderboard_rows")
    .select("user_id, category, period_type, period_start_utc, completed_focus_seconds, completed_flights, last_score_at, handle, display_name, avatar_path")
    .eq("category", category)
    .eq("period_type", period)
    .eq("period_start_utc", periodStart)
    .order("completed_focus_seconds", { ascending: false })
    .order("last_score_at", { ascending: true, nullsFirst: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as PublicLeaderboardRow[];
}

export async function getFocusTrips() {
  const { data, error } = await supabase.from("trips").select("*").order("started_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FocusTrip[];
}

export async function startFocusTrip(input: Pick<FocusTrip, "user_id" | "origin_airport_id" | "destination_airport_id" | "distance_km" | "focus_duration_seconds" | "flight_duration_route_key" | "duration_source" | "duration_source_label">) {
  const { data, error } = await supabase
    .from("trips")
    .insert({ ...input, elapsed_seconds: 0, is_paused: false })
    .select()
    .single();
  if (error) throw error;
  return data as FocusTrip;
}

export async function updateFocusTripProgress(tripId: string, elapsedSeconds: number, isPaused: boolean) {
  const { data, error } = await supabase
    .from("trips")
    .update({ elapsed_seconds: Math.max(0, Math.round(elapsedSeconds)), is_paused: isPaused, updated_at: new Date().toISOString() })
    .eq("id", tripId)
    .select()
    .single();
  if (error) throw error;
  return data as FocusTrip;
}

export async function completeFocusTrip(tripId: string, elapsedSeconds: number) {
  const timestamp = new Date().toISOString();
  const { data, error } = await supabase
    .from("trips")
    .update({
      elapsed_seconds: Math.max(0, Math.round(elapsedSeconds)),
      is_paused: false,
      status: "completed",
      completed_at: timestamp,
      updated_at: timestamp,
    })
    .eq("id", tripId)
    .select()
    .single();
  if (error) throw error;
  return data as FocusTrip;
}

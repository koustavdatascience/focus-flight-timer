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
  created_at: string;
  updated_at: string;
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

export async function updateFocusProfile(input: Pick<FocusProfile, "display_name" | "home_airport_id">) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...input, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data as FocusProfile;
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

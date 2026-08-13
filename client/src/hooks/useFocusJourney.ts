import { useCallback, useEffect, useState } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { ensureFocusProfile, getFocusTrips, type FocusProfile, type FocusProfileUpdate, type FocusTrip, updateFocusProfile } from "@/lib/supabase";

export function useFocusJourney() {
  const { user, displayName, isAuthenticated } = useSupabaseAuth();
  const [profile, setProfile] = useState<FocusProfile | null>(null);
  const [trips, setTrips] = useState<FocusTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setTrips([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextProfile = await ensureFocusProfile(user.id, displayName);
      const nextTrips = await getFocusTrips();
      setProfile(nextProfile);
      setTrips(nextTrips);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your saved journeys are temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }, [displayName, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveProfile = useCallback(async (input: FocusProfileUpdate) => {
    const nextProfile = await updateFocusProfile(input);
    setProfile(nextProfile);
    return nextProfile;
  }, []);

  return { isAuthenticated, user, profile, trips, loading, error, refresh, saveProfile };
}

import { ArrowLeft, MapPin, Plane } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Ban, Check, UserPlus, UserX } from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { blockFocusflightUser, cancelFocusflightFriendRequest, getFocusSocialOverview, getPublicProfileCard, respondToFocusflightFriendRequest, sendFocusflightFriendRequest, unblockFocusflightUser, type FocusSocialOverviewEntry, type PublicProfileCard } from "@/lib/supabase";
import { getAirportById } from "@/services/airportSearch";

function formatDuration(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
}

export default function PublicProfile() {
  const [, params] = useRoute("/u/:handle");
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<PublicProfileCard | null>(null);
  const [socialOverview, setSocialOverview] = useState<FocusSocialOverviewEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socialMessage, setSocialMessage] = useState<string | null>(null);
  const [socialBusy, setSocialBusy] = useState(false);
  const handle = params?.handle || "";
  const { user } = useSupabaseAuth();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void getPublicProfileCard(handle)
      .then((result) => { if (active) setProfile(result); })
      .catch(() => { if (active) setError("This profile could not be opened right now."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [handle]);

  useEffect(() => {
    let active = true;
    if (!user) {
      setSocialOverview([]);
      return () => { active = false; };
    }
    void getFocusSocialOverview()
      .then((result) => { if (active) setSocialOverview(result); })
      .catch(() => { if (active) setSocialOverview([]); });
    return () => { active = false; };
  }, [user?.id]);

  const relationship = useMemo(() => profile && socialOverview.find((entry) => entry.profile_id === profile.profile_id), [profile, socialOverview]);

  async function refreshSocial() {
    if (!user) return;
    setSocialOverview(await getFocusSocialOverview());
  }

  async function performSocialAction(action: () => Promise<unknown>, successMessage: string) {
    setSocialBusy(true);
    setSocialMessage(null);
    try {
      await action();
      await refreshSocial();
      setSocialMessage(successMessage);
    } catch (caught) {
      setSocialMessage(caught instanceof Error ? caught.message : "That social action could not be completed.");
    } finally {
      setSocialBusy(false);
    }
  }

  const airport = profile?.current_airport_id ? getAirportById(profile.current_airport_id) : null;
  const visibleLocation = airport ? `${airport.city} · ${airport.iata || airport.icao}` : null;

  return <main className="public-profile-page">
    <header className="journey-header public-profile-header"><button className="journey-back-button" onClick={() => navigate("/")}><ArrowLeft size={17} /> Flight planner</button><div className="journey-wordmark">Waypoint</div><button className="journey-signout" onClick={() => navigate("/journey")}>My Journey</button></header>
    {loading ? <section className="public-profile-state"><span className="selection-eyebrow">Waypoint profile</span><h1>Opening this<br /><em>flight log…</em></h1></section> : error || !profile ? <section className="public-profile-state"><span className="selection-eyebrow">Waypoint profile</span><h1>This flight log<br /><em>is unavailable.</em></h1><p>{error || "The traveller may have made their profile private or changed its handle."}</p><button className="journey-primary-button" onClick={() => navigate("/")}>Plan a focus flight</button></section> : <section className="public-profile-content">
      <span className="selection-eyebrow">Public flight log</span>
      <div className="public-profile-hero"><div><h1>{profile.display_name || `@${profile.handle}`}<br /><em>@{profile.handle}</em></h1>{profile.bio && <p>{profile.bio}</p>}{visibleLocation ? <div className="public-location"><MapPin size={15} /> Current solo location: <strong>{visibleLocation}</strong></div> : <p className="public-location-private">Current solo location is private.</p>}{user && profile.access_level !== "self" && <div className="public-social-actions">{relationship?.relation === "friend" ? <><span className="social-status"><Check size={13} /> Friends</span><button disabled={socialBusy} onClick={() => void performSocialAction(() => blockFocusflightUser(profile.profile_id), "This pilot has been blocked and removed from your friends.")}><Ban size={13} /> Block</button></> : relationship?.relation === "incoming" && relationship.request_id ? <><button disabled={socialBusy} onClick={() => void performSocialAction(() => respondToFocusflightFriendRequest(relationship.request_id!, true), "Friend request accepted.")}><Check size={13} /> Accept request</button><button disabled={socialBusy} onClick={() => void performSocialAction(() => respondToFocusflightFriendRequest(relationship.request_id!, false), "Friend request declined.")}>Decline</button></> : relationship?.relation === "outgoing" && relationship.request_id ? <button disabled={socialBusy} onClick={() => void performSocialAction(() => cancelFocusflightFriendRequest(relationship.request_id!), "Friend request cancelled.")}>Cancel request</button> : relationship?.relation === "blocked" ? <button disabled={socialBusy} onClick={() => void performSocialAction(() => unblockFocusflightUser(profile.profile_id), "This pilot has been unblocked.")}><UserPlus size={13} /> Unblock</button> : <><button className="public-social-primary" disabled={socialBusy} onClick={() => void performSocialAction(() => sendFocusflightFriendRequest(profile.profile_id), "Friend request sent.")}><UserPlus size={13} /> Add friend</button><button disabled={socialBusy} onClick={() => void performSocialAction(() => blockFocusflightUser(profile.profile_id), "This pilot has been blocked.")}><UserX size={13} /> Block</button></>}{socialMessage && <small role="status">{socialMessage}</small>}</div>}</div><div className="public-profile-identity"><Plane size={22} /><span>Pilot since</span><strong>{new Date(profile.pilot_since).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</strong></div></div>
      {profile.solo_completed_focus_seconds !== null ? <section className="journey-stats public-profile-stats" aria-label="Visible focus statistics"><div><span>Solo focus</span><strong>{formatDuration(profile.solo_completed_focus_seconds)}</strong><small>{profile.solo_completed_flights} completed flights</small></div><div><span>Co-Focus</span><strong>{formatDuration(profile.cofocus_completed_focus_seconds || 0)}</strong><small>{profile.cofocus_completed_flights || 0} completed group flights</small></div></section> : <div className="public-profile-gated"><UserPlus size={17} /><strong>Focus totals are shared with friends.</strong><span>Send a request to unlock the deeper flight log if this pilot accepts.</span></div>}
      <p className="public-profile-note">Waypoint keeps solo and group history distinct. A group flight never changes this traveller’s solo location.</p>
    </section>}
  </main>;
}

export type GroupFlightStatus = "boarding" | "active" | "paused_waiting_for_members" | "completed" | "abandoned";

export function groupFlightStatusCopy(status: GroupFlightStatus) {
  const copy: Record<GroupFlightStatus, { label: string; description: string }> = {
    boarding: { label: "Boarding", description: "Every room member must be ready and present before this flight can begin." },
    active: { label: "In flight", description: "All members are present. Shared focus time is moving together." },
    paused_waiting_for_members: { label: "Waiting for the crew", description: "The timer is paused until every room member is back and ready." },
    completed: { label: "Landed together", description: "This completed Co-Focus flight is recorded separately from every solo journey." },
    abandoned: { label: "Flight closed", description: "The crew went fully offline before landing. Start a fresh group flight when everyone returns." },
  };
  return copy[status];
}

export function getGroupFlightRemainingSeconds(durationSeconds: number, elapsedSeconds: number) {
  return Math.max(0, Math.round(durationSeconds) - Math.round(elapsedSeconds));
}

export function formatGroupFlightClock(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

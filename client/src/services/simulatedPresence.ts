const SIMULATED_TRAVELER_MIN = 30;
const SIMULATED_TRAVELER_MAX = 70;

function hashHourKey(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getLocalHourKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  return `${year}-${month}-${day}-${hour}`;
}

/**
 * Provides an explicitly simulated activity estimate for the landing experience.
 * The value is stable within the user's local hour and always remains 30–70.
 */
export function getSimulatedTravelerCount(date = new Date()) {
  const range = SIMULATED_TRAVELER_MAX - SIMULATED_TRAVELER_MIN + 1;
  return SIMULATED_TRAVELER_MIN + hashHourKey(getLocalHourKey(date)) % range;
}

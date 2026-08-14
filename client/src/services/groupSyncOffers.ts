export type GroupLocationSyncOfferStatus =
  | "pending"
  | "used"
  | "invalidated_by_new_solo_flight"
  | "unavailable_after_location_change";

export function groupSyncOfferCopy(status: GroupLocationSyncOfferStatus, destinationLabel: string) {
  if (status === "pending") {
    return {
      title: `Set my solo location to ${destinationLabel}`,
      description: "Optional manual update from this completed group flight. It is not recorded as a solo completion.",
      action: "Update solo location",
    };
  }
  if (status === "used") return { title: "Solo location updated", description: "You used this manual group-flight location update.", action: null };
  if (status === "invalidated_by_new_solo_flight") return { title: "Offer expired", description: "A new solo flight started before this offer was used.", action: null };
  return { title: "Offer unavailable", description: "Your solo location changed before this offer was used.", action: null };
}

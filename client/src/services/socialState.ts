export type FocusSocialRelation = "friend" | "incoming" | "outgoing" | "blocked";

export function socialRelationLabel(relation: FocusSocialRelation) {
  switch (relation) {
    case "friend": return "Friend";
    case "incoming": return "Incoming request";
    case "outgoing": return "Request sent";
    case "blocked": return "Blocked";
  }
}

export function socialEmptyStateCopy(relation: "friends" | "requests" | "blocked") {
  if (relation === "friends") return "Friends are independent from rooms. Add a friend from a profile you can view.";
  if (relation === "requests") return "Friend requests will appear here when another pilot wants to connect.";
  return "Blocked pilots cannot view your profile through social access or send new requests.";
}

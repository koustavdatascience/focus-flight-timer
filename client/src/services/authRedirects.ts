export type AuthRedirectIntent = "oauth" | "password-recovery";

export function getAuthRedirectUrl(origin: string, intent: AuthRedirectIntent) {
  const url = new URL("/", origin);
  if (intent === "password-recovery") url.searchParams.set("auth", "reset");
  return url.toString();
}

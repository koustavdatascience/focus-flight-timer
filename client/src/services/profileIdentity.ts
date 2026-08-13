export const HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9_]{1,18}[a-z0-9])?$/;

export function normalizeHandle(value: string) {
  return value.trim().toLowerCase();
}

export function getHandleIssue(value: string) {
  const handle = normalizeHandle(value);
  if (!handle) return null;
  return HANDLE_PATTERN.test(handle)
    ? null
    : "Use 3–20 lowercase letters, numbers, or underscores; begin and end with a letter or number.";
}

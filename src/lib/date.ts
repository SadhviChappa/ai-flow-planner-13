import { format, isValid, parseISO } from "date-fns";

/** Safely format an ISO-ish date string. Never throws on bad/empty input. */
export function formatDate(value: string | null | undefined, pattern = "MMM d, yyyy", fallback = "—") {
  if (!value) return fallback;
  const d = parseISO(value);
  if (!isValid(d)) return fallback;
  return format(d, pattern);
}

export function isValidDateString(value: string | null | undefined) {
  if (!value) return false;
  return isValid(parseISO(value));
}

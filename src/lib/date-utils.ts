import { format } from "date-fns";

/**
 * Invoice/payment/due/etc dates are stored as `timestamp` columns whose value
 * came from `new Date("YYYY-MM-DD")` — i.e. UTC midnight of the chosen day.
 * Rendering those Dates with local-timezone formatters in any US timezone
 * shifts the displayed day back by one (Friday UTC → Thursday local).
 *
 * `toCalendarDate` returns a Date whose LOCAL Y/M/D matches the original
 * value's UTC Y/M/D, so all the standard formatters render the correct
 * calendar day regardless of the viewer's timezone.
 */
export function toCalendarDate(value: Date | string | number | null | undefined): Date {
  if (value === null || value === undefined) return new Date(NaN);
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return d;
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Format a stored calendar date using date-fns, honoring its UTC day. */
export function formatCalendarDate(
  value: Date | string | number | null | undefined,
  fmt: string = "MMM dd, yyyy",
): string {
  const d = toCalendarDate(value);
  if (isNaN(d.getTime())) return "";
  return format(d, fmt);
}

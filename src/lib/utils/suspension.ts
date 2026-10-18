import { SUSPENSION_DAYS } from "@/types/report";

/** True when `value` is an integer number of days within the allowed range. */
export function isValidSuspensionDays(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= SUSPENSION_DAYS.MIN &&
    value <= SUSPENSION_DAYS.MAX
  );
}

/** End date of a suspension starting at `from` and lasting `days` days. */
export function suspensionEndDate(days: number, from: Date = new Date()): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

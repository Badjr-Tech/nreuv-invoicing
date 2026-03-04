import { addDays, addWeeks, addMonths, differenceInDays } from "date-fns";

export interface GlobalSchedule {
  startDate: Date | null;
  recurrence: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "CUSTOM";
  customIntervalDays: number | null;
  billingPeriodLengthDays: number | null;
  billingPeriodEndOffsetDays: number | null;
}

export interface PayPeriod {
  invoiceDate: Date;
  periodStart: Date;
  periodEnd: Date;
  label: string;
}

export function generatePayPeriods(schedule: GlobalSchedule, count: number = 10): PayPeriod[] {
  if (!schedule.startDate) {
    return [];
  }

  const periods: PayPeriod[] = [];
  let currentDate = new Date(schedule.startDate);

  const lengthDays = schedule.billingPeriodLengthDays || 14; // Default 14 days
  const offsetDays = schedule.billingPeriodEndOffsetDays || 0; // Default 0 offset

  for (let i = 0; i < count; i++) {
    // Calculate period start and end relative to current invoice date
    // End date is (offset) days before the invoice date
    const periodEnd = addDays(currentDate, -offsetDays);
    // Start date is (length - 1) days before the end date, inclusive
    const periodStart = addDays(periodEnd, -(lengthDays - 1));

    periods.push({
      invoiceDate: new Date(currentDate),
      periodStart,
      periodEnd,
      label: `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`,
    });

    // Advance to next invoice date based on recurrence
    if (schedule.recurrence === "WEEKLY") {
      currentDate = addWeeks(currentDate, 1);
    } else if (schedule.recurrence === "BIWEEKLY") {
      currentDate = addWeeks(currentDate, 2);
    } else if (schedule.recurrence === "MONTHLY") {
      currentDate = addMonths(currentDate, 1);
    } else if (schedule.recurrence === "CUSTOM" && schedule.customIntervalDays) {
      currentDate = addDays(currentDate, schedule.customIntervalDays);
    } else {
      // Fallback
      currentDate = addWeeks(currentDate, 2);
    }
  }

  return periods;
}

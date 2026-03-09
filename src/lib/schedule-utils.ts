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
  let currentEndOfBillingPeriod = new Date(schedule.startDate); // startDate is now the first End of Billing Period

  const lengthDays = schedule.billingPeriodLengthDays || 14;

  for (let i = 0; i < count; i++) {
    const periodStart = addDays(currentEndOfBillingPeriod, -(lengthDays - 1)); // Start of coverage range

    periods.push({
      invoiceDate: currentEndOfBillingPeriod, // User picks this date, it is the EOBP
      periodStart: periodStart,
      periodEnd: currentEndOfBillingPeriod,
      label: `${periodStart.toLocaleDateString()} - ${currentEndOfBillingPeriod.toLocaleDateString()}`,
    });

    // Advance to the next End of Billing Period based on recurrence
    if (schedule.recurrence === "WEEKLY") {
      currentEndOfBillingPeriod = addWeeks(currentEndOfBillingPeriod, 1);
    } else if (schedule.recurrence === "BIWEEKLY") {
      currentEndOfBillingPeriod = addWeeks(currentEndOfBillingPeriod, 2);
    } else if (schedule.recurrence === "MONTHLY") {
      currentEndOfBillingPeriod = addMonths(currentEndOfBillingPeriod, 1);
    } else if (schedule.recurrence === "CUSTOM" && schedule.customIntervalDays) {
      currentEndOfBillingPeriod = addDays(currentEndOfBillingPeriod, schedule.customIntervalDays);
    } else {
      // Fallback
      currentEndOfBillingPeriod = addWeeks(currentEndOfBillingPeriod, 2);
    }
  }

  return periods;
}

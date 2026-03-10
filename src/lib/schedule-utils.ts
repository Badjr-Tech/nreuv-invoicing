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
  let currentPaymentDate = new Date(schedule.startDate); // startDate is now the first Payment Date

  const coverageLengthDays = schedule.billingPeriodLengthDays || 14; // This is the length of the coverage period

  for (let i = 0; i < count; i++) {
    const periodEnd = currentPaymentDate; // Coverage ends on Payment Date
    const periodStart = addDays(currentPaymentDate, -(coverageLengthDays - 1)); // Coverage starts 'coverageLengthDays - 1' days before Payment Date

    periods.push({
      invoiceDate: currentPaymentDate, // User picks this date, it is the Payment Date
      periodStart: periodStart,
      periodEnd: periodEnd,
      label: `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`,
    });

    // Advance to the next Payment Date based on recurrence
    if (schedule.recurrence === "WEEKLY") {
      currentPaymentDate = addWeeks(currentPaymentDate, 1);
    } else if (schedule.recurrence === "BIWEEKLY") {
      currentPaymentDate = addWeeks(currentPaymentDate, 2);
    } else if (schedule.recurrence === "MONTHLY") {
      currentPaymentDate = addMonths(currentPaymentDate, 1);
    } else if (schedule.recurrence === "CUSTOM" && schedule.customIntervalDays) {
      currentPaymentDate = addDays(currentPaymentDate, schedule.customIntervalDays);
    } else {
      // Fallback
      currentPaymentDate = addWeeks(currentPaymentDate, 2);
    }
  }

  return periods;
}

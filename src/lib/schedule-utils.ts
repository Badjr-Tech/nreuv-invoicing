import { addDays, addWeeks, addMonths, differenceInDays } from "date-fns";

/**
 * Extend a submission deadline through the following weekend.
 * Fri → Sun, Sat → Sun, otherwise unchanged. The point is that weekend
 * work done after a Friday deadline still counts in the current pay
 * period, and the coverage window slides with it.
 */
export function extendDeadlineThroughWeekend(date: Date): Date {
  const day = date.getDay(); // 0 = Sun … 6 = Sat
  if (day === 5) return addDays(date, 2);
  if (day === 6) return addDays(date, 1);
  return date;
}

export interface GlobalSchedule {
  startDate: Date | null;
  recurrence: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "CUSTOM";
  customIntervalDays: number | null;
  billingPeriodLengthDays: number | null; // This is now Coverage Period Length
  submissionOffsetDays: number | null; // Days before Payment Date that invoice must be submitted
}

export interface PayPeriod {
  invoiceDate: Date; // This is now the Payment Date
  periodStart: Date;
  periodEnd: Date;
  submissionDeadline: Date; // Pre-calculated submission deadline for this period
  label: string; // The label will show Payment Date (Coverage Start - Coverage End)
}

export function generatePayPeriods(schedule: GlobalSchedule, count: number = 10): PayPeriod[] {
  if (!schedule.startDate) {
    return [];
  }

  const periods: PayPeriod[] = [];
  let currentPaymentDate = new Date(schedule.startDate); // startDate is now the first Payment Date

  const coverageLengthDays = schedule.billingPeriodLengthDays || 14; // This is the length of the coverage period
  const submissionOffsetDays = schedule.submissionOffsetDays ?? 7; // Days before Payment Date for Submission Deadline

  for (let i = 0; i < count; i++) {
    // Raw deadline then extend through the following weekend (Fri→Sun, Sat→Sun).
    const rawDeadline = addDays(currentPaymentDate, -submissionOffsetDays);
    const submissionDeadline = extendDeadlineThroughWeekend(rawDeadline);
    const coverageEndDate = submissionDeadline;
    const coverageStartDate = addDays(coverageEndDate, -(coverageLengthDays - 1));

    periods.push({
      invoiceDate: currentPaymentDate, // User picks this date, it is the Payment Date
      periodStart: coverageStartDate,
      periodEnd: coverageEndDate,
      submissionDeadline: submissionDeadline,
      label: `Payment: ${currentPaymentDate.toLocaleDateString()} (Coverage: ${coverageStartDate.toLocaleDateString()} - ${coverageEndDate.toLocaleDateString()})`,
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

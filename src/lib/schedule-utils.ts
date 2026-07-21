import { addDays, addWeeks, addMonths, differenceInDays } from "date-fns";

/**
 * Business rule: the invoice submission deadline is the Monday of the
 * same week as the payment date (i.e. the Monday before a Friday payroll).
 *
 * If the payment date IS a Monday, we return that same day (Monday of its
 * own week). If it's Sunday, we walk back to the previous Monday.
 */
export function mondayBeforePayment(paymentDate: Date): Date {
  const day = paymentDate.getDay(); // 0 = Sun, 1 = Mon … 6 = Sat
  const daysBack = day === 0 ? 6 : day - 1;
  return addDays(paymentDate, -daysBack);
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

  for (let i = 0; i < count; i++) {
    // Deadline = Monday of the payroll week. submissionOffsetDays is left
    // in the settings table for backwards compat but no longer drives the
    // deadline calculation — the "Monday before payroll" rule wins.
    const submissionDeadline = mondayBeforePayment(currentPaymentDate);
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

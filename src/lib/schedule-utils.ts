import { addDays, addWeeks, addMonths, differenceInDays } from "date-fns";

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
    // Calculate Submission Deadline (which is also the Coverage End Date)
    const submissionDeadline = addDays(currentPaymentDate, -submissionOffsetDays);
    const coverageEndDate = submissionDeadline;
    const coverageStartDate = addDays(coverageEndDate, -(coverageLengthDays - 1));

    periods.push({
      invoiceDate: currentPaymentDate, // User picks this date, it is the Payment Date
      periodStart: coverageStartDate,
      periodEnd: coverageEndDate,
      submissionDeadline: submissionDeadline,
      label: `${currentPaymentDate.toLocaleDateString()} (Covers: ${coverageStartDate.toLocaleDateString()} - ${coverageEndDate.toLocaleDateString()})`,
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

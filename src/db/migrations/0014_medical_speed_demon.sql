ALTER TABLE "invoice_deadline_settings" ADD COLUMN "submission_offset_days" integer;--> statement-breakpoint
ALTER TABLE "invoice_deadline_settings" DROP COLUMN "billing_period_end_offset_days";--> statement-breakpoint
ALTER TABLE "invoice_deadline_settings" DROP COLUMN "payment_offset_days";
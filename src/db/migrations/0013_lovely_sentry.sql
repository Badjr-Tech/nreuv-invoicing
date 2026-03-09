ALTER TABLE "invoice_deadline_settings" ADD COLUMN "payment_offset_days" integer;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "invoice_number" serial NOT NULL;
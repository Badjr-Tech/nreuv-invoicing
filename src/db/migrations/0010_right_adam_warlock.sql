ALTER TABLE "payment_schedule" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "payment_schedule" CASCADE;--> statement-breakpoint
ALTER TABLE "invoice" DROP CONSTRAINT "invoice_payment_schedule_id_payment_schedule_id_fk";
--> statement-breakpoint
ALTER TABLE "invoice" DROP COLUMN "payment_schedule_id";
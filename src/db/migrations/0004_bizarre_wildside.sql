ALTER TYPE "public"."role" ADD VALUE 'EMPLOYEE';--> statement-breakpoint
ALTER TABLE "account_request" ADD COLUMN "processed_at" timestamp;
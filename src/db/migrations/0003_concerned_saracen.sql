CREATE TYPE "public"."account_request_status" AS ENUM('PENDING', 'APPROVED', 'DENIED');--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "account_request" ADD COLUMN "status" "account_request_status" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email_verified" timestamp;
ALTER TYPE "public"."invoice_status" ADD VALUE 'PENDING_MANAGER' BEFORE 'APPROVED';--> statement-breakpoint
ALTER TYPE "public"."invoice_status" ADD VALUE 'PENDING_ADMIN' BEFORE 'APPROVED';--> statement-breakpoint
ALTER TABLE "invoice_item" ADD COLUMN "date" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "manager_id" uuid;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_manager_id_user_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
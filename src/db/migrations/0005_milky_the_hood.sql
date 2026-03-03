CREATE TABLE "allowed_invoice_date" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"description" text,
	CONSTRAINT "allowed_invoice_date_date_unique" UNIQUE("date")
);

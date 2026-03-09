CREATE TABLE "category_bundle_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bundle_id" uuid NOT NULL,
	"category_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_bundle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "category_bundle_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_category_bundle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bundle_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "category_bundle_category" ADD CONSTRAINT "category_bundle_category_bundle_id_category_bundle_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."category_bundle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_bundle_category" ADD CONSTRAINT "category_bundle_category_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_category_bundle" ADD CONSTRAINT "user_category_bundle_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_category_bundle" ADD CONSTRAINT "user_category_bundle_bundle_id_category_bundle_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."category_bundle"("id") ON DELETE cascade ON UPDATE no action;
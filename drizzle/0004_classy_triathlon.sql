CREATE TABLE "squish_photo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"squish_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "squish_photo" ADD CONSTRAINT "squish_photo_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "squish_photo" ADD CONSTRAINT "squish_photo_squish_id_squish_id_fk" FOREIGN KEY ("squish_id") REFERENCES "public"."squish"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "squish_photo_tenant_id_idx" ON "squish_photo" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "squish_photo_squish_id_idx" ON "squish_photo" USING btree ("squish_id");
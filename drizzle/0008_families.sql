CREATE TABLE "family" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"emoji" text DEFAULT '🌙' NOT NULL,
	"color" text DEFAULT 'gold' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "squish" ADD COLUMN "family_id" uuid;--> statement-breakpoint
ALTER TABLE "family" ADD CONSTRAINT "family_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "family_tenant_id_idx" ON "family" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "squish" ADD CONSTRAINT "squish_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "squish_family_id_idx" ON "squish" USING btree ("family_id");
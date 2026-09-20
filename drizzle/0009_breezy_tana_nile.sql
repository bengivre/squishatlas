CREATE TABLE "orbit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_tenant_id" uuid NOT NULL,
	"saved_tenant_id" uuid NOT NULL,
	"label" text,
	"preferred_page" text DEFAULT 'gallery' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orbit_owner_saved_unique" UNIQUE("owner_tenant_id","saved_tenant_id"),
	CONSTRAINT "orbit_not_self" CHECK ("orbit"."owner_tenant_id" <> "orbit"."saved_tenant_id")
);
--> statement-breakpoint
ALTER TABLE "orbit" ADD CONSTRAINT "orbit_owner_tenant_id_tenant_id_fk" FOREIGN KEY ("owner_tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orbit" ADD CONSTRAINT "orbit_saved_tenant_id_tenant_id_fk" FOREIGN KEY ("saved_tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orbit_owner_tenant_id_idx" ON "orbit" USING btree ("owner_tenant_id");
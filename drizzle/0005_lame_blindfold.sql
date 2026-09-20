CREATE TABLE "relationship" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"from_squish_id" uuid NOT NULL,
	"to_squish_id" uuid NOT NULL,
	"type" text NOT NULL,
	"pair_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "relationship" ADD CONSTRAINT "relationship_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship" ADD CONSTRAINT "relationship_from_squish_id_squish_id_fk" FOREIGN KEY ("from_squish_id") REFERENCES "public"."squish"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship" ADD CONSTRAINT "relationship_to_squish_id_squish_id_fk" FOREIGN KEY ("to_squish_id") REFERENCES "public"."squish"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "relationship_tenant_id_idx" ON "relationship" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "relationship_from_squish_id_idx" ON "relationship" USING btree ("from_squish_id");--> statement-breakpoint
CREATE INDEX "relationship_pair_id_idx" ON "relationship" USING btree ("pair_id");--> statement-breakpoint
CREATE UNIQUE INDEX "relationship_from_to_unique" ON "relationship" USING btree ("from_squish_id","to_squish_id");
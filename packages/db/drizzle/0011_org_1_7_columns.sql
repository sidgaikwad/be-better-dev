ALTER TABLE "team" ADD COLUMN "member_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "team_member" ADD COLUMN "membership_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "teamMember_membershipKey_uidx" ON "team_member" USING btree ("membership_key");
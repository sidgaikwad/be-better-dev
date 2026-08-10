CREATE TABLE "note" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" text,
	"quote" text,
	"prefix" text,
	"suffix" text,
	"occurrence" integer DEFAULT 0 NOT NULL,
	"body" text NOT NULL,
	"color" text DEFAULT 'amber' NOT NULL,
	"font_family" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "note_userId_lessonId_idx" ON "note" USING btree ("user_id","lesson_id");--> statement-breakpoint
CREATE INDEX "note_userId_createdAt_idx" ON "note" USING btree ("user_id","created_at");
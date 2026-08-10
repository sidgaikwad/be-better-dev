CREATE TABLE "activity_day" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"day" date NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"lessons" integer DEFAULT 0 NOT NULL,
	"seconds" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badge_award" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"badge" text NOT NULL,
	"title" text NOT NULL,
	"icon" text NOT NULL,
	"awarded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_part" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_section" (
	"id" text PRIMARY KEY NOT NULL,
	"part_id" text NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"badge_icon" text NOT NULL,
	"badge_title" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_unit" (
	"id" text PRIMARY KEY NOT NULL,
	"section_id" text NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson" (
	"id" text PRIMARY KEY NOT NULL,
	"unit_id" text NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"xp" integer DEFAULT 20 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"correct" integer NOT NULL,
	"total" integer NOT NULL,
	"seconds" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_item" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"position" integer NOT NULL,
	"kind" text DEFAULT 'mcq' NOT NULL,
	"prompt" text NOT NULL,
	"options" jsonb NOT NULL,
	"answer_index" integer NOT NULL,
	"explanation" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_item" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"quiz_item_id" text NOT NULL,
	"due_at" timestamp NOT NULL,
	"interval_days" integer DEFAULT 2 NOT NULL,
	"last_result" boolean,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "xp_event" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"kind" text NOT NULL,
	"ref_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_day" ADD CONSTRAINT "activity_day_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_award" ADD CONSTRAINT "badge_award_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_part" ADD CONSTRAINT "course_part_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_section" ADD CONSTRAINT "course_section_part_id_course_part_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."course_part"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_unit" ADD CONSTRAINT "course_unit_section_id_course_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."course_section"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_unit_id_course_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."course_unit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_item" ADD CONSTRAINT "quiz_item_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_item" ADD CONSTRAINT "review_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_item" ADD CONSTRAINT "review_item_quiz_item_id_quiz_item_id_fk" FOREIGN KEY ("quiz_item_id") REFERENCES "public"."quiz_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_event" ADD CONSTRAINT "xp_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activityDay_userId_day_uidx" ON "activity_day" USING btree ("user_id","day");--> statement-breakpoint
CREATE UNIQUE INDEX "badgeAward_userId_badge_uidx" ON "badge_award" USING btree ("user_id","badge");--> statement-breakpoint
CREATE INDEX "coursePart_courseId_idx" ON "course_part" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "courseSection_partId_idx" ON "course_section" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "courseUnit_sectionId_idx" ON "course_unit" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "lesson_unitId_idx" ON "lesson" USING btree ("unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lessonProgress_userId_lessonId_uidx" ON "lesson_progress" USING btree ("user_id","lesson_id");--> statement-breakpoint
CREATE INDEX "lessonProgress_lessonId_idx" ON "lesson_progress" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "quizItem_lessonId_idx" ON "quiz_item" USING btree ("lesson_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviewItem_userId_quizItemId_uidx" ON "review_item" USING btree ("user_id","quiz_item_id");--> statement-breakpoint
CREATE INDEX "reviewItem_userId_dueAt_idx" ON "review_item" USING btree ("user_id","due_at");--> statement-breakpoint
CREATE INDEX "xpEvent_userId_createdAt_idx" ON "xp_event" USING btree ("user_id","created_at");
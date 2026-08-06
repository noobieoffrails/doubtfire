CREATE TABLE "room" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "routine" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cadence_days" integer NOT NULL,
	"includes_routine_id" uuid,
	"sort_order" integer NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "routine_cadence_days_positive" CHECK ("routine"."cadence_days" > 0),
	CONSTRAINT "routine_does_not_include_itself" CHECK ("routine"."includes_routine_id" is null or "routine"."includes_routine_id" <> "routine"."id")
);
--> statement-breakpoint
CREATE TABLE "run_task" (
	"run_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	CONSTRAINT "run_task_run_id_task_id_pk" PRIMARY KEY("run_id","task_id")
);
--> statement-breakpoint
CREATE TABLE "run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"closed_by_rollover" boolean DEFAULT false NOT NULL,
	CONSTRAINT "run_rollover_requires_closed_at" CHECK (not "run"."closed_by_rollover" or "run"."closed_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" text NOT NULL,
	"note" text,
	"room_id" uuid NOT NULL,
	"group_label" text,
	"routine_id" uuid NOT NULL,
	"sort_order" integer NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tick" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"ticked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "routine" ADD CONSTRAINT "routine_includes_routine_id_routine_id_fk" FOREIGN KEY ("includes_routine_id") REFERENCES "public"."routine"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_task" ADD CONSTRAINT "run_task_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_task" ADD CONSTRAINT "run_task_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run" ADD CONSTRAINT "run_routine_id_routine_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routine"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_routine_id_routine_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routine"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tick" ADD CONSTRAINT "tick_presented_task_fk" FOREIGN KEY ("run_id","task_id") REFERENCES "public"."run_task"("run_id","task_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "room_sort_order_idx" ON "room" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "routine_sort_order_idx" ON "routine" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "run_task_task_id_idx" ON "run_task" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "run_started_at_idx" ON "run" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "run_closed_at_idx" ON "run" USING btree ("closed_at");--> statement-breakpoint
CREATE INDEX "task_room_sort_order_idx" ON "task" USING btree ("room_id","sort_order");--> statement-breakpoint
CREATE INDEX "task_routine_idx" ON "task" USING btree ("routine_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tick_run_task_unique_idx" ON "tick" USING btree ("run_id","task_id");--> statement-breakpoint
CREATE INDEX "tick_task_ticked_at_idx" ON "tick" USING btree ("task_id","ticked_at");
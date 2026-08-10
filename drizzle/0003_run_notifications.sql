CREATE FUNCTION "notify_run_change"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
	"changed_run_id" uuid;
BEGIN
	IF TG_TABLE_NAME = 'run' THEN
		"changed_run_id" := COALESCE(NEW."id", OLD."id");
	ELSE
		"changed_run_id" := COALESCE(NEW."run_id", OLD."run_id");
	END IF;

	PERFORM pg_notify(
		'doubtfire_run_change',
		json_build_object('runId', "changed_run_id")::text
	);
	RETURN NULL;
END
$$;
--> statement-breakpoint
CREATE TRIGGER "run_change_notification"
AFTER INSERT OR UPDATE OF "closed_at", "closed_by_rollover" ON "run"
FOR EACH ROW
EXECUTE FUNCTION "notify_run_change"();
--> statement-breakpoint
CREATE TRIGGER "tick_change_notification"
AFTER INSERT OR DELETE ON "tick"
FOR EACH ROW
EXECUTE FUNCTION "notify_run_change"();

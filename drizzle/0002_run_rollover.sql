CREATE FUNCTION "run_rollover_boundary"(
	"at_time" timestamptz,
	"household_timezone" text
)
RETURNS timestamptz
LANGUAGE sql
STABLE
AS $$
	SELECT CASE
		WHEN "at_time" AT TIME ZONE "household_timezone"
			< date_trunc('day', "at_time" AT TIME ZONE "household_timezone") + interval '4 hours'
		THEN (
			date_trunc('day', "at_time" AT TIME ZONE "household_timezone")
			- interval '1 day'
			+ interval '4 hours'
		) AT TIME ZONE "household_timezone"
		ELSE (
			date_trunc('day', "at_time" AT TIME ZONE "household_timezone")
			+ interval '4 hours'
		) AT TIME ZONE "household_timezone"
	END
$$;
--> statement-breakpoint
CREATE FUNCTION "close_stale_runs"(
	"at_time" timestamptz,
	"household_timezone" text
)
RETURNS TABLE("run_id" uuid)
LANGUAGE sql
VOLATILE
AS $$
	UPDATE "run"
	SET
		"closed_at" = "run_rollover_boundary"("at_time", "household_timezone"),
		"closed_by_rollover" = true
	WHERE "closed_at" IS NULL
		AND "started_at" < "run_rollover_boundary"("at_time", "household_timezone")
	RETURNING "id"
$$;

CREATE TABLE IF NOT EXISTS "goals" (
	"id" text PRIMARY KEY NOT NULL,
	"tittle" text NOT NULL,
	"disired_weekly_frequency" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"contribution" integer,
	"withdrawal" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "ledger_years" (
	"year" integer PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"identifier" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_identifier_unique" UNIQUE("identifier")
);
--> statement-breakpoint
CREATE TABLE "year_members" (
	"year" integer NOT NULL,
	"member_id" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "year_members_year_member_id_pk" PRIMARY KEY("year","member_id")
);
--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "year_members" ADD CONSTRAINT "year_members_year_ledger_years_year_fk" FOREIGN KEY ("year") REFERENCES "public"."ledger_years"("year") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "year_members" ADD CONSTRAINT "year_members_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "entries_member_year_month" ON "entries" USING btree ("member_id","year","month");



SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."job_status" AS ENUM (
    'NEW',
    'SCHEDULED',
    'IN_PROGRESS',
    'RESCHEDULED',
    'COMPLETED',
    'CLOSED',
    'INCOMPLETE',
    'EMERGENCY',
    'WAITING_APPROVAL',
    'WAITING_PARTS',
    'CANCELED',
    'DECLINED',
    'WAITING_TO_BE_SCHEDULED',
    'RESCHEDULE'
);


ALTER TYPE "public"."job_status" OWNER TO "postgres";


CREATE TYPE "public"."market_name" AS ENUM (
    'San Antonio',
    'Dallas',
    'NorCal',
    'Washington'
);


ALTER TYPE "public"."market_name" OWNER TO "postgres";


CREATE TYPE "public"."priority_level" AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);


ALTER TYPE "public"."priority_level" OWNER TO "postgres";


CREATE TYPE "public"."request_status" AS ENUM (
    'NEW',
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CLOSED',
    'INCOMPLETE',
    'WAITING_APPROVAL',
    'WAITING_PARTS',
    'RESCHEDULED',
    'CANCELED'
);


ALTER TYPE "public"."request_status" OWNER TO "postgres";


CREATE TYPE "public"."service_category" AS ENUM (
    'GENERAL',
    'MECHANICAL',
    'ELECTRICAL',
    'OTHER'
);


ALTER TYPE "public"."service_category" OWNER TO "postgres";


CREATE TYPE "public"."service_type" AS ENUM (
    'Oil Change',
    'Brake Service',
    'Tire Service',
    'Battery Replacement',
    'Inspection',
    'Preventive Maintenance',
    'Diagnostics',
    'Repair',
    'Other'
);


ALTER TYPE "public"."service_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'OFFICE',
    'FLEET_MANAGER',
    'TECH',
    'CUSTOMER',
    'DISPATCH',
    'ADMIN'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_company"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select p.company_id from public.profiles p where p.id = auth.uid();
$$;


ALTER FUNCTION "public"."auth_company"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_company_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select company_id from public.profiles
  where id = auth.uid();
$$;


ALTER FUNCTION "public"."auth_company_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_customer_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select customer_id from public.profiles
  where id = auth.uid();
$$;


ALTER FUNCTION "public"."auth_customer_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_checkin_before_completed"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND NEW.checked_in_at IS NULL THEN
    RAISE EXCEPTION 'Tech must check in before marking job as COMPLETED';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_checkin_before_completed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_po_before_closed"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.status = 'CLOSED' AND NEW.po_number IS NULL THEN
    RAISE EXCEPTION 'PO number is required before marking job as CLOSED';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_po_before_closed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_company_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select company_id from public.profiles where id = auth.uid()
$$;


ALTER FUNCTION "public"."current_company_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_market_list"() RETURNS "text"[]
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT ARRAY(
    SELECT market
    FROM user_markets
    WHERE user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."current_user_market_list"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."customer_in_user_market"("cust_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM customers c
    WHERE c.id = cust_id
      AND c.market IN (
        SELECT market FROM user_markets WHERE user_id = auth.uid()
      )
  );
$$;


ALTER FUNCTION "public"."customer_in_user_market"("cust_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_company_id_for_user"("uid" "uuid") RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select company_id
  from public.profiles
  where id = uid
  limit 1
$$;


ALTER FUNCTION "public"."get_company_id_for_user"("uid" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."app_users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "auth_uid" "uuid",
    "company_id" "uuid",
    "role" "public"."user_role" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "customer_id" "uuid",
    "auth_user_id" "uuid"
);


ALTER TABLE "public"."app_users" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_app_user"() RETURNS "public"."app_users"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT * FROM app_users WHERE auth_uid = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."get_current_app_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_company_id"() RETURNS "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT company_id FROM app_users WHERE auth_uid = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."get_current_user_company_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_role"() RETURNS "public"."user_role"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT role FROM app_users WHERE auth_uid = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."get_current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"("uid" "uuid") RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT role
  FROM profiles
  WHERE id = uid;
$$;


ALTER FUNCTION "public"."get_user_role"("uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_market_access"("market_name" "public"."market_name") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM user_markets um
        WHERE um.user_id = auth.uid()
          AND um.market = has_market_access.market_name
    );
$$;


ALTER FUNCTION "public"."has_market_access"("market_name" "public"."market_name") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1
    from profiles p
    where p.id = auth.uid()
      and upper(coalesce(p.role,'')) in ('ADMIN','SUPERADMIN')
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_superadmin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT role = 'SUPERADMIN'
  FROM profiles
  WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."is_superadmin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_empty_text_to_null"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.dispatch_notes IS NOT NULL AND length(trim(NEW.dispatch_notes)) = 0 THEN
    NEW.dispatch_notes := NULL;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."normalize_empty_text_to_null"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_belongs_to_customer"("req_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM service_requests
    WHERE id = req_id
      AND customer_id = (
        SELECT customer_id FROM profiles WHERE id = auth.uid()
      )
  );
$$;


ALTER FUNCTION "public"."request_belongs_to_customer"("req_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_in_user_market"("req_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM service_requests sr
    JOIN customers c ON c.id = sr.customer_id
    WHERE sr.id = req_id
      AND c.market IN (
        SELECT market FROM user_markets WHERE user_id = auth.uid()
      )
  );
$$;


ALTER FUNCTION "public"."request_in_user_market"("req_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "location_id" "uuid",
    "service_type" "public"."service_type",
    "priority" "public"."priority_level" DEFAULT 'NORMAL'::"public"."priority_level",
    "status" "public"."job_status" DEFAULT 'NEW'::"public"."job_status" NOT NULL,
    "customer_notes" "text",
    "preferred_date_1" "date",
    "preferred_date_2" "date",
    "preferred_date_3" "date",
    "assigned_tech" "uuid",
    "scheduled_at" timestamp with time zone,
    "checked_in_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "incomplete_reason" "text",
    "po_number" "text",
    "invoice_number" "text",
    "is_emergency" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "odometer_miles" integer,
    "started_at" timestamp with time zone,
    "customer_id" "uuid",
    "dispatch_notes" "text",
    "fmc_company_id" "uuid",
    "fmc" "text" DEFAULT 'OTHER'::"text",
    "mileage" integer,
    "service_category" "public"."service_category" DEFAULT 'OTHER'::"public"."service_category" NOT NULL,
    "service" "text",
    "po" "text",
    "notes" "text",
    "request_techs" "uuid"[],
    "technician_id" "uuid",
    "fmc_text" "text",
    "keep_history" boolean DEFAULT false NOT NULL,
    "source" "text",
    "eta_start" timestamp with time zone,
    "eta_minutes" integer,
    "eta_live" boolean DEFAULT false,
    "tech_started_at" timestamp with time zone,
    "tech_finished_at" timestamp with time zone,
    "ai_status" "text",
    "ai_job_id" "uuid",
    "ai_po_number" "text",
    "ai_quote_id" "text",
    "ai_last_synced_at" timestamp with time zone,
    "scheduled_end_at" timestamp with time zone,
    CONSTRAINT "service_requests_odometer_miles_nonneg" CHECK ((("odometer_miles" IS NULL) OR ("odometer_miles" >= 0)))
);


ALTER TABLE "public"."service_requests" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."same_company_tech"("sr" "public"."service_requests") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists(
    select 1 from public.technicians t
    where t.id = sr.technician_id
      and t.company_id = sr.company_id
  ) or sr.technician_id is null
$$;


ALTER FUNCTION "public"."same_company_tech"("sr" "public"."service_requests") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_company_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if new.company_id is null then
    -- requires public.auth_company() that returns the caller's company_id from profiles
    new.company_id := public.auth_company();
  end if;
  return new;
end; $$;


ALTER FUNCTION "public"."set_company_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_company_id_from_inviter"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if new.company_id is null and auth.uid() is not null then
    -- copy inviter's company_id
    select company_id
    into new.company_id
    from profiles
    where id = auth.uid();
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_company_id_from_inviter"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_company_id_from_jwt"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if NEW.company_id is null then
    NEW.company_id := (current_setting('request.jwt.claims', true)::jsonb->>'company_id')::uuid;
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."set_company_id_from_jwt"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_completed_at_when_completed"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If moving into COMPLETED, set completed_at when missing or status changed
  IF NEW.status = 'COMPLETED'
     AND (OLD.status IS DISTINCT FROM NEW.status OR NEW.completed_at IS NULL) THEN
    NEW.completed_at = now();
  END IF;

  -- If moving out of COMPLETED, clear completed_at (optional; keeps it honest)
  IF OLD.status = 'COMPLETED' AND NEW.status <> 'COMPLETED' THEN
    NEW.completed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_completed_at_when_completed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_status_timestamps"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Set checked_in_at when status changes to IN_PROGRESS
  IF NEW.status = 'IN_PROGRESS' AND OLD.status != 'IN_PROGRESS' THEN
    NEW.checked_in_at = NOW();
  END IF;
  
  -- Set completed_at when status changes to COMPLETED
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    NEW.completed_at = NOW();
  END IF;
  
  -- Set closed_at when status changes to CLOSED
  IF NEW.status = 'CLOSED' AND OLD.status != 'CLOSED' THEN
    NEW.closed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_status_timestamps"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sr_enforce_flow"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- No change
  if TG_OP = 'UPDATE' and new.status = old.status then
    return new;
  end if;

  -- Always ensure timestamps are monotonic when set
  if new.started_at is not null and new.scheduled_at is not null and new.started_at < new.scheduled_at then
    new.started_at := new.scheduled_at;
  end if;
  if new.completed_at is not null and new.started_at is not null and new.completed_at < new.started_at then
    new.completed_at := new.started_at;
  end if;

  /*
    Allowed transitions:
      - NEW -> SCHEDULED / WAITING_APPROVAL / WAITING_PARTS / DECLINED / COMPLETED
      - WAITING_* / DECLINED -> NEW / SCHEDULED / COMPLETED
      - SCHEDULED -> IN_PROGRESS / COMPLETED
      - IN_PROGRESS -> COMPLETED
  */

  -- Direct COMPLETE (bypass dispatch/tech): auto-fill any missing stamps
  if new.status = 'COMPLETED' then
    if new.scheduled_at is null then new.scheduled_at := coalesce(old.scheduled_at, now()); end if;
    if new.started_at   is null then new.started_at   := coalesce(old.started_at,   new.scheduled_at); end if;
    if new.completed_at is null then new.completed_at := now(); end if;
    return new;
  end if;

  -- Normal flow checks (simple allowlist)
  if (old.status = 'NEW' and new.status in ('NEW','SCHEDULED','WAITING_APPROVAL','WAITING_PARTS','DECLINED'))
     or (old.status in ('WAITING_APPROVAL','WAITING_PARTS','DECLINED') and new.status in ('NEW','SCHEDULED'))
     or (old.status = 'SCHEDULED' and new.status in ('SCHEDULED','IN_PROGRESS'))
     or (old.status = 'IN_PROGRESS' and new.status in ('IN_PROGRESS')) then
    return new;
  end if;

  -- Fallback: allow idempotent updates that only touch non-status fields
  if new.status = old.status then
    return new;
  end if;

  -- Anything else: reject with clear message
  raise exception 'Invalid status transition: % -> %', old.status, new.status
    using hint = 'Set status to COMPLETED is allowed from any state if you also provide/fill timestamps.';
end
$$;


ALTER FUNCTION "public"."sr_enforce_flow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_set_note_author"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.author_id is null then
    new.author_id := auth.uid();
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."trg_set_note_author"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  );
$$;


ALTER FUNCTION "public"."user_is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vehicle_belongs_to_customer"("veh_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM vehicles
    WHERE id = veh_id
      AND customer_id = (
        SELECT customer_id FROM profiles WHERE id = auth.uid()
      )
  );
$$;


ALTER FUNCTION "public"."vehicle_belongs_to_customer"("veh_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vehicle_in_user_market"("veh_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM vehicles v
    JOIN customers c ON c.id = v.customer_id
    WHERE v.id = veh_id
      AND c.market IN (
        SELECT market FROM user_markets WHERE user_id = auth.uid()
      )
  );
$$;


ALTER FUNCTION "public"."vehicle_in_user_market"("veh_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."access_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "company_name" "text",
    "requested_role" "text" DEFAULT 'CUSTOMER'::"text",
    "note" "text",
    "status" "text" DEFAULT 'PENDING'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "approved_at" timestamp with time zone,
    CONSTRAINT "access_requests_requested_role_check" CHECK (("requested_role" = ANY (ARRAY['CUSTOMER'::"text", 'OFFICE'::"text", 'DISPATCH'::"text", 'TECH'::"text"]))),
    CONSTRAINT "access_requests_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'APPROVED'::"text", 'REJECTED'::"text"])))
);


ALTER TABLE "public"."access_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "location_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "service" "text" NOT NULL,
    "fmc" "text" NOT NULL,
    "mileage" integer,
    "status" "public"."request_status" DEFAULT 'NEW'::"public"."request_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "scheduled_at" timestamp with time zone,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "po" "text",
    "notes" "text",
    "technician_id" "uuid",
    "dispatch_notes" "text",
    "assigned_tech" "uuid",
    CONSTRAINT "requests_scheduled_requirements" CHECK ((("status" <> 'SCHEDULED'::"public"."request_status") OR (("technician_id" IS NOT NULL) AND ("scheduled_at" IS NOT NULL))))
);


ALTER TABLE "public"."requests" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."active_requests_view" AS
 SELECT "id",
    "company_id",
    "vehicle_id",
    "location_id",
    "customer_id",
    "service",
    "fmc",
    "mileage",
    "status",
    "created_at",
    "scheduled_at",
    "started_at",
    "completed_at",
    "po",
    "notes",
    "technician_id",
    "dispatch_notes",
    "assigned_tech"
   FROM "public"."requests"
  WHERE ("status" = ANY (ARRAY['NEW'::"public"."request_status", 'SCHEDULED'::"public"."request_status", 'IN_PROGRESS'::"public"."request_status"]));


ALTER VIEW "public"."active_requests_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_audit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_email" "text",
    "target_email" "text",
    "action" "text" NOT NULL,
    "payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_audit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_user_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid",
    "actor_email" "text",
    "target_id" "uuid",
    "target_email" "text",
    "action" "text" NOT NULL,
    "payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_user_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."autointegrate_errors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid",
    "job_id" "uuid",
    "error" "text",
    "context" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."autointegrate_errors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."autointegrate_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "last_status" "text",
    "ai_job_number" "text",
    "ai_quote_id" "text",
    "ai_po_number" "text",
    "payload" "jsonb",
    "response" "jsonb",
    "last_poll_response" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "submitted_at" timestamp with time zone,
    "approved_at" timestamp with time zone,
    "declined_at" timestamp with time zone,
    "last_polled_at" timestamp with time zone,
    "last_synced_at" timestamp with time zone
);


ALTER TABLE "public"."autointegrate_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."autointegrate_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid",
    "request_id" "uuid",
    "action" "text" NOT NULL,
    "message" "text",
    "payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."autointegrate_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "fmc" "text" NOT NULL,
    "account_number" "text",
    "contact_email" "text",
    "contact_phone" "text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_customer_markets" (
    "company_id" "uuid" NOT NULL,
    "market_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."company_customer_markets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_customer_vehicles" (
    "company_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."company_customer_vehicles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_locations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "city" "text",
    "state" "text",
    "zip" "text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "location_type" "text",
    "order_index" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    CONSTRAINT "company_locations_location_type_check" CHECK (("location_type" = ANY (ARRAY['MARKET'::"text", 'SITE'::"text"])))
);


ALTER TABLE "public"."company_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "contact_name" "text",
    "contact_email" "text",
    "contact_phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "approval_type" "text" DEFAULT 'MANAGED'::"text",
    "market" "public"."market_name"
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "location_id" "uuid",
    "year" integer,
    "make" "text",
    "model" "text",
    "vin" "text",
    "plate" "text",
    "unit_number" "text",
    "notes" "text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true NOT NULL,
    "fmc_company_id" "uuid",
    "display_name" "text",
    "customer_id" "uuid",
    CONSTRAINT "vehicle_identifier" CHECK ((("vin" IS NOT NULL) OR (("plate" IS NOT NULL) AND ("year" IS NOT NULL) AND ("make" IS NOT NULL))))
);


ALTER TABLE "public"."vehicles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."customer_vehicles_view" AS
 SELECT "v"."id" AS "vehicle_id",
    "v"."customer_id",
    "c"."name" AS "customer_name",
    "c"."market",
    "v"."unit_number",
    "v"."year",
    "v"."make",
    "v"."model",
    "v"."plate",
    "v"."vin",
    "v"."created_at"
   FROM ("public"."vehicles" "v"
     LEFT JOIN "public"."customers" "c" ON (("c"."id" = "v"."customer_id")));


ALTER VIEW "public"."customer_vehicles_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fmc_companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."fmc_companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fmc_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "label" "text" NOT NULL,
    "sort_order" integer DEFAULT 100 NOT NULL
);


ALTER TABLE "public"."fmc_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "request_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "url_work" "text" NOT NULL,
    "url_thumb" "text" NOT NULL,
    "key_work" "text" NOT NULL,
    "key_thumb" "text" NOT NULL,
    "sha256" "text" NOT NULL,
    "width" integer NOT NULL,
    "height" integer NOT NULL,
    "size_bytes" integer NOT NULL,
    "thumb_bytes" integer NOT NULL,
    "blurhash" "text",
    "taken_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "taken_by" "uuid" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '90 days'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "images_kind_check" CHECK (("kind" = ANY (ARRAY['before'::"text", 'after'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "company_id" "uuid",
    "location_ids" "jsonb",
    "technician_seed" "jsonb",
    "invited_by" "uuid",
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "used_at" timestamp with time zone
);


ALTER TABLE "public"."invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."office_inbox" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "request_id" "uuid",
    "message" "text",
    "type" "text"
);


ALTER TABLE "public"."office_inbox" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pdf_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "actor" "text",
    "actor_email" "text",
    "action" "text" NOT NULL,
    "meta" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pdf_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pdf_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "pdf_bytes" "bytea",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."pdf_shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "role" "text",
    "market" "text",
    "label" "text",
    "phone" "text",
    "location_id" "uuid",
    "active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recurring_inspections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "created_by" "uuid",
    "frequency" "text",
    "weekday" integer,
    "day_of_month" integer,
    "next_run" timestamp with time zone,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."recurring_inspections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."request_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "request_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."request_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_request_parts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "part_name" "text" NOT NULL,
    "part_number" "text",
    "quantity" integer DEFAULT 1 NOT NULL,
    "price" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "technician_id" "uuid"
);


ALTER TABLE "public"."service_request_parts" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."request_parts_view" AS
 SELECT "sp"."id",
    "sp"."request_id",
    "sp"."part_name",
    "sp"."part_number",
    "sp"."quantity",
    "sp"."price",
    "sp"."technician_id",
    "sp"."created_at",
    "r"."customer_id",
    "c"."name" AS "customer_name",
    "c"."market" AS "customer_market"
   FROM (("public"."service_request_parts" "sp"
     LEFT JOIN "public"."requests" "r" ON (("r"."id" = "sp"."request_id")))
     LEFT JOIN "public"."customers" "c" ON (("c"."id" = "r"."customer_id")));


ALTER VIEW "public"."request_parts_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."request_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid",
    "kind" "text",
    "url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "order_index" integer DEFAULT 0,
    "deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    "ai_damage_detected" boolean DEFAULT false,
    "ai_labels" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "request_photos_kind_check" CHECK (("kind" = ANY (ARRAY['before'::"text", 'after'::"text"])))
);


ALTER TABLE "public"."request_photos" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."request_photos_view" AS
 SELECT "p"."id",
    "p"."request_id",
    "p"."kind",
    "p"."url",
    "p"."created_at",
    "r"."customer_id",
    "c"."name" AS "customer_name",
    "c"."market" AS "customer_market"
   FROM (("public"."request_photos" "p"
     LEFT JOIN "public"."requests" "r" ON (("r"."id" = "p"."request_id")))
     LEFT JOIN "public"."customers" "c" ON (("c"."id" = "r"."customer_id")));


ALTER VIEW "public"."request_photos_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."request_techs" (
    "request_id" "uuid" NOT NULL,
    "tech_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "request_techs_position_check" CHECK ((("position" >= 1) AND ("position" <= 5)))
);


ALTER TABLE "public"."request_techs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedule_blocks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "request_id" "uuid",
    "technician_id" "uuid",
    "start_at" timestamp with time zone NOT NULL,
    "end_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."schedule_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "from_status" "public"."job_status",
    "to_status" "public"."job_status" NOT NULL,
    "event_type" "text" NOT NULL,
    "message" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."service_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_notes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "tech_id" "uuid" NOT NULL,
    "service_notes" "text" NOT NULL,
    "recommendations" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."service_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_request_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "author_id" "uuid",
    "author_user_id" "uuid"
);


ALTER TABLE "public"."service_request_notes" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."service_notes_view" AS
 SELECT "id" AS "note_id",
    "request_id",
    "text" AS "note",
    "author_user_id",
    "created_at"
   FROM "public"."service_request_notes" "n";


ALTER VIEW "public"."service_notes_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_parts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "part_name" "text" NOT NULL,
    "part_number" "text",
    "quantity" integer DEFAULT 1,
    "in_van" boolean DEFAULT false,
    "picked" boolean DEFAULT false,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."service_parts" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."service_parts_view" AS
 SELECT "rp"."id" AS "request_part_id",
    "rp"."request_id",
    "rp"."part_name",
    "rp"."part_number",
    "rp"."quantity",
    "rp"."price",
    "rp"."technician_id",
    "rp"."created_at",
    "r"."customer_id",
    "r"."status"
   FROM ("public"."service_request_parts" "rp"
     LEFT JOIN "public"."requests" "r" ON (("r"."id" = "rp"."request_id")));


ALTER VIEW "public"."service_parts_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_template_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid",
    "line_type" "text",
    "description" "text",
    "quantity" numeric DEFAULT 1,
    "hours" numeric,
    "part_number" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "service_template_lines_line_type_check" CHECK (("line_type" = ANY (ARRAY['labor'::"text", 'part'::"text"])))
);


ALTER TABLE "public"."service_template_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."service_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "customer_id" "uuid",
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."support_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "key" "text" NOT NULL,
    "value" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."technicians" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid"
);


ALTER TABLE "public"."technicians" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_locations" (
    "user_id" "uuid" NOT NULL,
    "location_id" "uuid" NOT NULL
);


ALTER TABLE "public"."user_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_markets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "market" "public"."market_name" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_markets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "email" "text",
    "role" "public"."user_role" DEFAULT 'CUSTOMER'::"public"."user_role" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vehicle_market_view" AS
 SELECT "v"."id" AS "vehicle_id",
    "v"."customer_id",
    "c"."market",
    "v"."unit_number",
    "v"."year",
    "v"."make",
    "v"."model",
    "v"."plate",
    "v"."vin"
   FROM ("public"."vehicles" "v"
     LEFT JOIN "public"."customers" "c" ON (("c"."id" = "v"."customer_id")));


ALTER VIEW "public"."vehicle_market_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_requests" AS
 SELECT "r"."id",
    "r"."company_id",
    "r"."vehicle_id",
    "r"."location_id",
    "r"."customer_id",
    "r"."service",
    "r"."fmc",
    "r"."mileage",
    "r"."status",
    "r"."created_at",
    "r"."scheduled_at",
    "r"."started_at",
    "r"."completed_at",
    "r"."po",
    "r"."notes",
    "r"."technician_id",
    "r"."dispatch_notes",
    "r"."assigned_tech",
    "v"."unit_number",
    "v"."year",
    "v"."make",
    "v"."model",
    "v"."plate",
    "c"."name" AS "customer_name"
   FROM (("public"."requests" "r"
     LEFT JOIN "public"."vehicles" "v" ON (("v"."id" = "r"."vehicle_id")))
     LEFT JOIN "public"."customers" "c" ON (("c"."id" = "r"."customer_id")));


ALTER VIEW "public"."view_requests" OWNER TO "postgres";


ALTER TABLE ONLY "public"."access_requests"
    ADD CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_audit"
    ADD CONSTRAINT "admin_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_auth_uid_key" UNIQUE ("auth_uid");



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_user_events"
    ADD CONSTRAINT "audit_user_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."autointegrate_errors"
    ADD CONSTRAINT "autointegrate_errors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."autointegrate_jobs"
    ADD CONSTRAINT "autointegrate_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."autointegrate_logs"
    ADD CONSTRAINT "autointegrate_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_customer_markets"
    ADD CONSTRAINT "company_customer_markets_pkey" PRIMARY KEY ("company_id", "market_id", "customer_id");



ALTER TABLE ONLY "public"."company_customer_vehicles"
    ADD CONSTRAINT "company_customer_vehicles_pkey" PRIMARY KEY ("company_id", "customer_id", "vehicle_id");



ALTER TABLE ONLY "public"."company_locations"
    ADD CONSTRAINT "company_locations_company_id_name_uniq" UNIQUE ("company_id", "name");



ALTER TABLE ONLY "public"."company_locations"
    ADD CONSTRAINT "company_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fmc_companies"
    ADD CONSTRAINT "fmc_companies_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."fmc_companies"
    ADD CONSTRAINT "fmc_companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fmc_options"
    ADD CONSTRAINT "fmc_options_label_key" UNIQUE ("label");



ALTER TABLE ONLY "public"."fmc_options"
    ADD CONSTRAINT "fmc_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."office_inbox"
    ADD CONSTRAINT "office_inbox_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pdf_logs"
    ADD CONSTRAINT "pdf_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pdf_shares"
    ADD CONSTRAINT "pdf_shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recurring_inspections"
    ADD CONSTRAINT "recurring_inspections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."request_notes"
    ADD CONSTRAINT "request_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."request_photos"
    ADD CONSTRAINT "request_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."request_techs"
    ADD CONSTRAINT "request_techs_pkey" PRIMARY KEY ("request_id", "tech_id");



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_blocks"
    ADD CONSTRAINT "schedule_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_events"
    ADD CONSTRAINT "service_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_notes"
    ADD CONSTRAINT "service_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_parts"
    ADD CONSTRAINT "service_parts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_request_notes"
    ADD CONSTRAINT "service_request_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_request_parts"
    ADD CONSTRAINT "service_request_parts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_template_lines"
    ADD CONSTRAINT "service_template_lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_templates"
    ADD CONSTRAINT "service_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_messages"
    ADD CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."technicians"
    ADD CONSTRAINT "technicians_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_locations"
    ADD CONSTRAINT "user_locations_pkey" PRIMARY KEY ("user_id", "location_id");



ALTER TABLE ONLY "public"."user_markets"
    ADD CONSTRAINT "user_markets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "app_users_auth_user_id_key" ON "public"."app_users" USING "btree" ("auth_user_id");



CREATE UNIQUE INDEX "company_locations_company_name_uniq" ON "public"."company_locations" USING "btree" ("company_id", "name");



CREATE INDEX "customers_company_name_idx" ON "public"."customers" USING "btree" ("company_id", "name");



CREATE INDEX "idx_admin_audit_created_at" ON "public"."admin_audit" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_admin_audit_target_email" ON "public"."admin_audit" USING "btree" ("target_email");



CREATE INDEX "idx_app_users_auth_uid" ON "public"."app_users" USING "btree" ("auth_uid");



CREATE INDEX "idx_app_users_company" ON "public"."app_users" USING "btree" ("company_id");



CREATE INDEX "idx_app_users_role" ON "public"."app_users" USING "btree" ("role");



CREATE INDEX "idx_audit_user_events_created_at" ON "public"."audit_user_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_user_events_target_email" ON "public"."audit_user_events" USING "btree" ("lower"("target_email"));



CREATE INDEX "idx_ccv_company_customer_vehicle" ON "public"."company_customer_vehicles" USING "btree" ("company_id", "customer_id", "vehicle_id");



CREATE INDEX "idx_company_locations_company" ON "public"."company_locations" USING "btree" ("company_id");



CREATE INDEX "idx_customers_company" ON "public"."customers" USING "btree" ("company_id");



CREATE INDEX "idx_customers_company_id" ON "public"."customers" USING "btree" ("company_id");



CREATE INDEX "idx_customers_market" ON "public"."customers" USING "btree" ("market");



CREATE INDEX "idx_events_request" ON "public"."service_events" USING "btree" ("request_id");



CREATE INDEX "idx_images_created_at" ON "public"."images" USING "btree" ("created_at");



CREATE INDEX "idx_images_request_id" ON "public"."images" USING "btree" ("request_id");



CREATE INDEX "idx_locations_company" ON "public"."locations" USING "btree" ("company_id");



CREATE INDEX "idx_notes_author_id" ON "public"."service_request_notes" USING "btree" ("author_id");



CREATE INDEX "idx_notes_author_user_id" ON "public"."service_request_notes" USING "btree" ("author_user_id");



CREATE INDEX "idx_notes_request" ON "public"."service_notes" USING "btree" ("request_id");



CREATE INDEX "idx_notes_request_created" ON "public"."service_request_notes" USING "btree" ("request_id", "created_at" DESC);



CREATE INDEX "idx_notes_request_id" ON "public"."service_request_notes" USING "btree" ("request_id");



CREATE INDEX "idx_parts_request" ON "public"."service_parts" USING "btree" ("request_id");



CREATE INDEX "idx_request_notes_request_created" ON "public"."request_notes" USING "btree" ("request_id", "created_at" DESC);



CREATE INDEX "idx_request_notes_request_id" ON "public"."request_notes" USING "btree" ("request_id");



CREATE INDEX "idx_request_photos_kind" ON "public"."request_photos" USING "btree" ("kind");



CREATE INDEX "idx_request_photos_not_deleted" ON "public"."request_photos" USING "btree" ("request_id", "order_index") WHERE ("deleted" = false);



CREATE INDEX "idx_request_photos_order_index" ON "public"."request_photos" USING "btree" ("order_index");



CREATE INDEX "idx_request_photos_request" ON "public"."request_photos" USING "btree" ("request_id");



CREATE INDEX "idx_request_photos_request_id" ON "public"."request_photos" USING "btree" ("request_id");



CREATE INDEX "idx_request_techs_request" ON "public"."request_techs" USING "btree" ("request_id");



CREATE INDEX "idx_request_techs_tech" ON "public"."request_techs" USING "btree" ("tech_id");



CREATE INDEX "idx_requests_company" ON "public"."service_requests" USING "btree" ("company_id");



CREATE INDEX "idx_requests_customer_id" ON "public"."requests" USING "btree" ("customer_id");



CREATE INDEX "idx_requests_location_id" ON "public"."requests" USING "btree" ("location_id");



CREATE INDEX "idx_requests_scheduled" ON "public"."service_requests" USING "btree" ("scheduled_at");



CREATE INDEX "idx_requests_scheduled_at" ON "public"."requests" USING "btree" ("scheduled_at");



CREATE INDEX "idx_requests_started_at" ON "public"."requests" USING "btree" ("started_at");



CREATE INDEX "idx_requests_status" ON "public"."service_requests" USING "btree" ("status");



CREATE INDEX "idx_requests_tech" ON "public"."service_requests" USING "btree" ("assigned_tech");



CREATE INDEX "idx_requests_vehicle_id" ON "public"."requests" USING "btree" ("vehicle_id");



CREATE INDEX "idx_rp_not_deleted" ON "public"."request_photos" USING "btree" ("request_id", "order_index", "deleted") WHERE ("deleted" = false);



CREATE INDEX "idx_rp_order" ON "public"."request_photos" USING "btree" ("order_index");



CREATE INDEX "idx_rp_request" ON "public"."request_photos" USING "btree" ("request_id");



CREATE INDEX "idx_schedule_blocks_tech" ON "public"."schedule_blocks" USING "btree" ("technician_id", "start_at", "end_at");



CREATE INDEX "idx_service_events_request_id" ON "public"."service_events" USING "btree" ("request_id");



CREATE INDEX "idx_service_events_user_id" ON "public"."service_events" USING "btree" ("user_id");



CREATE INDEX "idx_service_request_parts_part_number" ON "public"."service_request_parts" USING "btree" ("part_number");



CREATE INDEX "idx_service_request_parts_request_id" ON "public"."service_request_parts" USING "btree" ("request_id");



CREATE INDEX "idx_service_requests_company_status_created" ON "public"."service_requests" USING "btree" ("company_id", "status", "created_at" DESC);



CREATE INDEX "idx_service_requests_completed_at" ON "public"."service_requests" USING "btree" ("completed_at") WHERE ("status" = 'COMPLETED'::"public"."job_status");



CREATE INDEX "idx_service_requests_scheduled_at" ON "public"."service_requests" USING "btree" ("scheduled_at") WHERE ("status" = 'SCHEDULED'::"public"."job_status");



CREATE INDEX "idx_service_requests_started_at" ON "public"."service_requests" USING "btree" ("started_at") WHERE ("status" = 'IN_PROGRESS'::"public"."job_status");



CREATE INDEX "idx_service_requests_status" ON "public"."service_requests" USING "btree" ("status");



CREATE INDEX "idx_service_requests_status_scheduled" ON "public"."service_requests" USING "btree" ("status", "scheduled_at");



CREATE INDEX "idx_service_requests_vehicle" ON "public"."service_requests" USING "btree" ("vehicle_id");



CREATE INDEX "idx_sr_company_tech_status_created" ON "public"."service_requests" USING "btree" ("company_id", "technician_id", "status", "created_at" DESC);



CREATE INDEX "idx_srn_created_at" ON "public"."service_request_notes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_srn_request_id" ON "public"."service_request_notes" USING "btree" ("request_id");



CREATE INDEX "idx_technicians_company_active_name" ON "public"."technicians" USING "btree" ("company_id", "active", "full_name");



CREATE INDEX "idx_user_markets_market" ON "public"."user_markets" USING "btree" ("market");



CREATE INDEX "idx_user_markets_user_id" ON "public"."user_markets" USING "btree" ("user_id");



CREATE INDEX "idx_vehicles_company" ON "public"."vehicles" USING "btree" ("company_id");



CREATE INDEX "idx_vehicles_customer_id" ON "public"."vehicles" USING "btree" ("customer_id");



CREATE INDEX "idx_vehicles_location" ON "public"."vehicles" USING "btree" ("location_id");



CREATE INDEX "idx_vehicles_location_id" ON "public"."vehicles" USING "btree" ("location_id");



CREATE INDEX "idx_vehicles_plate" ON "public"."vehicles" USING "btree" ("plate");



CREATE INDEX "idx_vehicles_unit_number" ON "public"."vehicles" USING "btree" ("unit_number");



CREATE INDEX "images_company_request_idx" ON "public"."images" USING "btree" ("company_id", "request_id");



CREATE UNIQUE INDEX "images_company_sha_unique" ON "public"."images" USING "btree" ("company_id", "sha256");



CREATE INDEX "images_expires_idx" ON "public"."images" USING "btree" ("expires_at");



CREATE INDEX "invites_email_idx" ON "public"."invites" USING "btree" ("lower"("email"));



CREATE INDEX "requests_company_status_idx" ON "public"."requests" USING "btree" ("company_id", "status", "created_at" DESC);



CREATE INDEX "requests_customer_idx" ON "public"."requests" USING "btree" ("customer_id");



CREATE INDEX "requests_status_created_idx" ON "public"."requests" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "requests_vehicle_idx" ON "public"."requests" USING "btree" ("vehicle_id");



CREATE INDEX "service_requests_company_status_completed_idx" ON "public"."service_requests" USING "btree" ("company_id", "status", "completed_at" DESC);



CREATE INDEX "service_requests_request_techs_gin" ON "public"."service_requests" USING "gin" ("request_techs");



CREATE INDEX "service_requests_status_completed_idx" ON "public"."service_requests" USING "btree" ("status", "completed_at" DESC);



CREATE INDEX "service_requests_status_scheduled_idx" ON "public"."service_requests" USING "btree" ("status", "scheduled_at" DESC);



CREATE INDEX "service_requests_status_started_idx" ON "public"."service_requests" USING "btree" ("status", "started_at" DESC);



CREATE INDEX "sr_assigned_tech_status_idx" ON "public"."service_requests" USING "btree" ("assigned_tech", "status", "scheduled_at" DESC);



CREATE INDEX "sr_company_customer_status_idx" ON "public"."service_requests" USING "btree" ("company_id", "customer_id", "status");



CREATE INDEX "technicians_company_id_idx" ON "public"."technicians" USING "btree" ("company_id");



CREATE UNIQUE INDEX "technicians_user_id_unique" ON "public"."technicians" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE UNIQUE INDEX "uniq_company_locations_name_ci" ON "public"."company_locations" USING "btree" ("company_id", "lower"("name"));



CREATE UNIQUE INDEX "uq_locations_company_lower_name" ON "public"."locations" USING "btree" ("company_id", "lower"("name"));



CREATE UNIQUE INDEX "user_market_unique" ON "public"."user_markets" USING "btree" ("user_id", "market");



CREATE UNIQUE INDEX "ux_company_locations_company_lower_name" ON "public"."company_locations" USING "btree" ("company_id", "lower"("name"));



CREATE UNIQUE INDEX "vehicles_company_unit_number_unique" ON "public"."vehicles" USING "btree" ("company_id", "unit_number") WHERE (("unit_number" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "unit_number")) > 0));



CREATE OR REPLACE TRIGGER "app_users_updated_at" BEFORE UPDATE ON "public"."app_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "auto_set_status_timestamps" BEFORE UPDATE ON "public"."service_requests" FOR EACH ROW EXECUTE FUNCTION "public"."set_status_timestamps"();



CREATE OR REPLACE TRIGGER "companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "enforce_checkin_before_completed" BEFORE UPDATE ON "public"."service_requests" FOR EACH ROW WHEN (("new"."status" = 'COMPLETED'::"public"."job_status")) EXECUTE FUNCTION "public"."check_checkin_before_completed"();



CREATE OR REPLACE TRIGGER "enforce_po_before_closed" BEFORE UPDATE ON "public"."service_requests" FOR EACH ROW WHEN (("new"."status" = 'CLOSED'::"public"."job_status")) EXECUTE FUNCTION "public"."check_po_before_closed"();



CREATE OR REPLACE TRIGGER "service_requests_updated_at" BEFORE UPDATE ON "public"."service_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_note_author" BEFORE INSERT ON "public"."service_request_notes" FOR EACH ROW EXECUTE FUNCTION "public"."trg_set_note_author"();



CREATE OR REPLACE TRIGGER "trg_request_notes_company" BEFORE INSERT ON "public"."request_notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_company_id"();



CREATE OR REPLACE TRIGGER "trg_requests_dispatch_notes_normalize" BEFORE INSERT OR UPDATE ON "public"."requests" FOR EACH ROW EXECUTE FUNCTION "public"."normalize_empty_text_to_null"();



CREATE OR REPLACE TRIGGER "trg_set_company_id_from_jwt" BEFORE INSERT ON "public"."service_requests" FOR EACH ROW EXECUTE FUNCTION "public"."set_company_id_from_jwt"();



CREATE OR REPLACE TRIGGER "trg_set_completed_at_on_requests" BEFORE INSERT OR UPDATE ON "public"."service_requests" FOR EACH ROW EXECUTE FUNCTION "public"."set_completed_at_when_completed"();



CREATE OR REPLACE TRIGGER "trg_sr_set_company_id" BEFORE INSERT ON "public"."service_requests" FOR EACH ROW EXECUTE FUNCTION "public"."set_company_id_from_jwt"();



CREATE OR REPLACE TRIGGER "trg_technicians_company" BEFORE INSERT ON "public"."technicians" FOR EACH ROW EXECUTE FUNCTION "public"."set_company_id"();



CREATE OR REPLACE TRIGGER "vehicles_updated_at" BEFORE UPDATE ON "public"."vehicles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_auth_uid_fkey" FOREIGN KEY ("auth_uid") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."autointegrate_errors"
    ADD CONSTRAINT "autointegrate_errors_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."autointegrate_jobs"("id");



ALTER TABLE ONLY "public"."autointegrate_errors"
    ADD CONSTRAINT "autointegrate_errors_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id");



ALTER TABLE ONLY "public"."autointegrate_jobs"
    ADD CONSTRAINT "autointegrate_jobs_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."autointegrate_logs"
    ADD CONSTRAINT "autointegrate_logs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."autointegrate_jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."autointegrate_logs"
    ADD CONSTRAINT "autointegrate_logs_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_locations"
    ADD CONSTRAINT "company_locations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_request_notes"
    ADD CONSTRAINT "fk_notes_request" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."office_inbox"
    ADD CONSTRAINT "office_inbox_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recurring_inspections"
    ADD CONSTRAINT "recurring_inspections_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."request_notes"
    ADD CONSTRAINT "request_notes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."request_notes"
    ADD CONSTRAINT "request_notes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."request_photos"
    ADD CONSTRAINT "request_photos_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."request_techs"
    ADD CONSTRAINT "request_techs_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id");



ALTER TABLE ONLY "public"."schedule_blocks"
    ADD CONSTRAINT "schedule_blocks_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_events"
    ADD CONSTRAINT "service_events_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_events"
    ADD CONSTRAINT "service_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id");



ALTER TABLE ONLY "public"."service_notes"
    ADD CONSTRAINT "service_notes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_notes"
    ADD CONSTRAINT "service_notes_tech_id_fkey" FOREIGN KEY ("tech_id") REFERENCES "public"."app_users"("id");



ALTER TABLE ONLY "public"."service_parts"
    ADD CONSTRAINT "service_parts_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_request_notes"
    ADD CONSTRAINT "service_request_notes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_request_parts"
    ADD CONSTRAINT "service_request_parts_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_ai_job_id_fkey" FOREIGN KEY ("ai_job_id") REFERENCES "public"."autointegrate_jobs"("id");



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_assigned_tech_fkey" FOREIGN KEY ("assigned_tech") REFERENCES "public"."app_users"("id");



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_fmc_company_id_fkey" FOREIGN KEY ("fmc_company_id") REFERENCES "public"."fmc_companies"("id");



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."company_locations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id");



ALTER TABLE ONLY "public"."service_template_lines"
    ADD CONSTRAINT "service_template_lines_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."service_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_messages"
    ADD CONSTRAINT "support_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."technicians"
    ADD CONSTRAINT "technicians_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."technicians"
    ADD CONSTRAINT "technicians_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_locations"
    ADD CONSTRAINT "user_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_fmc_company_id_fkey" FOREIGN KEY ("fmc_company_id") REFERENCES "public"."fmc_companies"("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."company_locations"("id");



CREATE POLICY "Profiles insert new user" ON "public"."profiles" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."app_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_users_select_self" ON "public"."app_users" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "auth_user_id") OR ("auth"."uid"() = "auth_uid")));



ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "company delete request_techs" ON "public"."request_techs" FOR DELETE USING (("company_id" = "public"."get_company_id_for_user"("auth"."uid"())));



CREATE POLICY "company insert request_techs" ON "public"."request_techs" FOR INSERT WITH CHECK (("company_id" = "public"."get_company_id_for_user"("auth"."uid"())));



CREATE POLICY "company read request_techs" ON "public"."request_techs" FOR SELECT USING (("company_id" = "public"."get_company_id_for_user"("auth"."uid"())));



ALTER TABLE "public"."company_customer_vehicles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_locations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cust_insert_company" ON "public"."customers" FOR INSERT TO "authenticated" WITH CHECK (("company_id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid"));



CREATE POLICY "cust_select_company" ON "public"."customers" FOR SELECT TO "authenticated" USING (("company_id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid"));



CREATE POLICY "cust_update_company" ON "public"."customers" FOR UPDATE TO "authenticated" USING (("company_id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid"));



CREATE POLICY "customer_block_update_notes" ON "public"."service_request_notes" FOR UPDATE USING (false);



CREATE POLICY "customer_insert_notes" ON "public"."service_request_notes" FOR INSERT WITH CHECK (("request_id" IN ( SELECT "requests"."id"
   FROM "public"."requests"
  WHERE ("requests"."customer_id" = "auth"."uid"()))));



CREATE POLICY "customer_read_own_notes" ON "public"."service_request_notes" FOR SELECT USING (("request_id" IN ( SELECT "requests"."id"
   FROM "public"."requests"
  WHERE ("requests"."customer_id" = "auth"."uid"()))));



CREATE POLICY "customer_user_block_update" ON "public"."requests" FOR UPDATE USING (false);



CREATE POLICY "customer_user_insert_requests" ON "public"."requests" FOR INSERT WITH CHECK (("customer_id" = "auth"."uid"()));



CREATE POLICY "customer_user_read_own_requests" ON "public"."requests" FOR SELECT USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "customer_user_read_own_vehicles" ON "public"."vehicles" FOR SELECT USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "customer_user_update_own_vehicles" ON "public"."vehicles" FOR UPDATE USING (("customer_id" = "auth"."uid"())) WITH CHECK (("customer_id" = "auth"."uid"()));



ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customers_by_market" ON "public"."customers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_markets" "um"
  WHERE (("um"."user_id" = "auth"."uid"()) AND ("um"."market" = "customers"."market")))));



CREATE POLICY "customers_insert_company" ON "public"."customers" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."company_id" = "customers"."company_id")))));



CREATE POLICY "customers_read_none" ON "public"."customers" FOR SELECT USING (false);



CREATE POLICY "customers_select_company" ON "public"."customers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."company_id" = "customers"."company_id")))));



CREATE POLICY "customers_superadmin_all" ON "public"."customers" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "delete notes by company" ON "public"."request_notes" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."service_requests" "sr"
  WHERE (("sr"."id" = "request_notes"."request_id") AND ("sr"."company_id" = "public"."auth_company_id"())))));



CREATE POLICY "events_insert_by_request_access" ON "public"."service_events" FOR INSERT TO "authenticated" WITH CHECK (("request_id" IN ( SELECT "service_requests"."id"
   FROM "public"."service_requests")));



CREATE POLICY "events_read_by_request_access" ON "public"."service_events" FOR SELECT TO "authenticated" USING (("request_id" IN ( SELECT "service_requests"."id"
   FROM "public"."service_requests")));



CREATE POLICY "fm_companies_read" ON "public"."companies" FOR SELECT TO "authenticated" USING ((("public"."get_current_user_role"() = 'FLEET_MANAGER'::"public"."user_role") AND ("id" = "public"."get_current_user_company_id"())));



ALTER TABLE "public"."fmc_options" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fmc_read_all" ON "public"."fmc_options" FOR SELECT USING (true);



ALTER TABLE "public"."images" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "images_delete_company" ON "public"."images" FOR DELETE USING (("company_id" = "public"."current_company_id"()));



CREATE POLICY "images_insert_company" ON "public"."images" FOR INSERT WITH CHECK (("company_id" = "public"."current_company_id"()));



CREATE POLICY "images_select_company" ON "public"."images" FOR SELECT USING (("company_id" = "public"."current_company_id"()));



CREATE POLICY "images_update_company" ON "public"."images" FOR UPDATE USING (("company_id" = "public"."current_company_id"()));



CREATE POLICY "insert notes by company" ON "public"."request_notes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."service_requests" "sr"
  WHERE (("sr"."id" = "request_notes"."request_id") AND ("sr"."company_id" = "public"."auth_company_id"())))));



CREATE POLICY "internal_all_requests" ON "public"."service_requests" FOR SELECT USING (((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ? 'role'::"text") AND ((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'role'::"text") = ANY (ARRAY['SUPERADMIN'::"text", 'ADMIN'::"text", 'OFFICE'::"text", 'DISPATCH'::"text"]))));



ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "locations_insert_company" ON "public"."locations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."company_id" = "locations"."company_id")))));



CREATE POLICY "locations_read_none" ON "public"."locations" FOR SELECT USING (false);



CREATE POLICY "locations_select_company" ON "public"."locations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."company_id" = "locations"."company_id")))));



CREATE POLICY "notes_insert_by_tech" ON "public"."service_notes" FOR INSERT TO "authenticated" WITH CHECK ((("tech_id" = ( SELECT "app_users"."id"
   FROM "public"."app_users"
  WHERE ("app_users"."auth_uid" = "auth"."uid"()))) AND ("request_id" IN ( SELECT "service_requests"."id"
   FROM "public"."service_requests"
  WHERE ("service_requests"."assigned_tech" = "service_notes"."tech_id")))));



CREATE POLICY "notes_insert_company" ON "public"."request_notes" FOR INSERT TO "authenticated" WITH CHECK ((("company_id" = "public"."auth_company"()) AND ("author_id" = "auth"."uid"())));



CREATE POLICY "notes_read_by_request_access" ON "public"."service_notes" FOR SELECT TO "authenticated" USING (("request_id" IN ( SELECT "service_requests"."id"
   FROM "public"."service_requests")));



CREATE POLICY "notes_select_company" ON "public"."request_notes" FOR SELECT TO "authenticated" USING (("company_id" = "public"."auth_company"()));



CREATE POLICY "odt_read_notes" ON "public"."service_request_notes" FOR SELECT USING (((NOT "public"."is_superadmin"()) AND (( SELECT "c"."market"
   FROM ("public"."customers" "c"
     JOIN "public"."requests" "r" ON (("r"."customer_id" = "c"."id")))
  WHERE ("r"."id" = "service_request_notes"."request_id")) IN ( SELECT "user_markets"."market"
   FROM "public"."user_markets"
  WHERE ("user_markets"."user_id" = "auth"."uid"())))));



CREATE POLICY "odt_update_notes" ON "public"."service_request_notes" FOR UPDATE USING (((NOT "public"."is_superadmin"()) AND (( SELECT "c"."market"
   FROM ("public"."customers" "c"
     JOIN "public"."requests" "r" ON (("r"."customer_id" = "c"."id")))
  WHERE ("r"."id" = "service_request_notes"."request_id")) IN ( SELECT "user_markets"."market"
   FROM "public"."user_markets"
  WHERE ("user_markets"."user_id" = "auth"."uid"()))))) WITH CHECK ((( SELECT "c"."market"
   FROM ("public"."customers" "c"
     JOIN "public"."requests" "r" ON (("r"."customer_id" = "c"."id")))
  WHERE ("r"."id" = "service_request_notes"."request_id")) IN ( SELECT "user_markets"."market"
   FROM "public"."user_markets"
  WHERE ("user_markets"."user_id" = "auth"."uid"()))));



CREATE POLICY "office_companies_all" ON "public"."companies" TO "authenticated" USING ((("public"."get_current_user_role"() = 'OFFICE'::"public"."user_role") AND ("id" = "public"."get_current_user_company_id"())));



CREATE POLICY "office_dispatch_tech_read_requests" ON "public"."requests" FOR SELECT USING (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."request_in_user_market"("id")));



CREATE POLICY "office_dispatch_tech_read_vehicles" ON "public"."vehicles" FOR SELECT USING (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."vehicle_in_user_market"("id")));



CREATE POLICY "office_dispatch_tech_update_requests" ON "public"."requests" FOR UPDATE USING (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."request_in_user_market"("id"))) WITH CHECK (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."request_in_user_market"("id")));



CREATE POLICY "office_dispatch_tech_update_vehicles" ON "public"."vehicles" FOR UPDATE USING (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."vehicle_in_user_market"("id"))) WITH CHECK (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."vehicle_in_user_market"("id")));



CREATE POLICY "office_users_manage" ON "public"."app_users" TO "authenticated" USING ((("public"."get_current_user_role"() = 'OFFICE'::"public"."user_role") AND ("company_id" = "public"."get_current_user_company_id"())));



CREATE POLICY "parts_all_by_request_access" ON "public"."service_parts" TO "authenticated" USING (("request_id" IN ( SELECT "service_requests"."id"
   FROM "public"."service_requests")));



CREATE POLICY "parts_read_by_request_access" ON "public"."service_parts" FOR SELECT TO "authenticated" USING (("request_id" IN ( SELECT "service_requests"."id"
   FROM "public"."service_requests")));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read notes by company" ON "public"."request_notes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."service_requests" "sr"
  WHERE (("sr"."id" = "request_notes"."request_id") AND ("sr"."company_id" = "public"."auth_company_id"())))));



CREATE POLICY "read own company requests" ON "public"."service_requests" FOR SELECT USING (("company_id" = ((("current_setting"('request.jwt.claims'::"text", true))::"jsonb" ->> 'company_id'::"text"))::"uuid"));



CREATE POLICY "read_locations_by_company" ON "public"."company_locations" FOR SELECT USING (("company_id" = "public"."auth_company_id"()));



ALTER TABLE "public"."request_notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "request_notes_customer_block_delete" ON "public"."service_request_notes" FOR DELETE USING (false);



CREATE POLICY "request_notes_customer_block_update" ON "public"."service_request_notes" FOR UPDATE USING (false);



CREATE POLICY "request_notes_customer_insert" ON "public"."service_request_notes" FOR INSERT WITH CHECK ("public"."request_belongs_to_customer"("request_id"));



CREATE POLICY "request_notes_customer_read" ON "public"."service_request_notes" FOR SELECT USING ("public"."request_belongs_to_customer"("request_id"));



CREATE POLICY "request_parts_customer_block_insert" ON "public"."service_request_parts" FOR INSERT WITH CHECK (false);



ALTER TABLE "public"."request_photos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "request_photos_customer_block_delete" ON "public"."request_photos" FOR DELETE USING (false);



CREATE POLICY "request_photos_customer_block_update" ON "public"."request_photos" FOR UPDATE USING (false);



CREATE POLICY "request_photos_customer_insert" ON "public"."request_photos" FOR INSERT WITH CHECK ("public"."request_belongs_to_customer"("request_id"));



CREATE POLICY "request_photos_customer_read" ON "public"."request_photos" FOR SELECT USING ("public"."request_belongs_to_customer"("request_id"));



CREATE POLICY "request_photos_staff_insert" ON "public"."request_photos" FOR INSERT WITH CHECK (("public"."is_superadmin"() OR "public"."request_in_user_market"("request_id")));



CREATE POLICY "request_photos_staff_read" ON "public"."request_photos" FOR SELECT USING (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."request_in_user_market"("request_id")));



CREATE POLICY "request_photos_staff_update" ON "public"."request_photos" FOR UPDATE USING (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."request_in_user_market"("request_id"))) WITH CHECK (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."request_in_user_market"("request_id")));



CREATE POLICY "request_photos_superadmin" ON "public"."request_photos" USING (("auth"."email"() = 'edson.cortes@bigo.com'::"text"));



CREATE POLICY "request_photos_superadmin_all" ON "public"."request_photos" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



ALTER TABLE "public"."request_techs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "requests_customer_block_delete" ON "public"."service_requests" FOR DELETE USING (false);



CREATE POLICY "requests_customer_block_update" ON "public"."requests" FOR UPDATE USING (false);



CREATE POLICY "requests_customer_block_update" ON "public"."service_requests" FOR UPDATE USING (false);



CREATE POLICY "requests_customer_read" ON "public"."service_requests" FOR SELECT USING ("public"."request_belongs_to_customer"("id"));



CREATE POLICY "requests_staff_read" ON "public"."requests" FOR SELECT USING (("public"."is_superadmin"() OR "public"."request_in_user_market"("id")));



CREATE POLICY "requests_staff_update" ON "public"."requests" FOR UPDATE USING (("public"."is_superadmin"() OR "public"."request_in_user_market"("id"))) WITH CHECK (("public"."is_superadmin"() OR "public"."request_in_user_market"("id")));



CREATE POLICY "requests_superadmin_all" ON "public"."requests" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "rp_customer_block_deletes" ON "public"."request_photos" FOR DELETE USING (false);



CREATE POLICY "rp_customer_block_updates" ON "public"."request_photos" FOR UPDATE USING (false);



CREATE POLICY "rp_superadmin_all" ON "public"."request_photos" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "se_customer_block_delete" ON "public"."service_events" FOR DELETE USING (false);



CREATE POLICY "se_customer_block_insert" ON "public"."service_events" FOR INSERT WITH CHECK (false);



CREATE POLICY "se_customer_block_update" ON "public"."service_events" FOR UPDATE USING (false) WITH CHECK (false);



CREATE POLICY "se_staff_insert" ON "public"."service_events" FOR INSERT WITH CHECK (("public"."is_superadmin"() OR "public"."request_in_user_market"("request_id")));



CREATE POLICY "se_staff_read" ON "public"."service_events" FOR SELECT USING (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."request_in_user_market"("request_id")));



CREATE POLICY "se_staff_update" ON "public"."service_events" FOR UPDATE USING (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."request_in_user_market"("request_id"))) WITH CHECK (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."request_in_user_market"("request_id")));



CREATE POLICY "se_superadmin_all" ON "public"."service_events" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



ALTER TABLE "public"."service_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_parts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_request_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_request_parts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sp_customer_block_delete" ON "public"."service_parts" FOR DELETE USING (false);



CREATE POLICY "sp_customer_block_insert" ON "public"."service_parts" FOR INSERT WITH CHECK (false);



CREATE POLICY "sp_customer_block_update" ON "public"."service_parts" FOR UPDATE USING (false) WITH CHECK (false);



CREATE POLICY "sp_staff_insert" ON "public"."service_parts" FOR INSERT WITH CHECK (("public"."is_superadmin"() OR "public"."request_in_user_market"("request_id")));



CREATE POLICY "sp_staff_read" ON "public"."service_parts" FOR SELECT USING (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."request_in_user_market"("request_id")));



CREATE POLICY "sp_staff_update" ON "public"."service_parts" FOR UPDATE USING (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."request_in_user_market"("request_id"))) WITH CHECK (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."request_in_user_market"("request_id")));



CREATE POLICY "sp_superadmin_all" ON "public"."service_parts" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "sr_customer_self" ON "public"."service_requests" FOR SELECT USING (((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = ANY (ARRAY['CUSTOMER'::"text", 'CUSTOMER_USER'::"text", 'CUSTOMER_ADMIN'::"text", 'CLIENT'::"text"])) AND ("customer_id" = (("auth"."jwt"() ->> 'customer_id'::"text"))::"uuid")));



CREATE POLICY "sr_events_superadmin" ON "public"."service_events" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "sr_internal_scoped" ON "public"."service_requests" FOR SELECT USING (((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = ANY (ARRAY['ADMIN'::"text", 'OFFICE'::"text", 'DISPATCH'::"text"])) AND ("company_id" = (("auth"."jwt"() ->> 'company_id'::"text"))::"uuid") AND (("auth"."jwt"() -> 'location_ids'::"text") ?| ARRAY[("location_id")::"text"])));



CREATE POLICY "sr_notes_customer_block_delete" ON "public"."service_request_notes" FOR DELETE USING (false);



CREATE POLICY "sr_notes_customer_block_update" ON "public"."service_request_notes" FOR UPDATE USING (false);



CREATE POLICY "sr_notes_customer_insert" ON "public"."service_request_notes" FOR INSERT WITH CHECK ("public"."request_belongs_to_customer"("request_id"));



CREATE POLICY "sr_notes_customer_read" ON "public"."service_request_notes" FOR SELECT USING ("public"."request_belongs_to_customer"("request_id"));



CREATE POLICY "sr_notes_staff_insert" ON "public"."service_request_notes" FOR INSERT WITH CHECK (("public"."is_superadmin"() OR "public"."request_in_user_market"("request_id")));



CREATE POLICY "sr_notes_staff_read" ON "public"."service_request_notes" FOR SELECT USING (("public"."is_superadmin"() OR "public"."request_in_user_market"("request_id")));



CREATE POLICY "sr_notes_staff_update" ON "public"."service_request_notes" FOR UPDATE USING (("public"."is_superadmin"() OR ("public"."request_in_user_market"("request_id") AND ("author_user_id" = "auth"."uid"())))) WITH CHECK (("public"."is_superadmin"() OR ("public"."request_in_user_market"("request_id") AND ("author_user_id" = "auth"."uid"()))));



CREATE POLICY "sr_notes_superadmin" ON "public"."service_request_notes" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "sr_superadmin_all" ON "public"."service_requests" FOR SELECT USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'SUPERADMIN'::"text"));



CREATE POLICY "sr_tech_assigned" ON "public"."service_requests" FOR SELECT USING (((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'TECH'::"text") AND ("assigned_tech = "auth"."uid"())));



CREATE POLICY "srp_customer_block_delete" ON "public"."service_request_parts" FOR DELETE USING (false);



CREATE POLICY "srp_customer_block_insert" ON "public"."service_request_parts" FOR INSERT WITH CHECK (false);



CREATE POLICY "srp_customer_block_update" ON "public"."service_request_parts" FOR UPDATE USING (false) WITH CHECK (false);



CREATE POLICY "srp_staff_insert" ON "public"."service_request_parts" FOR INSERT WITH CHECK (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."request_in_user_market"("request_id")));



CREATE POLICY "srp_staff_read" ON "public"."service_request_parts" FOR SELECT USING (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."request_in_user_market"("request_id")));



CREATE POLICY "srp_staff_update" ON "public"."service_request_parts" FOR UPDATE USING (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."request_in_user_market"("request_id"))) WITH CHECK (("public"."is_superadmin"() OR "public"."user_is_admin"() OR "public"."request_in_user_market"("request_id")));



CREATE POLICY "srp_superadmin_all" ON "public"."service_request_parts" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "superadmin bypass all" ON "public"."company_locations" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "superadmin bypass all" ON "public"."service_requests" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "superadmin bypass all" ON "public"."technicians" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "superadmin_all_notes" ON "public"."service_request_notes" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "superadmin_all_request_photos" ON "public"."request_photos" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "superadmin_all_requests" ON "public"."requests" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "superadmin_all_service_events" ON "public"."service_events" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "superadmin_all_user_markets" ON "public"."user_markets" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "superadmin_all_vehicles" ON "public"."vehicles" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "tech_insert_company" ON "public"."technicians" FOR INSERT TO "authenticated" WITH CHECK (("company_id" = "public"."auth_company"()));



CREATE POLICY "tech_select_company" ON "public"."technicians" FOR SELECT TO "authenticated" USING (("company_id" = "public"."auth_company"()));



CREATE POLICY "tech_update_company" ON "public"."technicians" FOR UPDATE TO "authenticated" USING (("company_id" = "public"."auth_company"())) WITH CHECK (("company_id" = "public"."auth_company"()));



ALTER TABLE "public"."technicians" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_markets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_markets_read" ON "public"."user_markets" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_read_own_company" ON "public"."app_users" FOR SELECT TO "authenticated" USING ((("company_id" = "public"."get_current_user_company_id"()) OR ("auth_uid" = "auth"."uid"())));



CREATE POLICY "users_select_own" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "auth_user_id"));



ALTER TABLE "public"."vehicles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vehicles_customer_block_delete" ON "public"."vehicles" FOR DELETE USING (false);



CREATE POLICY "vehicles_customer_block_update" ON "public"."vehicles" FOR UPDATE USING (false);



CREATE POLICY "vehicles_customer_read" ON "public"."vehicles" FOR SELECT USING ("public"."vehicle_belongs_to_customer"("id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."auth_company"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_company"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_company"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_company_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_company_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_company_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_customer_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_customer_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_customer_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_checkin_before_completed"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_checkin_before_completed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_checkin_before_completed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_po_before_closed"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_po_before_closed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_po_before_closed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_company_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_company_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_company_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_market_list"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_market_list"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_market_list"() TO "service_role";



GRANT ALL ON FUNCTION "public"."customer_in_user_market"("cust_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."customer_in_user_market"("cust_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."customer_in_user_market"("cust_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_company_id_for_user"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_company_id_for_user"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_company_id_for_user"("uid" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."app_users" TO "anon";
GRANT ALL ON TABLE "public"."app_users" TO "authenticated";
GRANT ALL ON TABLE "public"."app_users" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_app_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_app_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_app_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_company_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_company_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_company_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"("uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_market_access"("market_name" "public"."market_name") TO "anon";
GRANT ALL ON FUNCTION "public"."has_market_access"("market_name" "public"."market_name") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_market_access"("market_name" "public"."market_name") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_superadmin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_superadmin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_superadmin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_empty_text_to_null"() TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_empty_text_to_null"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_empty_text_to_null"() TO "service_role";



GRANT ALL ON FUNCTION "public"."request_belongs_to_customer"("req_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."request_belongs_to_customer"("req_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_belongs_to_customer"("req_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."request_in_user_market"("req_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."request_in_user_market"("req_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_in_user_market"("req_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."service_requests" TO "anon";
GRANT ALL ON TABLE "public"."service_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."service_requests" TO "service_role";



GRANT ALL ON FUNCTION "public"."same_company_tech"("sr" "public"."service_requests") TO "anon";
GRANT ALL ON FUNCTION "public"."same_company_tech"("sr" "public"."service_requests") TO "authenticated";
GRANT ALL ON FUNCTION "public"."same_company_tech"("sr" "public"."service_requests") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_company_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_company_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_company_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_company_id_from_inviter"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_company_id_from_inviter"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_company_id_from_inviter"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_company_id_from_jwt"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_company_id_from_jwt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_company_id_from_jwt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_completed_at_when_completed"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_completed_at_when_completed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_completed_at_when_completed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_status_timestamps"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_status_timestamps"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_status_timestamps"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sr_enforce_flow"() TO "anon";
GRANT ALL ON FUNCTION "public"."sr_enforce_flow"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sr_enforce_flow"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_set_note_author"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_set_note_author"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_set_note_author"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."vehicle_belongs_to_customer"("veh_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."vehicle_belongs_to_customer"("veh_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vehicle_belongs_to_customer"("veh_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."vehicle_in_user_market"("veh_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."vehicle_in_user_market"("veh_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vehicle_in_user_market"("veh_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."access_requests" TO "anon";
GRANT ALL ON TABLE "public"."access_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."access_requests" TO "service_role";



GRANT ALL ON TABLE "public"."requests" TO "anon";
GRANT ALL ON TABLE "public"."requests" TO "authenticated";
GRANT ALL ON TABLE "public"."requests" TO "service_role";



GRANT ALL ON TABLE "public"."active_requests_view" TO "anon";
GRANT ALL ON TABLE "public"."active_requests_view" TO "authenticated";
GRANT ALL ON TABLE "public"."active_requests_view" TO "service_role";



GRANT ALL ON TABLE "public"."admin_audit" TO "anon";
GRANT ALL ON TABLE "public"."admin_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_audit" TO "service_role";



GRANT ALL ON TABLE "public"."audit_user_events" TO "anon";
GRANT ALL ON TABLE "public"."audit_user_events" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_user_events" TO "service_role";



GRANT ALL ON TABLE "public"."autointegrate_errors" TO "anon";
GRANT ALL ON TABLE "public"."autointegrate_errors" TO "authenticated";
GRANT ALL ON TABLE "public"."autointegrate_errors" TO "service_role";



GRANT ALL ON TABLE "public"."autointegrate_jobs" TO "anon";
GRANT ALL ON TABLE "public"."autointegrate_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."autointegrate_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."autointegrate_logs" TO "anon";
GRANT ALL ON TABLE "public"."autointegrate_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."autointegrate_logs" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."company_customer_markets" TO "anon";
GRANT ALL ON TABLE "public"."company_customer_markets" TO "authenticated";
GRANT ALL ON TABLE "public"."company_customer_markets" TO "service_role";



GRANT ALL ON TABLE "public"."company_customer_vehicles" TO "anon";
GRANT ALL ON TABLE "public"."company_customer_vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."company_customer_vehicles" TO "service_role";



GRANT ALL ON TABLE "public"."company_locations" TO "anon";
GRANT ALL ON TABLE "public"."company_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."company_locations" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."vehicles" TO "anon";
GRANT ALL ON TABLE "public"."vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles" TO "service_role";



GRANT ALL ON TABLE "public"."customer_vehicles_view" TO "anon";
GRANT ALL ON TABLE "public"."customer_vehicles_view" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_vehicles_view" TO "service_role";



GRANT ALL ON TABLE "public"."fmc_companies" TO "anon";
GRANT ALL ON TABLE "public"."fmc_companies" TO "authenticated";
GRANT ALL ON TABLE "public"."fmc_companies" TO "service_role";



GRANT ALL ON TABLE "public"."fmc_options" TO "anon";
GRANT ALL ON TABLE "public"."fmc_options" TO "authenticated";
GRANT ALL ON TABLE "public"."fmc_options" TO "service_role";



GRANT ALL ON TABLE "public"."images" TO "anon";
GRANT ALL ON TABLE "public"."images" TO "authenticated";
GRANT ALL ON TABLE "public"."images" TO "service_role";



GRANT ALL ON TABLE "public"."invites" TO "anon";
GRANT ALL ON TABLE "public"."invites" TO "authenticated";
GRANT ALL ON TABLE "public"."invites" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON TABLE "public"."office_inbox" TO "anon";
GRANT ALL ON TABLE "public"."office_inbox" TO "authenticated";
GRANT ALL ON TABLE "public"."office_inbox" TO "service_role";



GRANT ALL ON TABLE "public"."pdf_logs" TO "anon";
GRANT ALL ON TABLE "public"."pdf_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."pdf_logs" TO "service_role";



GRANT ALL ON TABLE "public"."pdf_shares" TO "anon";
GRANT ALL ON TABLE "public"."pdf_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."pdf_shares" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."recurring_inspections" TO "anon";
GRANT ALL ON TABLE "public"."recurring_inspections" TO "authenticated";
GRANT ALL ON TABLE "public"."recurring_inspections" TO "service_role";



GRANT ALL ON TABLE "public"."request_notes" TO "anon";
GRANT ALL ON TABLE "public"."request_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."request_notes" TO "service_role";



GRANT ALL ON TABLE "public"."service_request_parts" TO "anon";
GRANT ALL ON TABLE "public"."service_request_parts" TO "authenticated";
GRANT ALL ON TABLE "public"."service_request_parts" TO "service_role";



GRANT ALL ON TABLE "public"."request_parts_view" TO "anon";
GRANT ALL ON TABLE "public"."request_parts_view" TO "authenticated";
GRANT ALL ON TABLE "public"."request_parts_view" TO "service_role";



GRANT ALL ON TABLE "public"."request_photos" TO "anon";
GRANT ALL ON TABLE "public"."request_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."request_photos" TO "service_role";



GRANT ALL ON TABLE "public"."request_photos_view" TO "anon";
GRANT ALL ON TABLE "public"."request_photos_view" TO "authenticated";
GRANT ALL ON TABLE "public"."request_photos_view" TO "service_role";



GRANT ALL ON TABLE "public"."request_techs" TO "anon";
GRANT ALL ON TABLE "public"."request_techs" TO "authenticated";
GRANT ALL ON TABLE "public"."request_techs" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_blocks" TO "anon";
GRANT ALL ON TABLE "public"."schedule_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."service_events" TO "anon";
GRANT ALL ON TABLE "public"."service_events" TO "authenticated";
GRANT ALL ON TABLE "public"."service_events" TO "service_role";



GRANT ALL ON TABLE "public"."service_notes" TO "anon";
GRANT ALL ON TABLE "public"."service_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."service_notes" TO "service_role";



GRANT ALL ON TABLE "public"."service_request_notes" TO "anon";
GRANT ALL ON TABLE "public"."service_request_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."service_request_notes" TO "service_role";



GRANT ALL ON TABLE "public"."service_notes_view" TO "anon";
GRANT ALL ON TABLE "public"."service_notes_view" TO "authenticated";
GRANT ALL ON TABLE "public"."service_notes_view" TO "service_role";



GRANT ALL ON TABLE "public"."service_parts" TO "anon";
GRANT ALL ON TABLE "public"."service_parts" TO "authenticated";
GRANT ALL ON TABLE "public"."service_parts" TO "service_role";



GRANT ALL ON TABLE "public"."service_parts_view" TO "anon";
GRANT ALL ON TABLE "public"."service_parts_view" TO "authenticated";
GRANT ALL ON TABLE "public"."service_parts_view" TO "service_role";



GRANT ALL ON TABLE "public"."service_template_lines" TO "anon";
GRANT ALL ON TABLE "public"."service_template_lines" TO "authenticated";
GRANT ALL ON TABLE "public"."service_template_lines" TO "service_role";



GRANT ALL ON TABLE "public"."service_templates" TO "anon";
GRANT ALL ON TABLE "public"."service_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."service_templates" TO "service_role";



GRANT ALL ON TABLE "public"."support_messages" TO "anon";
GRANT ALL ON TABLE "public"."support_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."support_messages" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."technicians" TO "anon";
GRANT ALL ON TABLE "public"."technicians" TO "authenticated";
GRANT ALL ON TABLE "public"."technicians" TO "service_role";



GRANT ALL ON TABLE "public"."user_locations" TO "anon";
GRANT ALL ON TABLE "public"."user_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_locations" TO "service_role";



GRANT ALL ON TABLE "public"."user_markets" TO "anon";
GRANT ALL ON TABLE "public"."user_markets" TO "authenticated";
GRANT ALL ON TABLE "public"."user_markets" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_market_view" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_market_view" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_market_view" TO "service_role";



GRANT ALL ON TABLE "public"."view_requests" TO "anon";
GRANT ALL ON TABLE "public"."view_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."view_requests" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































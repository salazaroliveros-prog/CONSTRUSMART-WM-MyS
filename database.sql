--
-- PostgreSQL database dump
--


-- Dumped from database version 15.12
-- Dumped by pg_dump version 15.16

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

--
-- Name: prj_1hKLEbTuzafY; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "prj_1hKLEbTuzafY";


--
-- Name: prj_1hKLEbTuzafY_auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "prj_1hKLEbTuzafY_auth";


--
-- Name: prj_1hKLEbTuzafY_storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "prj_1hKLEbTuzafY_storage";


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: crm_campaigns; Type: TABLE; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY".crm_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    subject text,
    html_body text,
    text_body text,
    status text DEFAULT 'draft'::text,
    list_id uuid,
    filter_query jsonb,
    list_ids jsonb,
    style_preset text,
    images jsonb,
    scheduled_at timestamp with time zone,
    sent_at timestamp with time zone,
    total_recipients integer DEFAULT 0,
    total_sent integer DEFAULT 0,
    total_opened integer DEFAULT 0,
    total_clicked integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT crm_campaigns_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'sending'::text, 'sent'::text, 'failed'::text])))
);


--
-- Name: crm_campaigns_claim_due(integer); Type: FUNCTION; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE FUNCTION "prj_1hKLEbTuzafY".crm_campaigns_claim_due(p_limit integer) RETURNS SETOF "prj_1hKLEbTuzafY".crm_campaigns
    LANGUAGE plpgsql
    AS $$
BEGIN
RETURN QUERY UPDATE crm_campaigns
SET status = 'sending', sent_at = NULL
WHERE id IN (
SELECT due_id FROM (
SELECT id AS due_id FROM crm_campaigns
WHERE status = 'scheduled' AND scheduled_at <= NOW()
ORDER BY scheduled_at
FOR UPDATE SKIP LOCKED
LIMIT p_limit
) due_rows
)
RETURNING *;
END $$;


--
-- Name: crm_flow_step_queue; Type: TABLE; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY".crm_flow_step_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    flow_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    resume_step_order integer NOT NULL,
    run_at timestamp with time zone NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    max_attempts integer DEFAULT 5 NOT NULL,
    last_error text,
    event_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    locked_at timestamp with time zone,
    locked_by text,
    finished_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: crm_flow_queue_claim(integer, text, integer); Type: FUNCTION; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE FUNCTION "prj_1hKLEbTuzafY".crm_flow_queue_claim(p_limit integer, p_worker text, p_lock_seconds integer DEFAULT 300) RETURNS SETOF "prj_1hKLEbTuzafY".crm_flow_step_queue
    LANGUAGE plpgsql
    AS $$
BEGIN
RETURN QUERY UPDATE crm_flow_step_queue
SET locked_at = NOW(),
locked_by = p_worker,
attempts = attempts + 1
WHERE id IN (
SELECT due_id FROM (
SELECT id AS due_id FROM crm_flow_step_queue
WHERE finished_at IS NULL
AND attempts < max_attempts
AND run_at <= NOW()
AND (locked_at IS NULL OR locked_at < NOW() - make_interval(secs => p_lock_seconds))
ORDER BY run_at
FOR UPDATE SKIP LOCKED
LIMIT p_limit
) due_rows
)
RETURNING *;
END $$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE FUNCTION "prj_1hKLEbTuzafY".handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
insert into "prj_1hKLEbTuzafY".profiles (id, nombre, rol)
values (new.id, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)), coalesce(new.raw_user_meta_data->>'rol','Administrador'))
on conflict (id) do nothing;
return new;
end;
$$;


--
-- Name: auth_uid(); Type: FUNCTION; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE FUNCTION "prj_1hKLEbTuzafY_auth".auth_uid() RETURNS uuid
    LANGUAGE sql
    AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;


--
-- Name: role(); Type: FUNCTION; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE FUNCTION "prj_1hKLEbTuzafY_auth".role() RETURNS text
    LANGUAGE sql
    AS $$
  SELECT COALESCE(current_setting('request.jwt.claim.role', true), 'anon')
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: prj_1hKLEbTuzafY_storage; Owner: -
--

CREATE FUNCTION "prj_1hKLEbTuzafY_storage".foldername(name text) RETURNS text[]
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT string_to_array(name, '/')
$$;


--
-- Name: crm_appointments; Type: TABLE; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY".crm_appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    calendar_id uuid,
    contact_id uuid,
    contact_email text NOT NULL,
    contact_name text,
    contact_phone text,
    title text,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    status text DEFAULT 'confirmed'::text,
    notes text,
    source text DEFAULT 'manual'::text,
    google_event_id text,
    calendly_event_id text,
    assigned_user_id text,
    assigned_membership_id uuid,
    participant_count integer DEFAULT 1,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT crm_appointments_source_check CHECK ((source = ANY (ARRAY['manual'::text, 'public_link'::text, 'google'::text, 'calendly'::text]))),
    CONSTRAINT crm_appointments_status_check CHECK ((status = ANY (ARRAY['confirmed'::text, 'cancelled'::text, 'completed'::text, 'no_show'::text, 'rescheduled'::text])))
);


--
-- Name: crm_availability; Type: TABLE; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY".crm_availability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    calendar_id uuid,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT crm_availability_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: crm_calendar_members; Type: TABLE; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY".crm_calendar_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    calendar_id uuid,
    user_id text NOT NULL,
    user_google_calendar_id text,
    priority integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: crm_calendars; Type: TABLE; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY".crm_calendars (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text DEFAULT 'Default Calendar'::text NOT NULL,
    slug text,
    description text,
    calendar_type text DEFAULT 'personal'::text,
    owner_user_id text,
    max_participants integer DEFAULT 1,
    date_range_days integer,
    slot_duration integer DEFAULT 30,
    slot_interval integer DEFAULT 0,
    max_bookings_per_day integer,
    min_notice_hours integer DEFAULT 1,
    buffer_before integer DEFAULT 0,
    buffer_after integer DEFAULT 0,
    timezone text DEFAULT 'America/New_York'::text,
    is_active boolean DEFAULT true,
    meeting_location_type text DEFAULT 'custom'::text,
    meeting_location_value text,
    host_notify_on_booking boolean DEFAULT true,
    google_calendar_id text,
    google_refresh_token text,
    calendly_user_uri text,
    calendly_webhook_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    calendly_connection_id uuid,
    CONSTRAINT crm_calendars_calendar_type_check CHECK ((calendar_type = ANY (ARRAY['personal'::text, 'round_robin'::text, 'class'::text, 'collective'::text])))
);


--
-- Name: crm_calendly_connections; Type: TABLE; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY".crm_calendly_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    calendly_user_uri text NOT NULL,
    calendly_user_email text,
    calendly_user_name text,
    calendly_org_uri text,
    encrypted_access_token text NOT NULL,
    signing_key text NOT NULL,
    webhook_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: crm_contact_lists; Type: TABLE; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY".crm_contact_lists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contact_id uuid NOT NULL,
    list_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: crm_contacts; Type: TABLE; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY".crm_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    name text,
    phone text,
    sms_opt_in boolean DEFAULT false,
    address jsonb,
    source text DEFAULT 'manual'::text,
    tags text[] DEFAULT '{}'::text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    ecom_customer_id uuid,
    total_orders integer DEFAULT 0,
    total_spent integer DEFAULT 0,
    last_order_at timestamp with time zone,
    subscribed boolean DEFAULT true,
    subscribed_at timestamp with time zone DEFAULT now(),
    unsubscribed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: crm_events; Type: TABLE; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY".crm_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contact_id uuid,
    campaign_id uuid,
    channel text DEFAULT 'email'::text NOT NULL,
    event_type text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT crm_events_channel_check CHECK ((channel = ANY (ARRAY['email'::text, 'sms'::text]))),
    CONSTRAINT crm_events_event_type_check CHECK ((event_type = ANY (ARRAY['sent'::text, 'opened'::text, 'clicked'::text, 'bounced'::text, 'unsubscribed'::text, 'opt_out'::text, 'delivered'::text, 'failed'::text, 'undelivered'::text])))
);


--
-- Name: crm_flow_logs; Type: TABLE; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY".crm_flow_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    flow_id uuid,
    step_id uuid,
    contact_id uuid,
    trigger_event text NOT NULL,
    status text DEFAULT 'executed'::text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT crm_flow_logs_status_check CHECK ((status = ANY (ARRAY['executed'::text, 'failed'::text, 'skipped'::text])))
);


--
-- Name: crm_flow_steps; Type: TABLE; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY".crm_flow_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    flow_id uuid,
    step_order integer NOT NULL,
    action_type text NOT NULL,
    action_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT crm_flow_steps_action_type_check CHECK ((action_type = ANY (ARRAY['send_email'::text, 'add_tag'::text, 'add_to_list'::text, 'wait'::text])))
);


--
-- Name: crm_flows; Type: TABLE; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY".crm_flows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    trigger_type text NOT NULL,
    trigger_config jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    cron_job_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT crm_flows_trigger_type_check CHECK ((trigger_type = ANY (ARRAY[(('contact'::text || chr(46)) || 'subscribed'::text), (('order'::text || chr(46)) || 'placed'::text), (('contact'::text || chr(46)) || 'tagged'::text), (('user'::text || chr(46)) || 'registered'::text), (('appointment'::text || chr(46)) || 'booked'::text), (('schedule'::text || chr(46)) || 'cron'::text)])))
);


--
-- Name: crm_lists; Type: TABLE; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY".crm_lists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    filter_query jsonb,
    is_dynamic boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY".profiles (
    id uuid NOT NULL,
    nombre text,
    rol text DEFAULT 'Administrador'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: identities; Type: TABLE; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY_auth".identities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    provider text NOT NULL,
    identity_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY_auth".users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text,
    encrypted_password text,
    email_confirmed_at timestamp with time zone,
    phone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
    raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
    is_anonymous boolean DEFAULT false,
    phone_confirmed_at timestamp with time zone,
    confirmation_token text,
    confirmation_sent_at timestamp with time zone,
    recovery_token text,
    recovery_sent_at timestamp with time zone
);


--
-- Name: buckets; Type: TABLE; Schema: prj_1hKLEbTuzafY_storage; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY_storage".buckets (
    id text NOT NULL,
    name text NOT NULL,
    public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    file_size_limit bigint,
    allowed_mime_types text[]
);


--
-- Name: objects; Type: TABLE; Schema: prj_1hKLEbTuzafY_storage; Owner: -
--

CREATE TABLE "prj_1hKLEbTuzafY_storage".objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    path_tokens text[],
    version text
);


--
-- Data for Name: crm_appointments; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY; Owner: -
--

COPY "prj_1hKLEbTuzafY".crm_appointments (id, calendar_id, contact_id, contact_email, contact_name, contact_phone, title, starts_at, ends_at, status, notes, source, google_event_id, calendly_event_id, assigned_user_id, assigned_membership_id, participant_count, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: crm_availability; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY; Owner: -
--

COPY "prj_1hKLEbTuzafY".crm_availability (id, calendar_id, day_of_week, start_time, end_time, is_active, created_at) FROM stdin;
dee9d293-21c2-4cb8-9579-86ffa7623178	e73f9cea-50eb-4117-bf3b-835cac9964d8	1	09:00:00	17:00:00	t	2026-05-31 22:16:16.517859+00
c58108ae-3bfb-4a15-bc30-ec4e09bf3aac	e73f9cea-50eb-4117-bf3b-835cac9964d8	2	09:00:00	17:00:00	t	2026-05-31 22:16:16.517859+00
b5a82f0d-6208-46da-9fee-1b85329383dd	e73f9cea-50eb-4117-bf3b-835cac9964d8	3	09:00:00	17:00:00	t	2026-05-31 22:16:16.517859+00
9ac7ecde-fea6-4f3e-855a-b43443ca9aa9	e73f9cea-50eb-4117-bf3b-835cac9964d8	4	09:00:00	17:00:00	t	2026-05-31 22:16:16.517859+00
101bf9a0-da35-4515-bf10-3a5edfc9692f	e73f9cea-50eb-4117-bf3b-835cac9964d8	5	09:00:00	17:00:00	t	2026-05-31 22:16:16.517859+00
\.


--
-- Data for Name: crm_calendar_members; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY; Owner: -
--

COPY "prj_1hKLEbTuzafY".crm_calendar_members (id, calendar_id, user_id, user_google_calendar_id, priority, created_at) FROM stdin;
9b412a00-56a9-4ddc-b6fd-6933270f07b3	e73f9cea-50eb-4117-bf3b-835cac9964d8	6a1cb2d9f2abfd8042cf2ec9	\N	0	2026-05-31 22:16:14.317202+00
\.


--
-- Data for Name: crm_calendars; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY; Owner: -
--

COPY "prj_1hKLEbTuzafY".crm_calendars (id, name, slug, description, calendar_type, owner_user_id, max_participants, date_range_days, slot_duration, slot_interval, max_bookings_per_day, min_notice_hours, buffer_before, buffer_after, timezone, is_active, meeting_location_type, meeting_location_value, host_notify_on_booking, google_calendar_id, google_refresh_token, calendly_user_uri, calendly_webhook_id, metadata, created_at, updated_at, calendly_connection_id) FROM stdin;
e73f9cea-50eb-4117-bf3b-835cac9964d8	Default Calendar	\N	\N	personal	6a1cb2d9f2abfd8042cf2ec9	1	\N	30	0	\N	1	0	0	America/New_York	t	custom	\N	t	\N	\N	\N	\N	{}	2026-05-31 22:16:14.197005+00	2026-05-31 22:16:14.197005+00	\N
\.


--
-- Data for Name: crm_calendly_connections; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY; Owner: -
--

COPY "prj_1hKLEbTuzafY".crm_calendly_connections (id, user_id, calendly_user_uri, calendly_user_email, calendly_user_name, calendly_org_uri, encrypted_access_token, signing_key, webhook_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: crm_campaigns; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY; Owner: -
--

COPY "prj_1hKLEbTuzafY".crm_campaigns (id, name, subject, html_body, text_body, status, list_id, filter_query, list_ids, style_preset, images, scheduled_at, sent_at, total_recipients, total_sent, total_opened, total_clicked, created_at) FROM stdin;
\.


--
-- Data for Name: crm_contact_lists; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY; Owner: -
--

COPY "prj_1hKLEbTuzafY".crm_contact_lists (id, contact_id, list_id, created_at) FROM stdin;
\.


--
-- Data for Name: crm_contacts; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY; Owner: -
--

COPY "prj_1hKLEbTuzafY".crm_contacts (id, email, name, phone, sms_opt_in, address, source, tags, metadata, ecom_customer_id, total_orders, total_spent, last_order_at, subscribed, subscribed_at, unsubscribed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: crm_events; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY; Owner: -
--

COPY "prj_1hKLEbTuzafY".crm_events (id, contact_id, campaign_id, channel, event_type, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: crm_flow_logs; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY; Owner: -
--

COPY "prj_1hKLEbTuzafY".crm_flow_logs (id, flow_id, step_id, contact_id, trigger_event, status, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: crm_flow_step_queue; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY; Owner: -
--

COPY "prj_1hKLEbTuzafY".crm_flow_step_queue (id, flow_id, contact_id, resume_step_order, run_at, attempts, max_attempts, last_error, event_data, locked_at, locked_by, finished_at, created_at) FROM stdin;
\.


--
-- Data for Name: crm_flow_steps; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY; Owner: -
--

COPY "prj_1hKLEbTuzafY".crm_flow_steps (id, flow_id, step_order, action_type, action_config, created_at) FROM stdin;
\.


--
-- Data for Name: crm_flows; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY; Owner: -
--

COPY "prj_1hKLEbTuzafY".crm_flows (id, name, trigger_type, trigger_config, is_active, cron_job_name, created_at, updated_at) FROM stdin;
ba5ee98f-3895-414d-a3ea-8369403d550c	Welcome Email	contact.subscribed	{}	f	\N	2026-05-31 22:16:13.907539+00	2026-05-31 22:16:13.907539+00
\.


--
-- Data for Name: crm_lists; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY; Owner: -
--

COPY "prj_1hKLEbTuzafY".crm_lists (id, name, description, filter_query, is_dynamic, created_at) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY; Owner: -
--

COPY "prj_1hKLEbTuzafY".profiles (id, nombre, rol, created_at) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

COPY "prj_1hKLEbTuzafY_auth".identities (id, user_id, provider, identity_data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

COPY "prj_1hKLEbTuzafY_auth".users (id, email, encrypted_password, email_confirmed_at, phone, created_at, updated_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_anonymous, phone_confirmed_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY_storage; Owner: -
--

COPY "prj_1hKLEbTuzafY_storage".buckets (id, name, public, created_at, updated_at, file_size_limit, allowed_mime_types) FROM stdin;
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: prj_1hKLEbTuzafY_storage; Owner: -
--

COPY "prj_1hKLEbTuzafY_storage".objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, path_tokens, version) FROM stdin;
\.


--
-- Name: crm_appointments crm_appointments_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_appointments
    ADD CONSTRAINT crm_appointments_pkey PRIMARY KEY (id);


--
-- Name: crm_availability crm_availability_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_availability
    ADD CONSTRAINT crm_availability_pkey PRIMARY KEY (id);


--
-- Name: crm_calendar_members crm_calendar_members_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_calendar_members
    ADD CONSTRAINT crm_calendar_members_pkey PRIMARY KEY (id);


--
-- Name: crm_calendars crm_calendars_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_calendars
    ADD CONSTRAINT crm_calendars_pkey PRIMARY KEY (id);


--
-- Name: crm_calendly_connections crm_calendly_connections_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_calendly_connections
    ADD CONSTRAINT crm_calendly_connections_pkey PRIMARY KEY (id);


--
-- Name: crm_campaigns crm_campaigns_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_campaigns
    ADD CONSTRAINT crm_campaigns_pkey PRIMARY KEY (id);


--
-- Name: crm_contact_lists crm_contact_lists_contact_id_list_id_key; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_contact_lists
    ADD CONSTRAINT crm_contact_lists_contact_id_list_id_key UNIQUE (contact_id, list_id);


--
-- Name: crm_contact_lists crm_contact_lists_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_contact_lists
    ADD CONSTRAINT crm_contact_lists_pkey PRIMARY KEY (id);


--
-- Name: crm_contacts crm_contacts_email_key; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_contacts
    ADD CONSTRAINT crm_contacts_email_key UNIQUE (email);


--
-- Name: crm_contacts crm_contacts_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_contacts
    ADD CONSTRAINT crm_contacts_pkey PRIMARY KEY (id);


--
-- Name: crm_events crm_events_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_events
    ADD CONSTRAINT crm_events_pkey PRIMARY KEY (id);


--
-- Name: crm_flow_logs crm_flow_logs_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_flow_logs
    ADD CONSTRAINT crm_flow_logs_pkey PRIMARY KEY (id);


--
-- Name: crm_flow_step_queue crm_flow_step_queue_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_flow_step_queue
    ADD CONSTRAINT crm_flow_step_queue_pkey PRIMARY KEY (id);


--
-- Name: crm_flow_steps crm_flow_steps_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_flow_steps
    ADD CONSTRAINT crm_flow_steps_pkey PRIMARY KEY (id);


--
-- Name: crm_flows crm_flows_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_flows
    ADD CONSTRAINT crm_flows_pkey PRIMARY KEY (id);


--
-- Name: crm_lists crm_lists_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_lists
    ADD CONSTRAINT crm_lists_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY_auth".identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY_auth".users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY_auth".users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_name_key; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY_storage; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY_storage".buckets
    ADD CONSTRAINT buckets_name_key UNIQUE (name);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY_storage; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY_storage".buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: objects objects_bucket_id_name_key; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY_storage; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY_storage".objects
    ADD CONSTRAINT objects_bucket_id_name_key UNIQUE (bucket_id, name);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: prj_1hKLEbTuzafY_storage; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY_storage".objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: crm_calendar_members_calendar_user_unique; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE UNIQUE INDEX crm_calendar_members_calendar_user_unique ON "prj_1hKLEbTuzafY".crm_calendar_members USING btree (calendar_id, user_id);


--
-- Name: crm_calendars_slug_unique; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE UNIQUE INDEX crm_calendars_slug_unique ON "prj_1hKLEbTuzafY".crm_calendars USING btree (slug) WHERE (slug IS NOT NULL);


--
-- Name: crm_calendly_connections_user_uri_unique; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE UNIQUE INDEX crm_calendly_connections_user_uri_unique ON "prj_1hKLEbTuzafY".crm_calendly_connections USING btree (user_id, calendly_user_uri);


--
-- Name: crm_events_channel_event_type_created_idx; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX crm_events_channel_event_type_created_idx ON "prj_1hKLEbTuzafY".crm_events USING btree (channel, event_type, created_at DESC);


--
-- Name: crm_events_contact_channel_event_type_idx; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX crm_events_contact_channel_event_type_idx ON "prj_1hKLEbTuzafY".crm_events USING btree (contact_id, channel, event_type);


--
-- Name: idx_crm_appointments_assigned_user_id; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_appointments_assigned_user_id ON "prj_1hKLEbTuzafY".crm_appointments USING btree (assigned_user_id);


--
-- Name: idx_crm_appointments_calendar_id; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_appointments_calendar_id ON "prj_1hKLEbTuzafY".crm_appointments USING btree (calendar_id);


--
-- Name: idx_crm_appointments_contact_id; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_appointments_contact_id ON "prj_1hKLEbTuzafY".crm_appointments USING btree (contact_id);


--
-- Name: idx_crm_appointments_starts_at; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_appointments_starts_at ON "prj_1hKLEbTuzafY".crm_appointments USING btree (starts_at);


--
-- Name: idx_crm_appointments_status; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_appointments_status ON "prj_1hKLEbTuzafY".crm_appointments USING btree (status);


--
-- Name: idx_crm_availability_calendar_id; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_availability_calendar_id ON "prj_1hKLEbTuzafY".crm_availability USING btree (calendar_id);


--
-- Name: idx_crm_calendar_members_calendar_id; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_calendar_members_calendar_id ON "prj_1hKLEbTuzafY".crm_calendar_members USING btree (calendar_id);


--
-- Name: idx_crm_calendar_members_user_id; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_calendar_members_user_id ON "prj_1hKLEbTuzafY".crm_calendar_members USING btree (user_id);


--
-- Name: idx_crm_calendars_calendly_connection; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_calendars_calendly_connection ON "prj_1hKLEbTuzafY".crm_calendars USING btree (calendly_connection_id) WHERE (calendly_connection_id IS NOT NULL);


--
-- Name: idx_crm_calendars_is_active; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_calendars_is_active ON "prj_1hKLEbTuzafY".crm_calendars USING btree (is_active);


--
-- Name: idx_crm_calendars_owner_user_id; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_calendars_owner_user_id ON "prj_1hKLEbTuzafY".crm_calendars USING btree (owner_user_id);


--
-- Name: idx_crm_calendly_connections_user_id; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_calendly_connections_user_id ON "prj_1hKLEbTuzafY".crm_calendly_connections USING btree (user_id);


--
-- Name: idx_crm_campaigns_created_at; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_campaigns_created_at ON "prj_1hKLEbTuzafY".crm_campaigns USING btree (created_at);


--
-- Name: idx_crm_campaigns_status; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_campaigns_status ON "prj_1hKLEbTuzafY".crm_campaigns USING btree (status);


--
-- Name: idx_crm_contact_lists_contact_id; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_contact_lists_contact_id ON "prj_1hKLEbTuzafY".crm_contact_lists USING btree (contact_id);


--
-- Name: idx_crm_contact_lists_list_id; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_contact_lists_list_id ON "prj_1hKLEbTuzafY".crm_contact_lists USING btree (list_id);


--
-- Name: idx_crm_contacts_created_at; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_contacts_created_at ON "prj_1hKLEbTuzafY".crm_contacts USING btree (created_at);


--
-- Name: idx_crm_contacts_email; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE UNIQUE INDEX idx_crm_contacts_email ON "prj_1hKLEbTuzafY".crm_contacts USING btree (email);


--
-- Name: idx_crm_contacts_source; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_contacts_source ON "prj_1hKLEbTuzafY".crm_contacts USING btree (source);


--
-- Name: idx_crm_contacts_subscribed; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_contacts_subscribed ON "prj_1hKLEbTuzafY".crm_contacts USING btree (subscribed);


--
-- Name: idx_crm_contacts_tags; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_contacts_tags ON "prj_1hKLEbTuzafY".crm_contacts USING gin (tags);


--
-- Name: idx_crm_events_campaign_id; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_events_campaign_id ON "prj_1hKLEbTuzafY".crm_events USING btree (campaign_id);


--
-- Name: idx_crm_events_channel; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_events_channel ON "prj_1hKLEbTuzafY".crm_events USING btree (channel);


--
-- Name: idx_crm_events_contact_id; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_events_contact_id ON "prj_1hKLEbTuzafY".crm_events USING btree (contact_id);


--
-- Name: idx_crm_events_created_at; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_events_created_at ON "prj_1hKLEbTuzafY".crm_events USING btree (created_at);


--
-- Name: idx_crm_events_event_type; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_events_event_type ON "prj_1hKLEbTuzafY".crm_events USING btree (event_type);


--
-- Name: idx_crm_flow_logs_contact_id; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_flow_logs_contact_id ON "prj_1hKLEbTuzafY".crm_flow_logs USING btree (contact_id);


--
-- Name: idx_crm_flow_logs_created_at; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_flow_logs_created_at ON "prj_1hKLEbTuzafY".crm_flow_logs USING btree (created_at);


--
-- Name: idx_crm_flow_logs_flow_id; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_flow_logs_flow_id ON "prj_1hKLEbTuzafY".crm_flow_logs USING btree (flow_id);


--
-- Name: idx_crm_flow_step_queue_due; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_flow_step_queue_due ON "prj_1hKLEbTuzafY".crm_flow_step_queue USING btree (run_at) WHERE ((finished_at IS NULL) AND (attempts < max_attempts));


--
-- Name: idx_crm_flow_steps_flow_id; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_flow_steps_flow_id ON "prj_1hKLEbTuzafY".crm_flow_steps USING btree (flow_id);


--
-- Name: idx_crm_flows_is_active; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_flows_is_active ON "prj_1hKLEbTuzafY".crm_flows USING btree (is_active);


--
-- Name: idx_crm_flows_trigger_type; Type: INDEX; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE INDEX idx_crm_flows_trigger_type ON "prj_1hKLEbTuzafY".crm_flows USING btree (trigger_type);


--
-- Name: idx_identities_user_id; Type: INDEX; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE INDEX idx_identities_user_id ON "prj_1hKLEbTuzafY_auth".identities USING btree (user_id);


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON "prj_1hKLEbTuzafY_auth".users FOR EACH ROW EXECUTE FUNCTION "prj_1hKLEbTuzafY".handle_new_user();


--
-- Name: crm_appointments crm_appointments_calendar_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_appointments
    ADD CONSTRAINT crm_appointments_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES "prj_1hKLEbTuzafY".crm_calendars(id) ON DELETE CASCADE;


--
-- Name: crm_appointments crm_appointments_contact_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_appointments
    ADD CONSTRAINT crm_appointments_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES "prj_1hKLEbTuzafY".crm_contacts(id) ON DELETE SET NULL;


--
-- Name: crm_availability crm_availability_calendar_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_availability
    ADD CONSTRAINT crm_availability_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES "prj_1hKLEbTuzafY".crm_calendars(id) ON DELETE CASCADE;


--
-- Name: crm_calendar_members crm_calendar_members_calendar_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_calendar_members
    ADD CONSTRAINT crm_calendar_members_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES "prj_1hKLEbTuzafY".crm_calendars(id) ON DELETE CASCADE;


--
-- Name: crm_calendars crm_calendars_calendly_connection_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_calendars
    ADD CONSTRAINT crm_calendars_calendly_connection_id_fkey FOREIGN KEY (calendly_connection_id) REFERENCES "prj_1hKLEbTuzafY".crm_calendly_connections(id) ON DELETE SET NULL;


--
-- Name: crm_campaigns crm_campaigns_list_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_campaigns
    ADD CONSTRAINT crm_campaigns_list_id_fkey FOREIGN KEY (list_id) REFERENCES "prj_1hKLEbTuzafY".crm_lists(id) ON DELETE SET NULL;


--
-- Name: crm_contact_lists crm_contact_lists_contact_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_contact_lists
    ADD CONSTRAINT crm_contact_lists_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES "prj_1hKLEbTuzafY".crm_contacts(id) ON DELETE CASCADE;


--
-- Name: crm_contact_lists crm_contact_lists_list_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_contact_lists
    ADD CONSTRAINT crm_contact_lists_list_id_fkey FOREIGN KEY (list_id) REFERENCES "prj_1hKLEbTuzafY".crm_lists(id) ON DELETE CASCADE;


--
-- Name: crm_events crm_events_campaign_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_events
    ADD CONSTRAINT crm_events_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES "prj_1hKLEbTuzafY".crm_campaigns(id) ON DELETE CASCADE;


--
-- Name: crm_events crm_events_contact_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_events
    ADD CONSTRAINT crm_events_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES "prj_1hKLEbTuzafY".crm_contacts(id) ON DELETE CASCADE;


--
-- Name: crm_flow_logs crm_flow_logs_contact_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_flow_logs
    ADD CONSTRAINT crm_flow_logs_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES "prj_1hKLEbTuzafY".crm_contacts(id) ON DELETE CASCADE;


--
-- Name: crm_flow_logs crm_flow_logs_flow_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_flow_logs
    ADD CONSTRAINT crm_flow_logs_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES "prj_1hKLEbTuzafY".crm_flows(id) ON DELETE CASCADE;


--
-- Name: crm_flow_logs crm_flow_logs_step_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_flow_logs
    ADD CONSTRAINT crm_flow_logs_step_id_fkey FOREIGN KEY (step_id) REFERENCES "prj_1hKLEbTuzafY".crm_flow_steps(id) ON DELETE SET NULL;


--
-- Name: crm_flow_step_queue crm_flow_step_queue_contact_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_flow_step_queue
    ADD CONSTRAINT crm_flow_step_queue_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES "prj_1hKLEbTuzafY".crm_contacts(id) ON DELETE CASCADE;


--
-- Name: crm_flow_step_queue crm_flow_step_queue_flow_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_flow_step_queue
    ADD CONSTRAINT crm_flow_step_queue_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES "prj_1hKLEbTuzafY".crm_flows(id) ON DELETE CASCADE;


--
-- Name: crm_flow_steps crm_flow_steps_flow_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".crm_flow_steps
    ADD CONSTRAINT crm_flow_steps_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES "prj_1hKLEbTuzafY".crm_flows(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY".profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES "prj_1hKLEbTuzafY_auth".users(id) ON DELETE CASCADE;


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY_auth".identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES "prj_1hKLEbTuzafY_auth".users(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucket_id_fkey; Type: FK CONSTRAINT; Schema: prj_1hKLEbTuzafY_storage; Owner: -
--

ALTER TABLE ONLY "prj_1hKLEbTuzafY_storage".objects
    ADD CONSTRAINT objects_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES "prj_1hKLEbTuzafY_storage".buckets(id) ON DELETE CASCADE;


--
-- Name: crm_appointments CRM appointments deletable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM appointments deletable" ON "prj_1hKLEbTuzafY".crm_appointments FOR DELETE USING (true);


--
-- Name: crm_appointments CRM appointments insertable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM appointments insertable" ON "prj_1hKLEbTuzafY".crm_appointments FOR INSERT WITH CHECK (true);


--
-- Name: crm_appointments CRM appointments readable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM appointments readable" ON "prj_1hKLEbTuzafY".crm_appointments FOR SELECT USING (true);


--
-- Name: crm_appointments CRM appointments updatable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM appointments updatable" ON "prj_1hKLEbTuzafY".crm_appointments FOR UPDATE USING (true);


--
-- Name: crm_availability CRM availability deletable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM availability deletable" ON "prj_1hKLEbTuzafY".crm_availability FOR DELETE USING (true);


--
-- Name: crm_availability CRM availability insertable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM availability insertable" ON "prj_1hKLEbTuzafY".crm_availability FOR INSERT WITH CHECK (true);


--
-- Name: crm_availability CRM availability readable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM availability readable" ON "prj_1hKLEbTuzafY".crm_availability FOR SELECT USING (true);


--
-- Name: crm_availability CRM availability updatable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM availability updatable" ON "prj_1hKLEbTuzafY".crm_availability FOR UPDATE USING (true);


--
-- Name: crm_calendar_members CRM calendar members deletable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM calendar members deletable" ON "prj_1hKLEbTuzafY".crm_calendar_members FOR DELETE USING (true);


--
-- Name: crm_calendar_members CRM calendar members insertable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM calendar members insertable" ON "prj_1hKLEbTuzafY".crm_calendar_members FOR INSERT WITH CHECK (true);


--
-- Name: crm_calendar_members CRM calendar members readable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM calendar members readable" ON "prj_1hKLEbTuzafY".crm_calendar_members FOR SELECT USING (true);


--
-- Name: crm_calendar_members CRM calendar members updatable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM calendar members updatable" ON "prj_1hKLEbTuzafY".crm_calendar_members FOR UPDATE USING (true);


--
-- Name: crm_calendars CRM calendars deletable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM calendars deletable" ON "prj_1hKLEbTuzafY".crm_calendars FOR DELETE USING (true);


--
-- Name: crm_calendars CRM calendars insertable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM calendars insertable" ON "prj_1hKLEbTuzafY".crm_calendars FOR INSERT WITH CHECK (true);


--
-- Name: crm_calendars CRM calendars readable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM calendars readable" ON "prj_1hKLEbTuzafY".crm_calendars FOR SELECT USING (true);


--
-- Name: crm_calendars CRM calendars updatable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM calendars updatable" ON "prj_1hKLEbTuzafY".crm_calendars FOR UPDATE USING (true);


--
-- Name: crm_campaigns CRM campaigns deletable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM campaigns deletable" ON "prj_1hKLEbTuzafY".crm_campaigns FOR DELETE USING (true);


--
-- Name: crm_campaigns CRM campaigns insertable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM campaigns insertable" ON "prj_1hKLEbTuzafY".crm_campaigns FOR INSERT WITH CHECK (true);


--
-- Name: crm_campaigns CRM campaigns readable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM campaigns readable" ON "prj_1hKLEbTuzafY".crm_campaigns FOR SELECT USING (true);


--
-- Name: crm_campaigns CRM campaigns updatable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM campaigns updatable" ON "prj_1hKLEbTuzafY".crm_campaigns FOR UPDATE USING (true);


--
-- Name: crm_contact_lists CRM contact lists deletable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM contact lists deletable" ON "prj_1hKLEbTuzafY".crm_contact_lists FOR DELETE USING (true);


--
-- Name: crm_contact_lists CRM contact lists insertable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM contact lists insertable" ON "prj_1hKLEbTuzafY".crm_contact_lists FOR INSERT WITH CHECK (true);


--
-- Name: crm_contact_lists CRM contact lists readable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM contact lists readable" ON "prj_1hKLEbTuzafY".crm_contact_lists FOR SELECT USING (true);


--
-- Name: crm_contacts CRM contacts deletable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM contacts deletable" ON "prj_1hKLEbTuzafY".crm_contacts FOR DELETE USING (true);


--
-- Name: crm_contacts CRM contacts insertable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM contacts insertable" ON "prj_1hKLEbTuzafY".crm_contacts FOR INSERT WITH CHECK (true);


--
-- Name: crm_contacts CRM contacts readable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM contacts readable" ON "prj_1hKLEbTuzafY".crm_contacts FOR SELECT USING (true);


--
-- Name: crm_contacts CRM contacts updatable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM contacts updatable" ON "prj_1hKLEbTuzafY".crm_contacts FOR UPDATE USING (true);


--
-- Name: crm_events CRM events insertable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM events insertable" ON "prj_1hKLEbTuzafY".crm_events FOR INSERT WITH CHECK (true);


--
-- Name: crm_events CRM events readable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM events readable" ON "prj_1hKLEbTuzafY".crm_events FOR SELECT USING (true);


--
-- Name: crm_flow_logs CRM flow logs insertable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM flow logs insertable" ON "prj_1hKLEbTuzafY".crm_flow_logs FOR INSERT WITH CHECK (true);


--
-- Name: crm_flow_logs CRM flow logs readable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM flow logs readable" ON "prj_1hKLEbTuzafY".crm_flow_logs FOR SELECT USING (true);


--
-- Name: crm_flow_step_queue CRM flow queue deletable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM flow queue deletable" ON "prj_1hKLEbTuzafY".crm_flow_step_queue FOR DELETE USING (true);


--
-- Name: crm_flow_step_queue CRM flow queue insertable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM flow queue insertable" ON "prj_1hKLEbTuzafY".crm_flow_step_queue FOR INSERT WITH CHECK (true);


--
-- Name: crm_flow_step_queue CRM flow queue readable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM flow queue readable" ON "prj_1hKLEbTuzafY".crm_flow_step_queue FOR SELECT USING (true);


--
-- Name: crm_flow_step_queue CRM flow queue updatable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM flow queue updatable" ON "prj_1hKLEbTuzafY".crm_flow_step_queue FOR UPDATE USING (true);


--
-- Name: crm_flow_steps CRM flow steps deletable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM flow steps deletable" ON "prj_1hKLEbTuzafY".crm_flow_steps FOR DELETE USING (true);


--
-- Name: crm_flow_steps CRM flow steps insertable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM flow steps insertable" ON "prj_1hKLEbTuzafY".crm_flow_steps FOR INSERT WITH CHECK (true);


--
-- Name: crm_flow_steps CRM flow steps readable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM flow steps readable" ON "prj_1hKLEbTuzafY".crm_flow_steps FOR SELECT USING (true);


--
-- Name: crm_flow_steps CRM flow steps updatable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM flow steps updatable" ON "prj_1hKLEbTuzafY".crm_flow_steps FOR UPDATE USING (true);


--
-- Name: crm_flows CRM flows deletable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM flows deletable" ON "prj_1hKLEbTuzafY".crm_flows FOR DELETE USING (true);


--
-- Name: crm_flows CRM flows insertable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM flows insertable" ON "prj_1hKLEbTuzafY".crm_flows FOR INSERT WITH CHECK (true);


--
-- Name: crm_flows CRM flows readable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM flows readable" ON "prj_1hKLEbTuzafY".crm_flows FOR SELECT USING (true);


--
-- Name: crm_flows CRM flows updatable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM flows updatable" ON "prj_1hKLEbTuzafY".crm_flows FOR UPDATE USING (true);


--
-- Name: crm_lists CRM lists deletable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM lists deletable" ON "prj_1hKLEbTuzafY".crm_lists FOR DELETE USING (true);


--
-- Name: crm_lists CRM lists insertable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM lists insertable" ON "prj_1hKLEbTuzafY".crm_lists FOR INSERT WITH CHECK (true);


--
-- Name: crm_lists CRM lists readable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM lists readable" ON "prj_1hKLEbTuzafY".crm_lists FOR SELECT USING (true);


--
-- Name: crm_lists CRM lists updatable; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "CRM lists updatable" ON "prj_1hKLEbTuzafY".crm_lists FOR UPDATE USING (true);


--
-- Name: crm_calendly_connections Calendly connections service only; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "Calendly connections service only" ON "prj_1hKLEbTuzafY".crm_calendly_connections USING (false) WITH CHECK (false);


--
-- Name: crm_appointments; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY".crm_appointments ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_availability; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY".crm_availability ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_calendar_members; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY".crm_calendar_members ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_calendars; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY".crm_calendars ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_calendly_connections; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY".crm_calendly_connections ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_campaigns; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY".crm_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_contact_lists; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY".crm_contact_lists ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_contacts; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY".crm_contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_events; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY".crm_events ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_flow_logs; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY".crm_flow_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_flow_step_queue; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY".crm_flow_step_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_flow_steps; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY".crm_flow_steps ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_flows; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY".crm_flows ENABLE ROW LEVEL SECURITY;

--
-- Name: crm_lists; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY".crm_lists ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles own profile insert; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "own profile insert" ON "prj_1hKLEbTuzafY".profiles FOR INSERT WITH CHECK (((NULLIF(current_setting('request.jwt.claim.sub'::text, true), ''::text))::uuid = id));


--
-- Name: profiles own profile select; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "own profile select" ON "prj_1hKLEbTuzafY".profiles FOR SELECT USING (((NULLIF(current_setting('request.jwt.claim.sub'::text, true), ''::text))::uuid = id));


--
-- Name: profiles own profile update; Type: POLICY; Schema: prj_1hKLEbTuzafY; Owner: -
--

CREATE POLICY "own profile update" ON "prj_1hKLEbTuzafY".profiles FOR UPDATE USING (((NULLIF(current_setting('request.jwt.claim.sub'::text, true), ''::text))::uuid = id));


--
-- Name: profiles; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY".profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: users Admin can delete all users; Type: POLICY; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE POLICY "Admin can delete all users" ON "prj_1hKLEbTuzafY_auth".users FOR DELETE TO "prj_1hKLEbTuzafY_role" USING (true);


--
-- Name: identities Admin can delete identities; Type: POLICY; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE POLICY "Admin can delete identities" ON "prj_1hKLEbTuzafY_auth".identities FOR DELETE TO "prj_1hKLEbTuzafY_role" USING (true);


--
-- Name: users Admin can insert users; Type: POLICY; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE POLICY "Admin can insert users" ON "prj_1hKLEbTuzafY_auth".users FOR INSERT TO "prj_1hKLEbTuzafY_role" WITH CHECK (true);


--
-- Name: users Admin can update all users; Type: POLICY; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE POLICY "Admin can update all users" ON "prj_1hKLEbTuzafY_auth".users FOR UPDATE TO "prj_1hKLEbTuzafY_role" USING (true);


--
-- Name: users Admin can view all users; Type: POLICY; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE POLICY "Admin can view all users" ON "prj_1hKLEbTuzafY_auth".users FOR SELECT TO "prj_1hKLEbTuzafY_role" USING (true);


--
-- Name: identities Users can delete own identities; Type: POLICY; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE POLICY "Users can delete own identities" ON "prj_1hKLEbTuzafY_auth".identities FOR DELETE USING ((user_id = "prj_1hKLEbTuzafY_auth".auth_uid()));


--
-- Name: users Users can delete own profile; Type: POLICY; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE POLICY "Users can delete own profile" ON "prj_1hKLEbTuzafY_auth".users FOR DELETE USING ((id = "prj_1hKLEbTuzafY_auth".auth_uid()));


--
-- Name: identities Users can insert own identities; Type: POLICY; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE POLICY "Users can insert own identities" ON "prj_1hKLEbTuzafY_auth".identities FOR INSERT WITH CHECK ((user_id = "prj_1hKLEbTuzafY_auth".auth_uid()));


--
-- Name: users Users can insert own profile; Type: POLICY; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE POLICY "Users can insert own profile" ON "prj_1hKLEbTuzafY_auth".users FOR INSERT WITH CHECK ((id = "prj_1hKLEbTuzafY_auth".auth_uid()));


--
-- Name: identities Users can update own identities; Type: POLICY; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE POLICY "Users can update own identities" ON "prj_1hKLEbTuzafY_auth".identities FOR UPDATE USING ((user_id = "prj_1hKLEbTuzafY_auth".auth_uid()));


--
-- Name: users Users can update own profile; Type: POLICY; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE POLICY "Users can update own profile" ON "prj_1hKLEbTuzafY_auth".users FOR UPDATE USING ((id = "prj_1hKLEbTuzafY_auth".auth_uid()));


--
-- Name: identities Users can view own identities; Type: POLICY; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE POLICY "Users can view own identities" ON "prj_1hKLEbTuzafY_auth".identities FOR SELECT USING ((user_id = "prj_1hKLEbTuzafY_auth".auth_uid()));


--
-- Name: users Users can view own profile; Type: POLICY; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

CREATE POLICY "Users can view own profile" ON "prj_1hKLEbTuzafY_auth".users FOR SELECT USING ((id = "prj_1hKLEbTuzafY_auth".auth_uid()));


--
-- Name: identities; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY_auth".identities ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY_auth; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY_auth".users ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets Service role can manage buckets; Type: POLICY; Schema: prj_1hKLEbTuzafY_storage; Owner: -
--

CREATE POLICY "Service role can manage buckets" ON "prj_1hKLEbTuzafY_storage".buckets USING (true);


--
-- Name: objects Service role can manage objects; Type: POLICY; Schema: prj_1hKLEbTuzafY_storage; Owner: -
--

CREATE POLICY "Service role can manage objects" ON "prj_1hKLEbTuzafY_storage".objects USING (true);


--
-- Name: buckets; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY_storage; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY_storage".buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: prj_1hKLEbTuzafY_storage; Owner: -
--

ALTER TABLE "prj_1hKLEbTuzafY_storage".objects ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--



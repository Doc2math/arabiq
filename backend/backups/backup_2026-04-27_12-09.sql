--
-- PostgreSQL database dump
--

\restrict mLFnTS1RAKTDRcffi20MbOO9gKSog9l3C78qC8gO1ql8Ct7QIQdn51veFNe5nz8

-- Dumped from database version 17.8
-- Dumped by pg_dump version 17.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_audit_log; Type: TABLE; Schema: public; Owner: arabiq
--

CREATE TABLE public.admin_audit_log (
    id uuid NOT NULL,
    admin_id uuid NOT NULL,
    action character varying(100) NOT NULL,
    resource_type character varying(50),
    resource_id character varying(100),
    details json NOT NULL,
    ip_address character varying(45),
    user_agent character varying(512),
    status character varying(20) NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.admin_audit_log OWNER TO arabiq;

--
-- Name: admin_roles; Type: TABLE; Schema: public; Owner: arabiq
--

CREATE TABLE public.admin_roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text NOT NULL,
    permissions json NOT NULL,
    is_active boolean NOT NULL,
    created_by uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.admin_roles OWNER TO arabiq;

--
-- Name: admin_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: arabiq
--

CREATE SEQUENCE public.admin_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_roles_id_seq OWNER TO arabiq;

--
-- Name: admin_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arabiq
--

ALTER SEQUENCE public.admin_roles_id_seq OWNED BY public.admin_roles.id;


--
-- Name: admin_sessions; Type: TABLE; Schema: public; Owner: arabiq
--

CREATE TABLE public.admin_sessions (
    id uuid NOT NULL,
    admin_id uuid NOT NULL,
    login_at timestamp with time zone NOT NULL,
    logout_at timestamp with time zone,
    duration_seconds integer,
    ip_address character varying(45),
    user_agent character varying(512),
    is_active boolean NOT NULL
);


ALTER TABLE public.admin_sessions OWNER TO arabiq;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: arabiq
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO arabiq;

--
-- Name: badges; Type: TABLE; Schema: public; Owner: arabiq
--

CREATE TABLE public.badges (
    id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text NOT NULL,
    icon_url character varying(512) NOT NULL,
    requirement text NOT NULL
);


ALTER TABLE public.badges OWNER TO arabiq;

--
-- Name: certifications; Type: TABLE; Schema: public; Owner: arabiq
--

CREATE TABLE public.certifications (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    module_id integer NOT NULL,
    bkt_score double precision NOT NULL,
    overall_score double precision NOT NULL,
    pdf_url character varying(512),
    certificate_number character varying(50) NOT NULL,
    issued_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone
);


ALTER TABLE public.certifications OWNER TO arabiq;

--
-- Name: courses; Type: TABLE; Schema: public; Owner: arabiq
--

CREATE TABLE public.courses (
    id integer NOT NULL,
    module_id integer NOT NULL,
    title character varying(200) NOT NULL,
    sort_order integer NOT NULL
);


ALTER TABLE public.courses OWNER TO arabiq;

--
-- Name: courses_id_seq; Type: SEQUENCE; Schema: public; Owner: arabiq
--

CREATE SEQUENCE public.courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courses_id_seq OWNER TO arabiq;

--
-- Name: courses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arabiq
--

ALTER SEQUENCE public.courses_id_seq OWNED BY public.courses.id;


--
-- Name: exercise_log; Type: TABLE; Schema: public; Owner: arabiq
--

CREATE TABLE public.exercise_log (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    lesson_id integer NOT NULL,
    exercise_id character varying(50) NOT NULL,
    skill_id character varying(50) NOT NULL,
    exercise_type character varying(30) NOT NULL,
    variant integer NOT NULL,
    correct boolean NOT NULL,
    response_time_ms integer,
    hint_used boolean NOT NULL,
    attempt integer NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.exercise_log OWNER TO arabiq;

--
-- Name: lesson_progress; Type: TABLE; Schema: public; Owner: arabiq
--

CREATE TABLE public.lesson_progress (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    lesson_id integer NOT NULL,
    score double precision NOT NULL,
    xp_earned integer NOT NULL,
    duration_seconds integer NOT NULL,
    attempts integer NOT NULL,
    completed_at timestamp with time zone NOT NULL
);


ALTER TABLE public.lesson_progress OWNER TO arabiq;

--
-- Name: lessons; Type: TABLE; Schema: public; Owner: arabiq
--

CREATE TABLE public.lessons (
    id integer NOT NULL,
    course_id integer NOT NULL,
    title character varying(200) NOT NULL,
    lesson_type character varying(50) NOT NULL,
    xp_reward integer NOT NULL,
    duration_minutes integer NOT NULL,
    sort_order integer NOT NULL,
    content json NOT NULL
);


ALTER TABLE public.lessons OWNER TO arabiq;

--
-- Name: lessons_id_seq; Type: SEQUENCE; Schema: public; Owner: arabiq
--

CREATE SEQUENCE public.lessons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lessons_id_seq OWNER TO arabiq;

--
-- Name: lessons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arabiq
--

ALTER SEQUENCE public.lessons_id_seq OWNED BY public.lessons.id;


--
-- Name: modules; Type: TABLE; Schema: public; Owner: arabiq
--

CREATE TABLE public.modules (
    id integer NOT NULL,
    slug character varying(80) NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    arabic_ratio double precision NOT NULL,
    sort_order integer NOT NULL,
    is_premium boolean NOT NULL,
    part_id integer
);


ALTER TABLE public.modules OWNER TO arabiq;

--
-- Name: modules_id_seq; Type: SEQUENCE; Schema: public; Owner: arabiq
--

CREATE SEQUENCE public.modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.modules_id_seq OWNER TO arabiq;

--
-- Name: modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arabiq
--

ALTER SEQUENCE public.modules_id_seq OWNED BY public.modules.id;


--
-- Name: parts; Type: TABLE; Schema: public; Owner: arabiq
--

CREATE TABLE public.parts (
    id integer NOT NULL,
    number integer NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    degree integer NOT NULL,
    sort_order integer NOT NULL,
    is_premium boolean NOT NULL,
    color character varying(20) NOT NULL,
    icon character varying(10) NOT NULL
);


ALTER TABLE public.parts OWNER TO arabiq;

--
-- Name: parts_id_seq; Type: SEQUENCE; Schema: public; Owner: arabiq
--

CREATE SEQUENCE public.parts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.parts_id_seq OWNER TO arabiq;

--
-- Name: parts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arabiq
--

ALTER SEQUENCE public.parts_id_seq OWNED BY public.parts.id;


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: arabiq
--

CREATE TABLE public.user_badges (
    user_id uuid NOT NULL,
    badge_id character varying(50) NOT NULL,
    earned_at timestamp with time zone NOT NULL
);


ALTER TABLE public.user_badges OWNER TO arabiq;

--
-- Name: users; Type: TABLE; Schema: public; Owner: arabiq
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(80) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    native_language character varying(10) NOT NULL,
    avatar_url character varying(512),
    xp integer NOT NULL,
    level integer NOT NULL,
    streak integer NOT NULL,
    longest_streak integer NOT NULL,
    last_activity_date timestamp with time zone,
    is_premium boolean NOT NULL,
    is_admin boolean NOT NULL,
    is_active boolean NOT NULL,
    is_verified boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    role character varying(20) DEFAULT 'student'::character varying NOT NULL,
    permissions json DEFAULT '[]'::json NOT NULL
);


ALTER TABLE public.users OWNER TO arabiq;

--
-- Name: admin_roles id; Type: DEFAULT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.admin_roles ALTER COLUMN id SET DEFAULT nextval('public.admin_roles_id_seq'::regclass);


--
-- Name: courses id; Type: DEFAULT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.courses ALTER COLUMN id SET DEFAULT nextval('public.courses_id_seq'::regclass);


--
-- Name: lessons id; Type: DEFAULT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.lessons ALTER COLUMN id SET DEFAULT nextval('public.lessons_id_seq'::regclass);


--
-- Name: modules id; Type: DEFAULT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.modules ALTER COLUMN id SET DEFAULT nextval('public.modules_id_seq'::regclass);


--
-- Name: parts id; Type: DEFAULT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.parts ALTER COLUMN id SET DEFAULT nextval('public.parts_id_seq'::regclass);


--
-- Data for Name: admin_audit_log; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.admin_audit_log (id, admin_id, action, resource_type, resource_id, details, ip_address, user_agent, status, created_at) FROM stdin;
\.


--
-- Data for Name: admin_roles; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.admin_roles (id, name, description, permissions, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: admin_sessions; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.admin_sessions (id, admin_id, login_at, logout_at, duration_seconds, ip_address, user_agent, is_active) FROM stdin;
\.


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.alembic_version (version_num) FROM stdin;
7da3b1ccb357
\.


--
-- Data for Name: badges; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.badges (id, name, description, icon_url, requirement) FROM stdin;
\.


--
-- Data for Name: certifications; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.certifications (id, user_id, module_id, bkt_score, overall_score, pdf_url, certificate_number, issued_at, expires_at) FROM stdin;
d215b218-d95a-4729-806d-980426899ce6	e5c15073-a411-4386-a73a-fb553d9c8cca	1	1	1	/api/v1/certifications/d215b218-d95a-4729-806d-980426899ce6/download	LANGDAD-2026-E5C150-M1	2026-04-26 22:03:34.017498+02	\N
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.courses (id, module_id, title, sort_order) FROM stdin;
11	1	Module 1 — مَكْتَبٌ	1
\.


--
-- Data for Name: exercise_log; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.exercise_log (id, user_id, lesson_id, exercise_id, skill_id, exercise_type, variant, correct, response_time_ms, hint_used, attempt, created_at) FROM stdin;
da61cda6-fab9-4f0e-8d50-fe400e9c4984	e5c15073-a411-4386-a73a-fb553d9c8cca	111	m1l1_ex1	letter_recognition	mcq	4	t	7468	f	1	2026-04-26 21:05:44.610371+02
45c568d3-793d-407f-b2ff-aff922eee4e0	e5c15073-a411-4386-a73a-fb553d9c8cca	111	m1l1_ex4	letter_recognition	mcq	3	t	5091	f	1	2026-04-26 21:05:51.473021+02
99222858-2b63-40de-a5e8-c00d71cf745f	e5c15073-a411-4386-a73a-fb553d9c8cca	111	m1l1_ex6	letter_recognition	matching_text_audio	4	t	6837	f	1	2026-04-26 21:05:59.787479+02
ef09c922-9ec5-4984-91a0-efb22d19d8c3	e5c15073-a411-4386-a73a-fb553d9c8cca	111	m1l1_ex3	letter_recognition	mcq	3	t	3836	f	1	2026-04-26 21:06:05.401302+02
8770dfdb-548d-4feb-bd56-35e8ef86d9dd	e5c15073-a411-4386-a73a-fb553d9c8cca	111	m1l1_ex5	letter_recognition	matching_text_audio	4	t	10631	f	1	2026-04-26 21:06:17.50022+02
edd02646-1656-4de9-a73b-2607e3e5bd04	e5c15073-a411-4386-a73a-fb553d9c8cca	111	m1l1_ex7	letter_recognition	matching_text_audio	3	t	5531	f	1	2026-04-26 21:06:24.802405+02
3bae37d3-4e23-440a-8e45-be0c96419c33	e5c15073-a411-4386-a73a-fb553d9c8cca	111	m1l1_ex8	letter_recognition	matching_text_audio	3	t	7457	f	1	2026-04-26 21:06:33.731004+02
9921ba57-0cf7-43ec-833c-99bd8f2ded0a	e5c15073-a411-4386-a73a-fb553d9c8cca	111	m1l1_ex2	letter_recognition	mcq	4	t	9066	f	1	2026-04-26 21:06:44.562679+02
b6095361-520d-4077-9c23-183280d4b811	e5c15073-a411-4386-a73a-fb553d9c8cca	112	m1l2_ex5	harakat_reading	audio_choice	1	t	2728	f	1	2026-04-26 21:07:10.131373+02
8e887d4c-44ab-4b5b-aeb3-dfbd392da56d	e5c15073-a411-4386-a73a-fb553d9c8cca	112	m1l2_ex7	harakat_reading	audio_choice	1	t	4591	f	1	2026-04-26 21:07:16.189864+02
992379b1-6154-4b79-94fe-7e5ac0f0a1f2	e5c15073-a411-4386-a73a-fb553d9c8cca	112	m1l2_ex4	harakat_reading	mcq	1	t	3482	f	1	2026-04-26 21:07:21.147406+02
2903d661-5edc-42e6-93bb-bf4ac825c6a1	e5c15073-a411-4386-a73a-fb553d9c8cca	112	m1l2_ex2	harakat_reading	audio_choice	1	t	6473	f	1	2026-04-26 21:07:29.408162+02
47e375d0-2371-4df6-bd4e-db0c1e56f95d	e5c15073-a411-4386-a73a-fb553d9c8cca	112	m1l2_ex6	harakat_reading	mcq	1	t	7314	f	1	2026-04-26 21:07:38.211938+02
291dad9e-f73a-4f66-b65e-3382dd4df0ad	e5c15073-a411-4386-a73a-fb553d9c8cca	112	m1l2_ex1	harakat_reading	audio_choice	1	t	3478	f	1	2026-04-26 21:07:43.162011+02
0675475e-f730-4ace-9b62-ced15f779bf5	e5c15073-a411-4386-a73a-fb553d9c8cca	112	m1l2_ex8	harakat_reading	matching_text_audio	1	t	65419	f	1	2026-04-26 21:08:50.36259+02
d3153045-897b-4f13-90cd-9bc5c5ca3e97	e5c15073-a411-4386-a73a-fb553d9c8cca	112	m1l2_ex3	harakat_reading	mcq	1	t	3351	f	1	2026-04-26 21:08:55.191696+02
abac9539-45c6-47de-a797-921a9b60e054	e5c15073-a411-4386-a73a-fb553d9c8cca	113	m1l3_ex1	long_vowels	mcq	1	t	2843	f	1	2026-04-26 21:09:17.869362+02
979c188f-1689-416a-94e6-b3f7c64ae19d	e5c15073-a411-4386-a73a-fb553d9c8cca	113	m1l3_ex6	long_vowels	mcq	1	t	3015	f	1	2026-04-26 21:09:22.358058+02
aa0db96c-3581-4f30-9300-fcc9be02af15	e5c15073-a411-4386-a73a-fb553d9c8cca	113	m1l3_ex7	long_vowels	matching_text_audio	1	t	18313	f	1	2026-04-26 21:09:42.143259+02
0374b5c7-b315-40dc-bf26-f9bbe674d493	e5c15073-a411-4386-a73a-fb553d9c8cca	113	m1l3_ex3	long_vowels	mcq	1	t	8070	f	1	2026-04-26 21:09:51.992643+02
5cbb9b12-02a0-4a63-a13d-719cd4e4a89c	e5c15073-a411-4386-a73a-fb553d9c8cca	113	m1l3_ex4	long_vowels	audio_choice	1	t	3786	f	1	2026-04-26 21:09:57.246738+02
23e2ee21-b4ba-4dc8-bb06-d5824ae255f7	e5c15073-a411-4386-a73a-fb553d9c8cca	113	m1l3_ex2	long_vowels	audio_choice	1	t	4868	f	1	2026-04-26 21:10:03.89598+02
5523c67b-05f8-445b-bfc1-815fc490b6c6	e5c15073-a411-4386-a73a-fb553d9c8cca	113	m1l3_ex5	long_vowels	mcq	1	t	2826	f	1	2026-04-26 21:10:08.199781+02
8a436146-7929-4657-ac1a-ea6ae18a39e6	e5c15073-a411-4386-a73a-fb553d9c8cca	114	m1l4_ex6	tanwin	audio_choice	1	t	3954	f	1	2026-04-26 21:13:47.057847+02
ac61b039-e667-4416-8afd-c40762dcbb01	e5c15073-a411-4386-a73a-fb553d9c8cca	114	m1l4_ex5	tanwin	mcq	1	t	3526	f	1	2026-04-26 21:13:52.055003+02
8a1ef67f-3500-489b-970e-d4b41679b167	e5c15073-a411-4386-a73a-fb553d9c8cca	114	m1l4_ex1	tanwin	mcq	1	t	4005	f	1	2026-04-26 21:13:57.562667+02
57d04b12-c0e9-401d-8a41-7ccbb340a84c	e5c15073-a411-4386-a73a-fb553d9c8cca	114	m1l4_ex4	tanwin	mcq	1	t	3996	f	1	2026-04-26 21:14:03.356304+02
3289d917-1390-43d2-84e1-346682e502e8	e5c15073-a411-4386-a73a-fb553d9c8cca	114	m1l4_ex8	tanwin	matching_text_audio	1	t	65422	f	1	2026-04-26 21:15:10.572443+02
4928ec1c-7081-4602-a9e3-dec5c519c2df	e5c15073-a411-4386-a73a-fb553d9c8cca	114	m1l4_ex3	tanwin	mcq	1	t	5341	f	1	2026-04-26 21:15:17.383621+02
482b6258-b39d-4952-afde-d4e72d2c16c2	e5c15073-a411-4386-a73a-fb553d9c8cca	114	m1l4_ex7	tanwin	mcq	1	t	8522	f	1	2026-04-26 21:15:27.689715+02
c208862e-511e-4d82-af1d-b1d8b2ab4fec	e5c15073-a411-4386-a73a-fb553d9c8cca	114	m1l4_ex2	tanwin	audio_choice	1	t	4205	f	1	2026-04-26 21:15:33.375912+02
bebaf647-af26-4dbd-b2f0-8d7cb9c86d33	e5c15073-a411-4386-a73a-fb553d9c8cca	115	m1l5_ex1	letter_positions	mcq	1	t	21551	f	1	2026-04-26 21:16:14.348736+02
142a076f-4b17-4927-a300-ad5feba6493d	e5c15073-a411-4386-a73a-fb553d9c8cca	115	m1l5_ex8	letter_positions	mcq	1	t	9224	f	1	2026-04-26 21:16:25.065497+02
1095cac7-9d32-4bed-a4f6-8fcd24f15d68	e5c15073-a411-4386-a73a-fb553d9c8cca	115	m1l5_ex2	letter_positions	mcq	1	t	30951	f	1	2026-04-26 21:16:57.813647+02
33368917-d47d-4d4d-a659-3f43df943c5c	e5c15073-a411-4386-a73a-fb553d9c8cca	115	m1l5_ex7	letter_positions	mcq	1	f	8403	f	1	2026-04-26 21:17:07.682386+02
f8d60f5f-b07e-46e6-859a-df50f65ce3e6	e5c15073-a411-4386-a73a-fb553d9c8cca	115	m1l5_ex3	letter_positions	mcq	1	t	4928	f	1	2026-04-26 21:17:14.394393+02
6764a086-7c25-44eb-8b67-5b39750ca0cd	e5c15073-a411-4386-a73a-fb553d9c8cca	115	m1l5_ex5	letter_positions	mcq	1	t	7098	f	1	2026-04-26 21:17:22.971396+02
1ee523b0-2449-4d69-beb8-1a9992925a24	e5c15073-a411-4386-a73a-fb553d9c8cca	115	m1l5_ex6	letter_positions	mcq	1	f	3787	f	1	2026-04-26 21:17:28.540708+02
37176925-d4bd-4cbb-8e4b-0910ff50292b	e5c15073-a411-4386-a73a-fb553d9c8cca	115	m1l5_ex4	letter_positions	mcq	1	t	11100	f	1	2026-04-26 21:17:41.11771+02
cbbb0481-b5be-4181-989a-1ecdb3006005	e5c15073-a411-4386-a73a-fb553d9c8cca	115	m1l5_ex7	letter_positions	mcq	1	t	9661	f	1	2026-04-26 21:17:54.505401+02
c0d85373-c97c-45de-91b2-0ced52070fcb	e5c15073-a411-4386-a73a-fb553d9c8cca	115	m1l5_ex1	letter_positions	mcq	1	t	6067	f	1	2026-04-26 21:18:02.065462+02
e8c6ca06-9286-4955-8519-96b9dfd0833e	e5c15073-a411-4386-a73a-fb553d9c8cca	115	m1l5_ex3	letter_positions	mcq	1	t	4798	f	1	2026-04-26 21:18:08.649909+02
2b06bfe4-efa2-4c59-925f-17210652c4a6	e5c15073-a411-4386-a73a-fb553d9c8cca	115	m1l5_ex6	letter_positions	mcq	1	t	9814	f	1	2026-04-26 21:18:19.959906+02
12ed552c-e18b-4948-869b-f891a132b0ff	e5c15073-a411-4386-a73a-fb553d9c8cca	115	m1l5_ex8	letter_positions	mcq	1	t	8439	f	1	2026-04-26 21:18:30.208894+02
6f56860d-efd7-49bd-994e-0e13ba93bcc5	e5c15073-a411-4386-a73a-fb553d9c8cca	115	m1l5_ex2	letter_positions	mcq	1	t	12117	f	1	2026-04-26 21:18:43.817726+02
c16a31bc-0670-4a41-b8e9-75f0e8fd48d3	e5c15073-a411-4386-a73a-fb553d9c8cca	115	m1l5_ex5	letter_positions	mcq	1	t	5665	f	1	2026-04-26 21:18:51.284139+02
40d3b57f-e6af-4a5b-a05f-f20648e276e8	e5c15073-a411-4386-a73a-fb553d9c8cca	115	m1l5_ex4	letter_positions	mcq	1	f	19291	f	1	2026-04-26 21:19:12.068418+02
d1453cd6-cfc2-43fe-922e-aef29ea3d9a8	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex_img1	word_comprehension	matching_image_word	1	f	42043	f	1	2026-04-26 21:20:10.442582+02
c0774de6-dbb8-4257-9e5e-9b8ff11ea0c8	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex2	word_comprehension	matching	1	t	20189	f	1	2026-04-26 21:20:32.419582+02
2f87d9eb-6fcd-4bc6-b186-ec3c2afe6c5f	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex1	word_reading	audio_choice	1	t	5087	f	1	2026-04-26 21:20:38.988769+02
8649abe9-2038-4088-a311-f7a88999c606	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex3	word_comprehension	mcq	1	t	6105	f	1	2026-04-26 21:20:46.878999+02
a0c36e17-1288-4518-9247-be4c84a0a95d	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex5	word_comprehension	mcq	1	t	6538	f	1	2026-04-26 21:20:54.8862+02
5d8b852c-4d2e-44c4-9295-33aef9e560aa	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex6	word_comprehension	mcq	1	t	4798	f	1	2026-04-26 21:21:01.4762+02
8f5b0adf-8f95-460e-9711-6913ee8d7797	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex_txa1	word_reading	matching_text_audio	1	t	27508	f	1	2026-04-26 21:21:30.459784+02
e07d535a-ecfd-45ae-a80a-210057b51240	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex4	word_reading	audio_choice	1	t	4107	f	1	2026-04-26 21:21:36.343925+02
0b512eaa-77f0-4947-a434-d654a564bac0	e5c15073-a411-4386-a73a-fb553d9c8cca	117	m1l7_ex4	word_reading	audio_choice	1	t	4359	f	1	2026-04-26 21:22:04.142649+02
8d421ec6-49fa-4da0-89c7-0962fea1debe	e5c15073-a411-4386-a73a-fb553d9c8cca	117	m1l7_ex5	word_comprehension	mcq	1	t	4351	f	1	2026-04-26 21:22:09.972673+02
1b5dbe4b-9550-43ee-ab20-3547459c3872	e5c15073-a411-4386-a73a-fb553d9c8cca	117	m1l7_ex2	word_comprehension	matching	1	t	19416	f	1	2026-04-26 21:22:31.178677+02
37cdbbf6-cb0e-4bfb-a3d0-7316c2ca8d93	e5c15073-a411-4386-a73a-fb553d9c8cca	117	m1l7_ex_txa1	word_reading	matching_text_audio	1	t	35506	f	1	2026-04-26 21:23:08.167174+02
1308a228-1644-40d0-8a70-d2b3b9ccdbc2	e5c15073-a411-4386-a73a-fb553d9c8cca	117	m1l7_ex1	word_comprehension	mcq	1	t	3690	f	1	2026-04-26 21:23:13.656294+02
c69669d3-430f-452f-b1da-392bdf5ee213	e5c15073-a411-4386-a73a-fb553d9c8cca	117	m1l7_ex_img1	word_comprehension	matching_image_word	1	f	21673	f	1	2026-04-26 21:23:36.816765+02
135ca922-b18f-4d20-ab46-44aeaea87874	e5c15073-a411-4386-a73a-fb553d9c8cca	117	m1l7_ex6	word_comprehension	mcq	1	t	10727	f	1	2026-04-26 21:23:49.328757+02
d1a48e94-859f-4081-9ba9-dab55868c6a2	e5c15073-a411-4386-a73a-fb553d9c8cca	117	m1l7_ex3	word_comprehension	mcq	1	t	6939	f	1	2026-04-26 21:23:57.761378+02
25ac3cc5-ebd4-44f6-9dc2-dc0a9a26b6f7	e5c15073-a411-4386-a73a-fb553d9c8cca	118	m1l8_ex8	word_writing	input_text	1	t	165490	f	1	2026-04-26 21:26:51.615103+02
03e6bcea-9750-47fa-9d05-a3a5f61a0b01	e5c15073-a411-4386-a73a-fb553d9c8cca	118	m1l8_ex2	word_writing	input_text	1	t	11481	f	1	2026-04-26 21:27:04.572244+02
7c79327d-ef93-4a89-ad86-34677348d3f8	e5c15073-a411-4386-a73a-fb553d9c8cca	118	m1l8_ex3	word_writing	input_text	1	t	15059	f	1	2026-04-26 21:27:21.423679+02
2e26f668-1715-4f77-b752-0220e1e74781	e5c15073-a411-4386-a73a-fb553d9c8cca	118	m1l8_ex7	word_writing	drawing	1	t	15880	f	1	2026-04-26 21:27:38.776455+02
ce2f5a53-31e9-48ec-90d1-e50bd4fa136f	e5c15073-a411-4386-a73a-fb553d9c8cca	118	m1l8_ex5	word_writing	input_text	1	t	17694	f	1	2026-04-26 21:27:58.252497+02
725c2ac6-a705-4a8b-bf65-6ba766d87ae3	e5c15073-a411-4386-a73a-fb553d9c8cca	118	m1l8_ex6	word_writing	drawing	1	t	9011	f	1	2026-04-26 21:28:08.733501+02
be8aeece-586e-43b0-8deb-c9381c59c04a	e5c15073-a411-4386-a73a-fb553d9c8cca	118	m1l8_ex4	word_writing	input_text	1	t	82054	f	1	2026-04-26 21:29:32.640731+02
6d2e5c39-7820-4319-b556-74bc01cb6406	e5c15073-a411-4386-a73a-fb553d9c8cca	118	m1l8_ex1	word_writing	input_text	1	t	5224	f	1	2026-04-26 21:29:39.342769+02
11bd6b80-e881-4c18-8f78-b90ccb80da7c	e5c15073-a411-4386-a73a-fb553d9c8cca	119	m1l9_ex3	word_building	mcq	1	t	16468	f	1	2026-04-26 21:30:06.54477+02
a87ec19a-bd12-4667-bb9a-c7ce1173c720	e5c15073-a411-4386-a73a-fb553d9c8cca	119	m1l9_ex6	word_building	mcq	1	t	10808	f	1	2026-04-26 21:30:19.181376+02
51954399-b554-48c3-878e-fd7b18b43c0d	e5c15073-a411-4386-a73a-fb553d9c8cca	119	m1l9_ex1	word_building	drag_drop	1	t	4347	f	1	2026-04-26 21:30:25.031377+02
5cbb5cd5-fe7a-48db-99c9-8c7127691977	e5c15073-a411-4386-a73a-fb553d9c8cca	119	m1l9_ex2	word_building	drag_drop	1	t	10080	f	1	2026-04-26 21:30:36.891746+02
cd39ca84-7940-493f-aeb6-025958cfdd48	e5c15073-a411-4386-a73a-fb553d9c8cca	119	m1l9_ex4	word_building	mcq	1	t	3259	f	1	2026-04-26 21:30:41.637767+02
fa8d0888-ef27-47fb-a0c7-1e880fd18422	e5c15073-a411-4386-a73a-fb553d9c8cca	119	m1l9_ex5	word_building	drag_drop	1	t	3275	f	1	2026-04-26 21:30:46.406344+02
c9492c7c-b762-4a8c-b8fc-14e02a8dfe84	e5c15073-a411-4386-a73a-fb553d9c8cca	120	m1l10_ex2	sentence_reading	mcq	1	t	5218	f	1	2026-04-26 21:31:05.934172+02
e8dd7813-87c9-415c-9d19-b3cb309bf7ad	e5c15073-a411-4386-a73a-fb553d9c8cca	120	m1l10_ex3	sentence_reading	word_order	1	t	22050	f	1	2026-04-26 21:31:29.452298+02
23137213-e946-4427-8925-7900ef8ae517	e5c15073-a411-4386-a73a-fb553d9c8cca	120	m1l10_ex_txa1	sentence_reading	matching_text_audio	1	t	36891	f	1	2026-04-26 21:32:08.20939+02
df0e1170-5c94-41b7-9c45-2d76ad9fea6a	e5c15073-a411-4386-a73a-fb553d9c8cca	120	m1l10_ex5	sentence_reading	mcq	1	t	3410	f	1	2026-04-26 21:32:13.121419+02
fdab9061-3ae3-4e1b-b477-df864261eaef	e5c15073-a411-4386-a73a-fb553d9c8cca	120	m1l10_ex1	sentence_reading	audio_choice	1	t	7835	f	1	2026-04-26 21:32:22.439429+02
a3998cf6-7ed5-4bd5-96cf-ed501b4d038e	e5c15073-a411-4386-a73a-fb553d9c8cca	120	m1l10_ex4	sentence_reading	word_order	1	t	10435	f	1	2026-04-26 21:32:34.6574+02
270dd969-5cdd-42c0-af35-f3af606251d5	e5c15073-a411-4386-a73a-fb553d9c8cca	120	m1l10_ex6	sentence_reading	matching	1	t	8586	f	1	2026-04-26 21:32:44.730327+02
d0b2f721-37ae-4967-9031-a8e2c85793b9	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex1	letter_recognition	mcq	1	t	3063	f	1	2026-04-26 21:32:53.847828+02
50acd9ca-b166-4615-8532-9921e9cb2561	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex2	harakat_reading	audio_choice	1	t	2788	f	1	2026-04-26 21:32:58.133406+02
6248967b-2dff-4fc9-b237-cec0b8210bf9	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex3	long_vowels	mcq	1	t	9749	f	1	2026-04-26 21:33:09.370863+02
5d974d17-6c06-4781-b525-9937a18b77be	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex4	tanwin	mcq	1	t	5263	f	1	2026-04-26 21:33:16.148466+02
2047ed2d-64c2-48b6-ad25-e79b99561457	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex5	letter_positions	mcq	1	t	6591	f	1	2026-04-26 21:33:24.229424+02
62f936ec-2499-40ac-8480-1e85cd92cd9e	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex6	word_reading	audio_choice	1	t	3415	f	1	2026-04-26 21:33:29.126307+02
c5672af1-a384-4e04-9623-6fe9b4cafb4d	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex7	word_comprehension	matching	1	t	9951	f	1	2026-04-26 21:33:40.556263+02
40439ffe-6dbc-4f8b-9db4-17860a9933cf	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex8	word_writing	input_text	1	t	12536	f	1	2026-04-26 21:33:54.871987+02
ee3ebc77-b3a7-4fe0-ad4a-796ae5c39328	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex9	sentence_reading	word_order	1	t	19050	f	1	2026-04-26 21:34:15.386448+02
130ab4b1-f0cd-49aa-bc9f-2cd7c8b9ffb0	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex10	word_building	drag_drop	1	t	4835	f	1	2026-04-26 21:34:22.010066+02
56a23e77-5440-4938-8449-a3263ab2b7fd	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex11	word_reading	matching_text_audio	1	t	31813	f	1	2026-04-26 21:34:55.350817+02
4945ab25-11b2-4727-a85b-321023e46b0c	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex1	letter_recognition	mcq	1	t	7713	f	1	2026-04-26 22:01:19.534851+02
945ec7c8-772f-473c-b4b8-04adcc804c7c	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex2	harakat_reading	audio_choice	1	t	3015	f	1	2026-04-26 22:01:24.034549+02
d603fc3e-a254-4135-9568-8bf46c5011e2	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex3	long_vowels	mcq	1	t	4843	f	1	2026-04-26 22:01:30.364531+02
8171e7cc-4f27-42c8-8257-ec155a364a7b	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex4	tanwin	mcq	1	t	3989	f	1	2026-04-26 22:01:35.824844+02
b6d33b20-e2b3-4654-897b-dd3a83eacb0e	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex5	letter_positions	mcq	1	t	11030	f	1	2026-04-26 22:01:48.344283+02
e2a72dc7-a164-40dd-b287-cb1b1b62bb25	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex6	word_reading	audio_choice	1	t	3028	f	1	2026-04-26 22:01:52.838734+02
41979355-c47f-4eb8-b1d6-0b5ca9670b90	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex7	word_comprehension	matching	1	t	8663	f	1	2026-04-26 22:02:02.98348+02
7a254171-63bb-44db-afc9-553c68c86a80	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex8	word_writing	input_text	1	t	20715	f	1	2026-04-26 22:02:25.47725+02
8a96748e-54eb-4f2a-adb1-173f355ed3d6	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex9	sentence_reading	word_order	1	t	15667	f	1	2026-04-26 22:02:42.616127+02
e8d03aaf-3d1c-43d3-bf60-1fd2466c9f77	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex10	word_building	drag_drop	1	t	5503	f	1	2026-04-26 22:02:49.886531+02
e80a175c-7ec1-48b6-b4a0-4b14628a43b9	e5c15073-a411-4386-a73a-fb553d9c8cca	121	m1l11_ex11	word_reading	matching_text_audio	1	t	30706	f	1	2026-04-26 22:03:22.073763+02
3b3a3f74-46d0-4605-bb2d-cfe707fb2b15	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex1	word_reading	audio_choice	1	t	17900	f	1	2026-04-27 00:20:02.982908+02
e289413d-ce87-4a84-b788-975742dbfe4c	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex3	word_comprehension	mcq	1	t	2980	f	1	2026-04-27 00:20:07.462514+02
a4adceb7-2ab2-4395-8b87-090809718fc5	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex5	word_comprehension	mcq	1	t	3115	f	1	2026-04-27 00:20:12.054442+02
5b117040-a8c2-436d-8d54-cd2b493fc86e	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex2	word_comprehension	matching	1	t	27213	f	1	2026-04-27 00:20:40.750158+02
c10bf3ac-a4e6-43ca-afb3-e29e73eb6f18	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex_img1	word_comprehension	matching_image_word	1	t	60911	f	1	2026-04-27 00:21:43.444502+02
1dca02b4-9373-45fd-bf38-7ed4748a59dc	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex2	word_comprehension	matching	1	t	20137	f	1	2026-04-27 00:22:23.865876+02
b22c5a14-e615-417e-814e-3aa455ca5da8	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex4	word_reading	audio_choice	1	t	5145	f	1	2026-04-27 00:22:30.482616+02
8aa8b503-82be-438f-b2ac-1976c7dccace	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex5	word_comprehension	mcq	1	t	4155	f	1	2026-04-27 00:22:36.109045+02
6c1a7bd4-24e5-45f6-93d5-2bf631bfe2d7	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex6	word_comprehension	mcq	1	f	2840	f	1	2026-04-27 00:26:24.687002+02
574e2e35-c8dd-47ca-a93f-520ed5749bf6	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex3	word_comprehension	mcq	1	f	2265	f	1	2026-04-27 00:26:28.435062+02
d7c9b254-091d-41c7-a1fc-e211165cbdcb	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex1	word_reading	audio_choice	1	t	2586	f	1	2026-04-27 00:26:32.498954+02
6d655eaa-1fec-4d9d-b6f2-c5920466af23	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex_txa1	word_reading	matching_text_audio	1	f	13407	f	1	2026-04-27 00:26:47.700676+02
0229130f-1ae7-492f-bf3e-de72a1b9d5d3	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex5	word_comprehension	mcq	1	t	2294	f	1	2026-04-27 00:26:51.457213+02
096c8614-effc-4c10-b183-65cf3ddbbfe4	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex2	word_comprehension	matching	1	f	9531	f	1	2026-04-27 00:27:02.464976+02
ebf6f9bf-3650-4308-ab07-1c0849db7717	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex4	word_reading	audio_choice	1	f	1619	f	1	2026-04-27 00:27:05.561288+02
a02cbb37-7d4e-4951-8dc3-b718cd179091	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex3	word_comprehension	mcq	1	t	1323	f	1	2026-04-27 00:41:42.406701+02
f9a293cd-9151-4199-b831-4bd09883b6d7	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex4	word_reading	audio_choice	1	t	4156	f	1	2026-04-27 00:41:48.064503+02
261dd737-7033-4a72-82b1-ce7aa5fe6a55	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex6	word_comprehension	mcq	1	t	2850	f	1	2026-04-27 00:41:52.40965+02
bd709e2e-a973-45fd-9bce-b03e7ddfcb9d	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex5	word_comprehension	mcq	1	f	1745	f	1	2026-04-27 00:41:55.634305+02
c156516e-21a0-4147-9d2f-ac11e69041c1	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex1	word_reading	audio_choice	1	f	1418	f	1	2026-04-27 00:45:30.872137+02
4a722b56-6e5b-45a2-b509-6fcfda4620d5	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex5	word_comprehension	mcq	1	t	1279	f	1	2026-04-27 00:45:33.63055+02
7b6d710f-8302-4646-95ed-5ab200a4f8ee	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex2	word_comprehension	matching	1	f	10537	f	1	2026-04-27 00:45:45.642176+02
08eca3c7-a6cb-4ceb-94cf-337494535231	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex_img1	word_comprehension	matching_image_word	1	t	100909	f	1	2026-04-27 00:47:28.367126+02
9e525884-3574-46cb-aebb-3051b726249c	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex2	word_comprehension	matching	1	f	12039	f	1	2026-04-27 00:48:52.238652+02
dfc52181-9833-45cc-a084-648fc30182d3	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex5	word_comprehension	mcq	1	f	1692	f	1	2026-04-27 00:48:55.394935+02
cafe82e8-159a-46a3-8126-0c0541fff497	e5c15073-a411-4386-a73a-fb553d9c8cca	116	m1l6_ex_img1	word_comprehension	matching_image_word	1	f	136733	f	1	2026-04-27 00:51:13.918973+02
\.


--
-- Data for Name: lesson_progress; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.lesson_progress (id, user_id, lesson_id, score, xp_earned, duration_seconds, attempts, completed_at) FROM stdin;
cd4b6a68-b70c-45de-8c78-ae86a298bca9	e5c15073-a411-4386-a73a-fb553d9c8cca	117	0.875	30	120	1	2026-04-26 21:23:59.254122+02
e78ea950-d742-4fe4-9660-18838952ef6e	e5c15073-a411-4386-a73a-fb553d9c8cca	118	1	30	120	1	2026-04-26 21:29:40.822768+02
c930a9a5-2dd7-4f08-8a88-3fb6475fbfc1	e5c15073-a411-4386-a73a-fb553d9c8cca	119	1	30	90	1	2026-04-26 21:30:47.889099+02
e4ebc30f-5d89-4947-9377-6264dd319008	e5c15073-a411-4386-a73a-fb553d9c8cca	120	1	35	105	1	2026-04-26 21:32:46.209987+02
51ea8c24-9fca-4dd5-8dfc-a74a38d5fa68	e5c15073-a411-4386-a73a-fb553d9c8cca	121	1	60	165	2	2026-04-26 21:34:56.834623+02
0c9b6258-6b85-401b-b563-ea56e1f74008	e5c15073-a411-4386-a73a-fb553d9c8cca	111	1	20	120	1	2026-04-26 21:06:46.030703+02
624f5301-343e-4538-ab0c-7332ed2f11c1	e5c15073-a411-4386-a73a-fb553d9c8cca	112	1	25	120	1	2026-04-26 21:08:56.667987+02
6c925481-f40a-4036-947a-7886705a034c	e5c15073-a411-4386-a73a-fb553d9c8cca	113	1	25	105	1	2026-04-26 21:10:09.677601+02
2abbcedc-1da0-404b-ae21-8ac79054bf42	e5c15073-a411-4386-a73a-fb553d9c8cca	114	1	25	120	1	2026-04-26 21:15:34.8652+02
5e9a0abc-0018-4a31-9111-20dc79fdd95d	e5c15073-a411-4386-a73a-fb553d9c8cca	115	0.875	25	120	2	2026-04-26 21:17:42.591353+02
0019d69e-29da-458e-b659-a07b339b8f68	e5c15073-a411-4386-a73a-fb553d9c8cca	116	0.875	30	120	1	2026-04-26 21:21:37.81577+02
\.


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.lessons (id, course_id, title, lesson_type, xp_reward, duration_minutes, sort_order, content) FROM stdin;
115	11	Positions des lettres — début, milieu, fin	identification	25	20	5	{"introduction": {"text": "En arabe, toutes les lettres s'attachent \\u00e0 la lettre qui les pr\\u00e9c\\u00e8de (\\u00e0 droite). Mais 6 lettres ne s'attachent jamais \\u00e0 la lettre qui les suit (\\u00e0 gauche) :\\n\\n\\u0627  \\u062f  \\u0630  \\u0631  \\u0632  \\u0648", "examples": [{"ar": "\\u0628\\u064e\\u0627\\u0628\\u064c", "phoneme": "baabun", "description": "Le 2\\u00e8me \\u0628 vient apr\\u00e8s \\u0627 \\u2192 forme initiale \\u0628\\u0640", "audio": "/assets/audio/words/bab.mp3"}, {"ar": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "phoneme": "kitaabun", "description": "Le \\u0628 final vient apr\\u00e8s \\u0627 \\u2192 forme finale \\u0640\\u0628", "audio": "/assets/audio/words/kitab.mp3"}, {"ar": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064e\\u0629\\u064c", "phoneme": "kitaabatun", "description": "\\u0629 vient apr\\u00e8s \\u0628 \\u2192 Ta marbuta attach\\u00e9e \\u0640\\u0629", "audio": "/assets/audio/words/kitaba_nom.mp3"}, {"ar": "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "phoneme": "kaatibun", "description": "\\u062a vient apr\\u00e8s \\u0627 \\u2192 forme initiale \\u062a\\u0640", "audio": "/assets/audio/words/katib.mp3"}], "rules": [{"title": "Les 6 lettres non-connectantes \\u00e0 gauche", "ar": "\\u0627  \\u062f  \\u0630  \\u0631  \\u0632  \\u0648", "description": "Ces lettres s'attachent \\u00e0 droite mais jamais \\u00e0 gauche."}, {"title": "Kaf \\u0643 en position finale", "ar": "\\u0640\\u0643", "description": "Kaf prend la forme finale \\u0640\\u0643."}, {"title": "Ta marbuta \\u0629", "ar": "\\u0629 / \\u0640\\u0629", "description": "Uniquement en fin de mot."}], "positions": [{"letter": "\\u0645", "name": "Mim", "audio": "/assets/audio/letters/mim.mp3", "forms": [{"position": "Isol\\u00e9e", "ar": "\\u0645", "note": ""}, {"position": "D\\u00e9but", "ar": "\\u0645\\u0640", "example": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "note": ""}, {"position": "Milieu", "ar": "\\u0640\\u0645\\u0640", "example": "\\u062a\\u064e\\u0645\\u064e\\u0651", "note": ""}, {"position": "Fin", "ar": "\\u0640\\u0645", "example": "\\u0642\\u064e\\u0644\\u064e\\u0645", "note": ""}]}, {"letter": "\\u0643", "name": "Kaf", "audio": "/assets/audio/letters/kaf.mp3", "forms": [{"position": "Isol\\u00e9e", "ar": "\\u0643", "note": ""}, {"position": "D\\u00e9but", "ar": "\\u0643\\u0640", "example": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "note": ""}, {"position": "Milieu", "ar": "\\u0640\\u0643\\u0640", "example": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "note": ""}, {"position": "Fin", "ar": "\\u0640\\u0643", "example": "\\u0645\\u064e\\u0644\\u0650\\u0643", "note": "Peut aussi s'\\u00e9crire \\u0640\\u06a9"}]}, {"letter": "\\u062a", "name": "Ta", "audio": "/assets/audio/letters/ta.mp3", "forms": [{"position": "Isol\\u00e9e", "ar": "\\u062a", "note": ""}, {"position": "D\\u00e9but", "ar": "\\u062a\\u0640", "example": "\\u062a\\u064e\\u0645\\u064e\\u0651", "note": ""}, {"position": "Milieu", "ar": "\\u0640\\u062a\\u0640", "example": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "note": ""}, {"position": "Fin (Ta ouverte)", "ar": "\\u0640\\u062a", "example": "\\u0628\\u064e\\u0627\\u062a\\u064e", "note": ""}, {"position": "Fin (Ta marbuta att)", "ar": "\\u0640\\u0629", "example": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064e\\u0629\\u064c", "note": ""}, {"position": "Fin (Ta marbuta iso)", "ar": "\\u0629", "example": "\\u0648\\u064e\\u0631\\u0652\\u062f\\u064e\\u0629", "note": ""}]}, {"letter": "\\u0628", "name": "Ba", "audio": "/assets/audio/letters/ba.mp3", "forms": [{"position": "Isol\\u00e9e", "ar": "\\u0628", "note": ""}, {"position": "D\\u00e9but", "ar": "\\u0628\\u0640", "example": "\\u0628\\u064e\\u0627\\u0628\\u064c", "note": ""}, {"position": "Milieu", "ar": "\\u0640\\u0628\\u0640", "example": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064e\\u0629\\u064c", "note": ""}, {"position": "Fin", "ar": "\\u0640\\u0628", "example": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "note": ""}, {"position": "Fin apr\\u00e8s \\u0627 \\u0648 \\u0631 \\u0632 \\u062f \\u0630", "ar": "\\u0628", "example": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "note": ""}]}]}, "passing_score": 0.8, "exercises": [{"id": "m1l5_ex1", "type": "mcq", "skill_id": "letter_positions", "prompt": "Dans \\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c, la lettre \\u0628 est en quelle position ?", "promptAr": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "xpReward": 5, "options": ["D\\u00e9but", "Milieu", "Fin (finale)", "Isol\\u00e9e"], "correctIndex": 2, "explanation": "\\u0628 est la derni\\u00e8re lettre \\u2014 forme finale \\u0640\\u0628."}, {"id": "m1l5_ex2", "type": "mcq", "skill_id": "letter_positions", "prompt": "Dans \\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c, la lettre \\u0643 est en quelle position ?", "promptAr": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "xpReward": 5, "options": ["Isol\\u00e9e", "Finale", "Initiale (d\\u00e9but)", "M\\u00e9diane (milieu)"], "correctIndex": 2, "explanation": "\\u0643 est la premi\\u00e8re lettre \\u2014 forme initiale \\u0643\\u0640."}, {"id": "m1l5_ex3", "type": "mcq", "skill_id": "letter_positions", "prompt": "Combien de formes peut avoir une lettre arabe ?", "promptAr": null, "xpReward": 3, "options": ["1", "2", "3", "4"], "correctIndex": 3, "explanation": "Jusqu'\\u00e0 4 formes : isol\\u00e9e, initiale, m\\u00e9diane, finale."}, {"id": "m1l5_ex4", "type": "mcq", "skill_id": "letter_positions", "prompt": "Quelle est la forme initiale (d\\u00e9but) de \\u0628 ?", "promptAr": "\\u0628", "xpReward": 4, "options": ["\\u0640\\u0628", "\\u0628\\u0640", "\\u0640\\u0628\\u0640", "\\u0628"], "correctIndex": 1, "explanation": "\\u0628\\u0640 est la forme initiale \\u2014 utilis\\u00e9e au d\\u00e9but d'un mot."}, {"id": "m1l5_ex5", "type": "mcq", "skill_id": "letter_positions", "prompt": "Dans \\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c, la lettre \\u062a est en quelle position ?", "promptAr": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "xpReward": 5, "options": ["Initiale", "M\\u00e9diane (milieu)", "Finale", "Isol\\u00e9e"], "correctIndex": 1, "explanation": "\\u062a est au milieu de \\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c \\u2014 forme m\\u00e9diane \\u0640\\u062a\\u0640."}, {"id": "m1l5_ex6", "type": "mcq", "skill_id": "letter_positions", "prompt": "La forme \\u0640\\u0643 correspond \\u00e0 quelle position ?", "promptAr": "\\u0640\\u0643", "xpReward": 4, "options": ["Initiale", "M\\u00e9diane", "Finale", "Isol\\u00e9e"], "correctIndex": 2, "explanation": "\\u0640\\u0643 = forme finale \\u2014 \\u0643 en fin de mot."}, {"id": "m1l5_ex7", "type": "mcq", "skill_id": "letter_positions", "prompt": "Dans \\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c, quelle est la forme de \\u062a au milieu ?", "promptAr": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "xpReward": 6, "options": ["\\u062a\\u0640 (initiale)", "\\u0640\\u062a\\u0640 (m\\u00e9diane)", "\\u0640\\u062a (finale)", "\\u062a (isol\\u00e9e)"], "correctIndex": 1, "explanation": "\\u062a est au milieu de \\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c \\u2014 forme m\\u00e9diane \\u0640\\u062a\\u0640."}, {"id": "m1l5_ex8", "type": "mcq", "skill_id": "letter_positions", "prompt": "Dans \\u0628\\u064e\\u0627\\u0628\\u064c, le premier \\u0628 est en quelle position ?", "promptAr": "\\u0628\\u064e\\u0627\\u0628\\u064c", "xpReward": 5, "options": ["Isol\\u00e9e", "Initiale (\\u0628\\u0640)", "M\\u00e9diane", "Finale"], "correctIndex": 1, "explanation": "Le premier \\u0628 dans \\u0628\\u064e\\u0627\\u0628\\u064c est en position initiale \\u2014 forme \\u0628\\u0640."}]}
111	11	Les 4 lettres dorées — م ك ت ب	identification	20	15	1	{"introduction": {"text": "Voici les 4 lettres du Module 1. Cliquez sur chaque carte pour entendre son nom. M\\u00e9morisez bien leur forme avant de passer aux exercices.", "letters": [{"ar": "\\u0645", "name": "Mim", "phoneme": "m", "audio": "/assets/audio/letters/mim.mp3"}, {"ar": "\\u0643", "name": "Kaf", "phoneme": "k", "audio": "/assets/audio/letters/kaf.mp3"}, {"ar": "\\u062a", "name": "Ta", "phoneme": "t", "audio": "/assets/audio/letters/ta.mp3"}, {"ar": "\\u0628", "name": "Ba", "phoneme": "b", "audio": "/assets/audio/letters/ba.mp3"}]}, "passing_score": 0.8, "exercises": [{"id": "m1l1_ex1", "type": "mcq", "skill_id": "letter_recognition", "xpReward": 3, "explanation": "\\u0645 = Mim. Elle ressemble \\u00e0 un cercle avec une petite queue vers le bas.", "variants": [{"level": 1, "lang": "fr", "prompt": "Quelle est cette lettre ?", "promptAr": "\\u0645", "options": ["Ba", "Mim", "Kaf", "Ta"], "correctIndex": 1}, {"level": 2, "lang": "fr", "prompt": "Quelle est cette lettre ?", "promptAr": "\\u0645", "options": ["Fa", "Mim", "Qaf", "Nun"], "correctIndex": 1}, {"level": 3, "lang": "fr", "prompt": "Parmi ces lettres, laquelle est Mim ?", "promptAr": null, "options": ["\\u0646", "\\u0645", "\\u0641", "\\u0642"], "correctIndex": 1}, {"level": 4, "lang": "fr", "prompt": "Quelle lettre ressemble \\u00e0 un cercle avec une petite queue vers le bas ?", "promptAr": null, "options": ["Kaf", "Ba", "Mim", "Ta"], "correctIndex": 2}]}, {"id": "m1l1_ex2", "type": "mcq", "skill_id": "letter_recognition", "xpReward": 3, "explanation": "\\u0628 = Ba. Une coque plate avec un seul point en dessous.", "variants": [{"level": 1, "lang": "fr", "prompt": "Quelle est cette lettre ?", "promptAr": "\\u0628", "options": ["Ta", "Kaf", "Ba", "Mim"], "correctIndex": 2}, {"level": 2, "lang": "fr", "prompt": "Quelle est cette lettre ?", "promptAr": "\\u0628", "options": ["Ta", "Ba", "Tha", "Nun"], "correctIndex": 1}, {"level": 3, "lang": "fr", "prompt": "Parmi ces lettres, laquelle est Ba ?", "promptAr": null, "options": ["\\u062a", "\\u062b", "\\u0628", "\\u0646"], "correctIndex": 2}, {"level": 4, "lang": "fr", "prompt": "Quelle lettre a une coque plate avec un seul point en dessous ?", "promptAr": null, "options": ["Ta", "Tha", "Nun", "Ba"], "correctIndex": 3}]}, {"id": "m1l1_ex3", "type": "mcq", "skill_id": "letter_recognition", "xpReward": 3, "explanation": "\\u0643 = Kaf.", "variants": [{"level": 1, "lang": "fr", "prompt": "Quelle est cette lettre ?", "promptAr": "\\u0643", "options": ["Kaf", "Mim", "Ba", "Ta"], "correctIndex": 0}, {"level": 2, "lang": "fr", "prompt": "Quelle est cette lettre ?", "promptAr": "\\u0643", "options": ["Lam", "Kaf", "Ra", "Waw"], "correctIndex": 1}, {"level": 3, "lang": "fr", "prompt": "Parmi ces lettres, laquelle est Kaf ?", "promptAr": null, "options": ["\\u0644", "\\u0643", "\\u0631", "\\u0648"], "correctIndex": 1}]}, {"id": "m1l1_ex4", "type": "mcq", "skill_id": "letter_recognition", "xpReward": 3, "explanation": "\\u062a = Ta. Identique \\u00e0 Ba mais avec deux points au-dessus.", "variants": [{"level": 1, "lang": "fr", "prompt": "Quelle est cette lettre ?", "promptAr": "\\u062a", "options": ["Ba", "Ta", "Mim", "Kaf"], "correctIndex": 1}, {"level": 2, "lang": "fr", "prompt": "Quelle est cette lettre ?", "promptAr": "\\u062a", "options": ["Ba", "Ta", "Tha", "Nun"], "correctIndex": 1}, {"level": 3, "lang": "fr", "prompt": "Parmi ces lettres, laquelle est Ta ?", "promptAr": null, "options": ["\\u0628", "\\u062a", "\\u062b", "\\u0646"], "correctIndex": 1}, {"level": 4, "lang": "fr", "prompt": "Quelle lettre ressemble \\u00e0 Ba mais avec deux points au-dessus au lieu d'un seul en dessous ?", "promptAr": null, "options": ["Nun", "Ba", "Ta", "Tha"], "correctIndex": 2}]}, {"id": "m1l1_ex5", "type": "audio_choice", "skill_id": "letter_recognition", "xpReward": 4, "explanation": "Vous avez entendu Mim \\u2192 \\u0645", "variants": [{"level": 1, "lang": "fr", "prompt": "\\u00c9coutez et identifiez la lettre", "audioUrl": "/assets/audio/letters/mim.mp3", "options": ["\\u062a", "\\u0628", "\\u0645", "\\u0643"], "correctIndex": 2}, {"level": 2, "lang": "fr", "prompt": "Quelle lettre entendez-vous ?", "audioUrl": "/assets/audio/letters/mim.mp3", "options": ["\\u0645", "\\u0646", "\\u0641", "\\u0642"], "correctIndex": 0}, {"level": 3, "type": "matching_text_audio", "lang": "fr", "prompt": "\\u00c9coute les sons et trouve celui qui correspond \\u00e0 cette lettre", "pairs": [{"text": "\\u0645", "audioUrl": "/assets/audio/letters/mim.mp3"}], "audioPool": ["/assets/audio/letters/mim.mp3", "/assets/audio/letters/ba.mp3", "/assets/audio/letters/kaf.mp3", "/assets/audio/letters/ta.mp3"]}, {"level": 4, "type": "matching_text_audio", "lang": "fr", "prompt": "\\u00c9coute les sons et trouve celui qui correspond \\u00e0 cette lettre", "pairs": [{"text": "\\u0645", "audioUrl": "/assets/audio/letters/mim.mp3"}], "audioPool": ["/assets/audio/letters/mim.mp3", "/assets/audio/letters/nun.mp3", "/assets/audio/letters/fa.mp3", "/assets/audio/letters/qaf.mp3"]}]}, {"id": "m1l1_ex6", "type": "audio_choice", "skill_id": "letter_recognition", "xpReward": 4, "explanation": "Vous avez entendu Ba \\u2192 \\u0628", "variants": [{"level": 1, "lang": "fr", "prompt": "\\u00c9coutez et identifiez la lettre", "audioUrl": "/assets/audio/letters/ba.mp3", "options": ["\\u0645", "\\u0628", "\\u0643", "\\u062a"], "correctIndex": 1}, {"level": 2, "lang": "fr", "prompt": "Quelle lettre entendez-vous ?", "audioUrl": "/assets/audio/letters/ba.mp3", "options": ["\\u062a", "\\u0628", "\\u062b", "\\u0646"], "correctIndex": 1}, {"level": 3, "type": "matching_text_audio", "lang": "fr", "prompt": "\\u00c9coute les sons et trouve celui qui correspond \\u00e0 cette lettre", "pairs": [{"text": "\\u0628", "audioUrl": "/assets/audio/letters/ba.mp3"}], "audioPool": ["/assets/audio/letters/ba.mp3", "/assets/audio/letters/mim.mp3", "/assets/audio/letters/kaf.mp3", "/assets/audio/letters/ta.mp3"]}, {"level": 4, "type": "matching_text_audio", "lang": "fr", "prompt": "\\u00c9coute les sons et trouve celui qui correspond \\u00e0 cette lettre", "pairs": [{"text": "\\u0628", "audioUrl": "/assets/audio/letters/ba.mp3"}], "audioPool": ["/assets/audio/letters/ba.mp3", "/assets/audio/letters/ta.mp3", "/assets/audio/letters/tha.mp3", "/assets/audio/letters/nun.mp3"]}]}, {"id": "m1l1_ex7", "type": "audio_choice", "skill_id": "letter_recognition", "xpReward": 4, "explanation": "Vous avez entendu Kaf \\u2192 \\u0643", "variants": [{"level": 1, "lang": "fr", "prompt": "\\u00c9coutez et identifiez la lettre", "audioUrl": "/assets/audio/letters/kaf.mp3", "options": ["\\u0643", "\\u062a", "\\u0628", "\\u0645"], "correctIndex": 0}, {"level": 2, "lang": "fr", "prompt": "Quelle lettre entendez-vous ?", "audioUrl": "/assets/audio/letters/kaf.mp3", "options": ["\\u0644", "\\u0643", "\\u0631", "\\u0648"], "correctIndex": 1}, {"level": 3, "type": "matching_text_audio", "lang": "fr", "prompt": "\\u00c9coute les sons et trouve celui qui correspond \\u00e0 cette lettre", "pairs": [{"text": "\\u0643", "audioUrl": "/assets/audio/letters/kaf.mp3"}], "audioPool": ["/assets/audio/letters/kaf.mp3", "/assets/audio/letters/ba.mp3", "/assets/audio/letters/mim.mp3", "/assets/audio/letters/ta.mp3"]}]}, {"id": "m1l1_ex8", "type": "audio_choice", "skill_id": "letter_recognition", "xpReward": 4, "explanation": "Vous avez entendu Ta \\u2192 \\u062a", "variants": [{"level": 1, "lang": "fr", "prompt": "\\u00c9coutez et identifiez la lettre", "audioUrl": "/assets/audio/letters/ta.mp3", "options": ["\\u0628", "\\u0645", "\\u0643", "\\u062a"], "correctIndex": 3}, {"level": 2, "lang": "fr", "prompt": "Quelle lettre entendez-vous ?", "audioUrl": "/assets/audio/letters/ta.mp3", "options": ["\\u0628", "\\u062a", "\\u062b", "\\u0646"], "correctIndex": 1}, {"level": 3, "type": "matching_text_audio", "lang": "fr", "prompt": "\\u00c9coute les sons et trouve celui qui correspond \\u00e0 cette lettre", "pairs": [{"text": "\\u062a", "audioUrl": "/assets/audio/letters/ta.mp3"}], "audioPool": ["/assets/audio/letters/ta.mp3", "/assets/audio/letters/ba.mp3", "/assets/audio/letters/mim.mp3", "/assets/audio/letters/kaf.mp3"]}, {"level": 4, "type": "matching_text_audio", "lang": "fr", "prompt": "\\u00c9coute les sons et trouve celui qui correspond \\u00e0 cette lettre", "pairs": [{"text": "\\u062a", "audioUrl": "/assets/audio/letters/ta.mp3"}], "audioPool": ["/assets/audio/letters/ta.mp3", "/assets/audio/letters/ba.mp3", "/assets/audio/letters/tha.mp3", "/assets/audio/letters/nun.mp3"]}]}]}
112	11	Harakat — les voyelles courtes	harakat	25	20	2	{"introduction": {"text": "Les harakat sont de petits signes qui donnent leur son aux lettres. Cliquez sur chaque carte pour entendre la syllabe.", "signs": [{"ar": "\\u0628\\u064e", "phoneme": "ba", "description": "Fatha \\u2192 son 'a'", "audio": "/assets/audio/syllables/ba_fatha.mp3"}, {"ar": "\\u0628\\u0650", "phoneme": "bi", "description": "Kasra \\u2192 son 'i'", "audio": "/assets/audio/syllables/ba_kasra.mp3"}, {"ar": "\\u0628\\u064f", "phoneme": "bu", "description": "Damma \\u2192 son 'ou'", "audio": "/assets/audio/syllables/ba_damma.mp3"}, {"ar": "\\u0628\\u0652", "phoneme": "b", "description": "Suk\\u016bn \\u2192 pas de voyelle", "audio": "/assets/audio/syllables/ba_sukun.mp3"}, {"ar": "\\u0643\\u064e", "phoneme": "ka", "description": "Fatha \\u2192 son 'a'", "audio": "/assets/audio/syllables/kaf_fatha.mp3"}, {"ar": "\\u0643\\u0650", "phoneme": "ki", "description": "Kasra \\u2192 son 'i'", "audio": "/assets/audio/syllables/kaf_kasra.mp3"}, {"ar": "\\u0643\\u064f", "phoneme": "ku", "description": "Damma \\u2192 son 'ou'", "audio": "/assets/audio/syllables/kaf_damma.mp3"}, {"ar": "\\u0643\\u0652", "phoneme": "k", "description": "Suk\\u016bn \\u2192 pas de voyelle", "audio": "/assets/audio/syllables/kaf_sukun.mp3"}, {"ar": "\\u062a\\u0652", "phoneme": "t", "description": "Suk\\u016bn \\u2192 pas de voyelle", "audio": "/assets/audio/syllables/ta_sukun.mp3"}, {"ar": "\\u062a\\u064e", "phoneme": "ta", "description": "Fatha \\u2192 son 'a'", "audio": "/assets/audio/syllables/ta_fatha.mp3"}, {"ar": "\\u062a\\u0650", "phoneme": "ti", "description": "Kasra \\u2192 son 'i'", "audio": "/assets/audio/syllables/ta_kasra.mp3"}, {"ar": "\\u062a\\u064f", "phoneme": "tu", "description": "Damma \\u2192 son 'ou'", "audio": "/assets/audio/syllables/ta_damma.mp3"}, {"ar": "\\u0645\\u064e", "phoneme": "ma", "description": "Fatha \\u2192 son 'a'", "audio": "/assets/audio/syllables/mim_fatha.mp3"}, {"ar": "\\u0645\\u0650", "phoneme": "mi", "description": "Kasra \\u2192 son 'i'", "audio": "/assets/audio/syllables/mim_kasra.mp3"}, {"ar": "\\u0645\\u064f", "phoneme": "mu", "description": "Damma \\u2192 son 'ou'", "audio": "/assets/audio/syllables/mim_damma.mp3"}, {"ar": "\\u0645\\u0652", "phoneme": "m", "description": "Suk\\u016bn \\u2192 pas de voyelle", "audio": "/assets/audio/syllables/mim_sukun.mp3"}]}, "passing_score": 0.8, "exercises": [{"id": "m1l2_ex1", "type": "audio_choice", "skill_id": "harakat_reading", "prompt": "\\u00c9coutez et identifiez la syllabe", "audioUrl": "/assets/audio/syllables/ba_fatha.mp3", "xpReward": 4, "options": ["\\u0628\\u064e", "\\u0628\\u0650", "\\u0628\\u064f", "\\u0628\\u0652"], "correctIndex": 0, "explanation": "\\u0628\\u064e = ba \\u2014 fatha au-dessus.", "prompts": ["\\u00c9coutez et identifiez la syllabe", "Quelle syllabe entendez-vous ?", "Reconnaissez la syllabe entendue", "Identifiez la syllabe apr\\u00e8s \\u00e9coute"]}, {"id": "m1l2_ex2", "type": "audio_choice", "skill_id": "harakat_reading", "prompt": "\\u00c9coutez et identifiez la syllabe", "audioUrl": "/assets/audio/syllables/kaf_kasra.mp3", "xpReward": 4, "options": ["\\u0643\\u064e", "\\u0643\\u0650", "\\u0643\\u064f", "\\u0643\\u0652"], "correctIndex": 1, "explanation": "\\u0643\\u0650 = ki \\u2014 kasra en dessous.", "prompts": ["\\u00c9coutez et identifiez la syllabe", "Quelle syllabe entendez-vous ?", "Reconnaissez la syllabe entendue", "Identifiez la syllabe apr\\u00e8s \\u00e9coute"]}, {"id": "m1l2_ex3", "type": "mcq", "skill_id": "harakat_reading", "prompt": "Comment se prononce cette syllabe ?", "promptAr": "\\u062a\\u064f", "xpReward": 3, "options": ["ta", "ti", "tou", "t"], "correctIndex": 2, "explanation": "\\u062a\\u064f = tou \\u2014 damma au-dessus \\u2192 son 'ou'."}, {"id": "m1l2_ex4", "type": "mcq", "skill_id": "harakat_reading", "prompt": "Quel signe repr\\u00e9sente la kasra ?", "promptAr": null, "xpReward": 3, "options": ["\\u064e", "\\u0650", "\\u064f", "\\u0652"], "correctIndex": 1, "explanation": "\\u0650 = kasra \\u2014 petit trait en dessous \\u2192 son 'i'."}, {"id": "m1l2_ex5", "type": "audio_choice", "skill_id": "harakat_reading", "prompt": "\\u00c9coutez et identifiez la syllabe", "audioUrl": "/assets/audio/syllables/mim_damma.mp3", "xpReward": 4, "options": ["\\u0645\\u064e", "\\u0645\\u0650", "\\u0645\\u064f", "\\u0645\\u0652"], "correctIndex": 2, "explanation": "\\u0645\\u064f = mu \\u2014 damma \\u2192 son 'ou'.", "prompts": ["\\u00c9coutez et identifiez la syllabe", "Quelle syllabe entendez-vous ?", "Reconnaissez la syllabe entendue", "Identifiez la syllabe apr\\u00e8s \\u00e9coute"]}, {"id": "m1l2_ex6", "type": "mcq", "skill_id": "harakat_reading", "prompt": "Comment se prononce \\u0645\\u0652 ?", "promptAr": "\\u0645\\u0652", "xpReward": 3, "options": ["ma", "mi", "mu", "m (sans voyelle)"], "correctIndex": 3, "explanation": "\\u0645\\u0652 = m \\u2014 suk\\u016bn \\u2192 consonne sans voyelle."}, {"id": "m1l2_ex7", "type": "audio_choice", "skill_id": "harakat_reading", "prompt": "\\u00c9coutez et identifiez la syllabe", "audioUrl": "/assets/audio/syllables/ta_kasra.mp3", "xpReward": 4, "options": ["\\u062a\\u064e", "\\u062a\\u0650", "\\u062a\\u064f", "\\u062a\\u0652"], "correctIndex": 1, "explanation": "\\u062a\\u0650 = ti \\u2014 kasra en dessous.", "prompts": ["\\u00c9coutez et identifiez la syllabe", "Quelle syllabe entendez-vous ?", "Reconnaissez la syllabe entendue", "Identifiez la syllabe apr\\u00e8s \\u00e9coute"]}, {"id": "m1l2_ex8", "type": "matching_text_audio", "skill_id": "harakat_reading", "prompt": "\\u00c9coute et trouve le son qui correspond \\u00e0 chaque syllabe", "xpReward": 7, "pairs": [{"text": "\\u0628\\u064e", "audioUrl": "/assets/audio/syllables/ba_fatha.mp3"}, {"text": "\\u0643\\u0650", "audioUrl": "/assets/audio/syllables/kaf_kasra.mp3"}, {"text": "\\u0645\\u064f", "audioUrl": "/assets/audio/syllables/mim_damma.mp3"}, {"text": "\\u062a\\u064e", "audioUrl": "/assets/audio/syllables/ta_fatha.mp3"}], "audioPool": ["/assets/audio/syllables/ba_fatha.mp3", "/assets/audio/syllables/ba_kasra.mp3", "/assets/audio/syllables/ba_damma.mp3", "/assets/audio/syllables/kaf_fatha.mp3", "/assets/audio/syllables/kaf_kasra.mp3", "/assets/audio/syllables/kaf_damma.mp3", "/assets/audio/syllables/ta_fatha.mp3", "/assets/audio/syllables/ta_kasra.mp3", "/assets/audio/syllables/mim_fatha.mp3", "/assets/audio/syllables/mim_damma.mp3", "/assets/audio/syllables/mim_kasra.mp3"]}]}
113	11	Voyelles longues — ا و ي	harakat	25	20	3	{"introduction": {"text": "\\u0627 \\u0648 \\u064a jouent le r\\u00f4le de voyelles longues. Elles allongent le son de la lettre qui les pr\\u00e9c\\u00e8de.", "signs": [{"ar": "\\u0628\\u064e\\u0627", "phoneme": "baa", "description": "Fatha + Alif \\u2192 son 'aa' long", "audio": "/assets/audio/syllables/ba_alif_long.mp3"}, {"ar": "\\u0628\\u064f\\u0648", "phoneme": "buu", "description": "Damma + Waw \\u2192 son 'uu' long", "audio": "/assets/audio/syllables/ba_waw_long.mp3"}, {"ar": "\\u0628\\u0650\\u064a", "phoneme": "bii", "description": "Kasra + Ya \\u2192 son 'ii' long", "audio": "/assets/audio/syllables/ba_ya_long.mp3"}, {"ar": "\\u0643\\u064e\\u0627", "phoneme": "kaa", "description": "Fatha + Alif \\u2192 son 'aa' long", "audio": "/assets/audio/syllables/kaf_alif_long.mp3"}, {"ar": "\\u0643\\u064f\\u0648", "phoneme": "kuu", "description": "Damma + Waw \\u2192 son 'uu' long", "audio": "/assets/audio/syllables/kaf_waw_long.mp3"}, {"ar": "\\u0643\\u0650\\u064a", "phoneme": "kii", "description": "Kasra + Ya \\u2192 son 'ii' long", "audio": "/assets/audio/syllables/kaf_ya_long.mp3"}, {"ar": "\\u062a\\u064e\\u0627", "phoneme": "taa", "description": "Fatha + Alif \\u2192 son 'aa' long", "audio": "/assets/audio/syllables/ta_alif_long.mp3"}, {"ar": "\\u062a\\u064f\\u0648", "phoneme": "tuu", "description": "Damma + Waw \\u2192 son 'uu' long", "audio": "/assets/audio/syllables/ta_waw_long.mp3"}, {"ar": "\\u062a\\u0650\\u064a", "phoneme": "tii", "description": "Kasra + Ya \\u2192 son 'ii' long", "audio": "/assets/audio/syllables/ta_ya_long.mp3"}, {"ar": "\\u0645\\u064e\\u0627", "phoneme": "maa", "description": "Fatha + Alif \\u2192 son 'aa' long", "audio": "/assets/audio/syllables/mim_alif_long.mp3"}, {"ar": "\\u0645\\u064f\\u0648", "phoneme": "muu", "description": "Damma + Waw \\u2192 son 'uu' long", "audio": "/assets/audio/syllables/mim_waw_long.mp3"}, {"ar": "\\u0645\\u0650\\u064a", "phoneme": "mii", "description": "Kasra + Ya \\u2192 son 'ii' long", "audio": "/assets/audio/syllables/mim_ya_long.mp3"}]}, "passing_score": 0.8, "exercises": [{"id": "m1l3_ex1", "type": "mcq", "skill_id": "long_vowels", "prompt": "Comment se prononce \\u0628\\u064e\\u0627 ?", "promptAr": "\\u0628\\u064e\\u0627", "xpReward": 4, "options": ["ba", "baa", "bi", "buu"], "correctIndex": 1, "explanation": "\\u0628\\u064e\\u0627 = baa \\u2014 fatha + alif = voyelle longue 'aa'."}, {"id": "m1l3_ex2", "type": "audio_choice", "skill_id": "long_vowels", "prompt": "\\u00c9coutez et identifiez", "audioUrl": "/assets/audio/syllables/ba_waw_long.mp3", "xpReward": 4, "options": ["\\u0628\\u064e\\u0627", "\\u0628\\u064f\\u0648", "\\u0628\\u0650\\u064a", "\\u0628\\u064e"], "correctIndex": 1, "explanation": "\\u0628\\u064f\\u0648 = buu \\u2014 damma + waw = 'uu' long.", "prompts": ["\\u00c9coutez et identifiez", "Quelle forme reconnaissez-vous ?", "Identifiez apr\\u00e8s \\u00e9coute"]}, {"id": "m1l3_ex3", "type": "mcq", "skill_id": "long_vowels", "prompt": "Quelle voyelle longue donne le son 'ii' ?", "promptAr": null, "xpReward": 3, "options": ["\\u0627", "\\u0648", "\\u064a", "\\u0628"], "correctIndex": 2, "explanation": "\\u064a apr\\u00e8s kasra = voyelle longue 'ii'."}, {"id": "m1l3_ex4", "type": "audio_choice", "skill_id": "long_vowels", "prompt": "\\u00c9coutez et identifiez", "audioUrl": "/assets/audio/syllables/kaf_alif_long.mp3", "xpReward": 4, "options": ["\\u0643\\u064e", "\\u0643\\u064e\\u0627", "\\u0643\\u064f\\u0648", "\\u0643\\u0650\\u064a"], "correctIndex": 1, "explanation": "\\u0643\\u064e\\u0627 = kaa \\u2014 fatha + alif.", "prompts": ["\\u00c9coutez et identifiez", "Quelle forme reconnaissez-vous ?", "Identifiez apr\\u00e8s \\u00e9coute"]}, {"id": "m1l3_ex5", "type": "mcq", "skill_id": "long_vowels", "prompt": "Comment se prononce \\u0643\\u064f\\u0648\\u0628\\u064c ?", "promptAr": "\\u0643\\u064f\\u0648\\u0628\\u064c", "xpReward": 5, "options": ["kabun", "kuubun", "kibun", "kaabun"], "correctIndex": 1, "explanation": "\\u0643\\u064f\\u0648\\u0628\\u064c = kuubun \\u2014 damma + waw = 'uu' long."}, {"id": "m1l3_ex6", "type": "mcq", "skill_id": "long_vowels", "prompt": "Quelle voyelle longue correspond \\u00e0 \\u0627 ?", "promptAr": null, "xpReward": 3, "options": ["ii", "uu", "aa", "a"], "correctIndex": 2, "explanation": "\\u0627 apr\\u00e8s fatha = voyelle longue 'aa'."}, {"id": "m1l3_ex7", "type": "matching_text_audio", "skill_id": "long_vowels", "prompt": "\\u00c9coute et trouve le son qui correspond \\u00e0 chaque voyelle longue", "xpReward": 7, "pairs": [{"text": "\\u0628\\u064e\\u0627", "audioUrl": "/assets/audio/syllables/ba_alif_long.mp3"}, {"text": "\\u0628\\u064f\\u0648", "audioUrl": "/assets/audio/syllables/ba_waw_long.mp3"}, {"text": "\\u0643\\u064e\\u0627", "audioUrl": "/assets/audio/syllables/kaf_alif_long.mp3"}, {"text": "\\u0643\\u0650\\u064a", "audioUrl": "/assets/audio/syllables/kaf_ya_long.mp3"}], "audioPool": ["/assets/audio/syllables/ba_alif_long.mp3", "/assets/audio/syllables/ba_waw_long.mp3", "/assets/audio/syllables/ba_ya_long.mp3", "/assets/audio/syllables/kaf_alif_long.mp3", "/assets/audio/syllables/kaf_waw_long.mp3", "/assets/audio/syllables/kaf_ya_long.mp3"]}]}
114	11	Tanwīn — la nunation	harakat	25	15	4	{"introduction": {"text": "Le tanw\\u012bn ajoute un son 'n' \\u00e0 la fin d'un mot. Il existe 3 formes. C'est le son 'un' dans \\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c.", "signs": [{"ar": "\\u0628\\u064b", "phoneme": "ban", "description": "Tanw\\u012bn fath \\u2192 son 'an'", "audio": "/assets/audio/syllables/ba_tanwin_fath.mp3"}, {"ar": "\\u0628\\u064d", "phoneme": "bin", "description": "Tanw\\u012bn kasr \\u2192 son 'in'", "audio": "/assets/audio/syllables/ba_tanwin_kasr.mp3"}, {"ar": "\\u0628\\u064c", "phoneme": "bun", "description": "Tanw\\u012bn damm \\u2192 son 'oun'", "audio": "/assets/audio/syllables/ba_tanwin_damm.mp3"}, {"ar": "\\u062a\\u064b", "phoneme": "tan", "description": "Tanw\\u012bn fath \\u2192 son 'an'", "audio": "/assets/audio/syllables/ta_tanwin_fath.mp3"}, {"ar": "\\u062a\\u064d", "phoneme": "tin", "description": "Tanw\\u012bn kasr \\u2192 son 'in'", "audio": "/assets/audio/syllables/ta_tanwin_kasr.mp3"}, {"ar": "\\u062a\\u064c", "phoneme": "tun", "description": "Tanw\\u012bn damm \\u2192 son 'oun'", "audio": "/assets/audio/syllables/ta_tanwin_damm.mp3"}, {"ar": "\\u0643\\u064b", "phoneme": "kan", "description": "Tanw\\u012bn fath \\u2192 son 'an'", "audio": "/assets/audio/syllables/kaf_tanwin_fath.mp3"}, {"ar": "\\u0643\\u064d", "phoneme": "kin", "description": "Tanw\\u012bn kasr \\u2192 son 'in'", "audio": "/assets/audio/syllables/kaf_tanwin_kasr.mp3"}, {"ar": "\\u0643\\u064c", "phoneme": "kun", "description": "Tanw\\u012bn damm \\u2192 son 'oun'", "audio": "/assets/audio/syllables/kaf_tanwin_damm.mp3"}, {"ar": "\\u0645\\u064b", "phoneme": "man", "description": "Tanw\\u012bn fath \\u2192 son 'an'", "audio": "/assets/audio/syllables/mim_tanwin_fath.mp3"}, {"ar": "\\u0645\\u064d", "phoneme": "min", "description": "Tanw\\u012bn kasr \\u2192 son 'in'", "audio": "/assets/audio/syllables/mim_tanwin_kasr.mp3"}, {"ar": "\\u0645\\u064c", "phoneme": "mun", "description": "Tanw\\u012bn damm \\u2192 son 'oun'", "audio": "/assets/audio/syllables/mim_tanwin_damm.mp3"}]}, "passing_score": 0.8, "exercises": [{"id": "m1l4_ex1", "type": "mcq", "skill_id": "tanwin", "prompt": "Comment se prononce \\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c \\u00e0 la fin ?", "promptAr": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "xpReward": 4, "options": ["maktaba", "maktabun", "maktabin", "maktab"], "correctIndex": 1, "explanation": "\\u064c = tanw\\u012bn damm \\u2192 son 'un' final."}, {"id": "m1l4_ex2", "type": "audio_choice", "skill_id": "tanwin", "prompt": "\\u00c9coutez et identifiez le tanw\\u012bn", "audioUrl": "/assets/audio/syllables/ba_tanwin_fath.mp3", "xpReward": 4, "options": ["\\u0628\\u064b", "\\u0628\\u064d", "\\u0628\\u064c", "\\u0628\\u064e"], "correctIndex": 0, "explanation": "\\u0628\\u064b = ban \\u2014 tanw\\u012bn fath \\u2192 'an'.", "prompts": ["\\u00c9coutez et identifiez le tanw\\u012bn", "Quel tanw\\u012bn entendez-vous ?", "Identifiez le signe de tanw\\u012bn"]}, {"id": "m1l4_ex3", "type": "mcq", "skill_id": "tanwin", "prompt": "Quel signe repr\\u00e9sente le tanw\\u012bn damm ?", "promptAr": null, "xpReward": 3, "options": ["\\u064b", "\\u064d", "\\u064c", "\\u0652"], "correctIndex": 2, "explanation": "\\u064c = tanw\\u012bn damm \\u2192 son 'oun'."}, {"id": "m1l4_ex4", "type": "mcq", "skill_id": "tanwin", "prompt": "Comment se prononce \\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c ?", "promptAr": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "xpReward": 4, "options": ["kitaba", "kitabin", "kitabun", "kitab"], "correctIndex": 2, "explanation": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c = kitaabun \\u2014 tanw\\u012bn damm \\u00e0 la fin."}, {"id": "m1l4_ex5", "type": "mcq", "skill_id": "tanwin", "prompt": "Combien de formes de tanw\\u012bn existe-t-il ?", "promptAr": null, "xpReward": 3, "options": ["1", "2", "3", "4"], "correctIndex": 2, "explanation": "3 formes : tanw\\u012bn fath (an), kasr (in), damm (un)."}, {"id": "m1l4_ex6", "type": "audio_choice", "skill_id": "tanwin", "prompt": "\\u00c9coutez et identifiez le tanw\\u012bn", "audioUrl": "/assets/audio/syllables/ba_tanwin_damm.mp3", "xpReward": 4, "options": ["\\u0628\\u064b", "\\u0628\\u064d", "\\u0628\\u064c", "\\u0628\\u064f"], "correctIndex": 2, "explanation": "\\u0628\\u064c = bun \\u2014 tanw\\u012bn damm.", "prompts": ["\\u00c9coutez et identifiez le tanw\\u012bn", "Quel tanw\\u012bn entendez-vous ?", "Identifiez le signe de tanw\\u012bn"]}, {"id": "m1l4_ex7", "type": "mcq", "skill_id": "tanwin", "prompt": "Identifiez la forme avec tanw\\u012bn kasr", "promptAr": null, "xpReward": 4, "options": ["\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064d", "\\u0628\\u064e\\u0627\\u0628\\u064b", "\\u062a\\u064e\\u0645\\u064e\\u0651"], "correctIndex": 1, "explanation": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064d = kitaabin \\u2014 tanw\\u012bn kasr (son 'in')."}, {"id": "m1l4_ex8", "type": "matching_text_audio", "skill_id": "tanwin", "prompt": "\\u00c9coute et trouve le son qui correspond \\u00e0 chaque tanw\\u012bn", "xpReward": 7, "pairs": [{"text": "\\u0628\\u064b", "audioUrl": "/assets/audio/syllables/ba_tanwin_fath.mp3"}, {"text": "\\u0628\\u064d", "audioUrl": "/assets/audio/syllables/ba_tanwin_kasr.mp3"}, {"text": "\\u0628\\u064c", "audioUrl": "/assets/audio/syllables/ba_tanwin_damm.mp3"}, {"text": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "audioUrl": "/assets/audio/words/maktab.mp3"}], "audioPool": ["/assets/audio/syllables/ba_tanwin_fath.mp3", "/assets/audio/syllables/ba_tanwin_kasr.mp3", "/assets/audio/syllables/ba_tanwin_damm.mp3", "/assets/audio/words/maktab.mp3", "/assets/audio/words/kitab.mp3", "/assets/audio/words/bab.mp3"]}]}
116	11	Premiers mots — lecture et compréhension	mots	30	25	6	{"introduction": {"text": "D\\u00e9couvrez les premiers mots construits avec \\u0645 \\u0643 \\u062a \\u0628 et les voyelles longues \\u0627 \\u0648 \\u064a. Cliquez sur chaque carte pour entendre la prononciation.", "words": [{"ar": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "phoneme": "maktabun", "translation": "Bureau", "type": "nom", "audio": "/assets/audio/words/maktab.mp3", "image": "/assets/images/words/maktab.jpg"}, {"ar": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "phoneme": "kitaabun", "translation": "Un livre", "type": "nom", "audio": "/assets/audio/words/kitab.mp3", "image": "/assets/images/words/kitab.jpg"}, {"ar": "\\u0628\\u064e\\u0627\\u0628\\u064c", "phoneme": "baabun", "translation": "Porte", "type": "nom", "audio": "/assets/audio/words/bab.mp3", "image": "/assets/images/words/bab.jpg"}, {"ar": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e", "phoneme": "kataba", "translation": "Il a \\u00e9crit", "type": "verbe", "audio": "/assets/audio/words/kataba.mp3", "image": "/assets/images/words/kataba.jpg"}, {"ar": "\\u0628\\u064e\\u064a\\u0652\\u062a\\u064c", "phoneme": "baytun", "translation": "Maison", "type": "nom", "audio": "/assets/audio/words/bayt.mp3", "image": "/assets/images/words/bayt.jpg"}, {"ar": "\\u0643\\u064f\\u0648\\u0628\\u064c", "phoneme": "kuubun", "translation": "Tasse", "type": "nom", "audio": "/assets/audio/words/kub.mp3", "image": "/assets/images/words/kub.jpg"}, {"ar": "\\u0628\\u064f\\u0648\\u0645\\u064e\\u0629\\u064c", "phoneme": "buumatun", "translation": "Hibou", "type": "nom", "audio": "/assets/audio/words/buma.mp3", "image": "/assets/images/words/buma.jpg"}, {"ar": "\\u0645\\u064e\\u0627\\u0645\\u064e\\u0627", "phoneme": "maama", "translation": "Maman", "type": "nom", "audio": "/assets/audio/words/mama.mp3", "image": "/assets/images/words/mama.jpg"}]}, "passing_score": 0.8, "exercises": [{"id": "m1l6_ex1", "type": "audio_choice", "skill_id": "word_reading", "prompt": "\\u00c9coutez et identifiez le mot", "audioUrl": "/assets/audio/words/kitab.mp3", "xpReward": 5, "options": ["\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "\\u0628\\u064e\\u0627\\u0628\\u064c", "\\u0643\\u064f\\u0648\\u0628\\u064c"], "correctIndex": 1, "explanation": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c = kitaabun = un livre."}, {"id": "m1l6_ex2", "type": "matching", "skill_id": "word_comprehension", "prompt": "Associez chaque mot arabe \\u00e0 sa traduction", "xpReward": 8, "pairs": [{"ar": "\\u0628\\u064e\\u0627\\u0628\\u064c", "fr": "Porte"}, {"ar": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "fr": "Un livre"}, {"ar": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "fr": "Bureau"}, {"ar": "\\u0628\\u064e\\u064a\\u0652\\u062a\\u064c", "fr": "Maison"}]}, {"id": "m1l6_ex3", "type": "mcq", "skill_id": "word_comprehension", "prompt": "Que signifie \\u0643\\u064e\\u062a\\u064e\\u0628\\u064e ?", "promptAr": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e", "xpReward": 4, "options": ["Un livre", "Biblioth\\u00e8que", "Il a \\u00e9crit", "\\u00c9crivain"], "correctIndex": 2, "explanation": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e = kataba = il a \\u00e9crit (verbe au pass\\u00e9)."}, {"id": "m1l6_ex4", "type": "audio_choice", "skill_id": "word_reading", "prompt": "\\u00c9coutez et identifiez le mot", "audioUrl": "/assets/audio/words/buma.mp3", "xpReward": 5, "options": ["\\u0643\\u064f\\u0648\\u0628\\u064c", "\\u0628\\u064e\\u0627\\u0628\\u064c", "\\u0628\\u064f\\u0648\\u0645\\u064e\\u0629\\u064c", "\\u0645\\u064e\\u0627\\u0645\\u064e\\u0627"], "correctIndex": 2, "explanation": "\\u0628\\u064f\\u0648\\u0645\\u064e\\u0629\\u064c = buumatun = hibou."}, {"id": "m1l6_ex5", "type": "mcq", "skill_id": "word_comprehension", "prompt": "Quel mot signifie 'Maison' ?", "promptAr": null, "xpReward": 4, "options": ["\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "\\u0628\\u064e\\u064a\\u0652\\u062a\\u064c", "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "\\u0628\\u064e\\u0627\\u0628\\u064c"], "correctIndex": 1, "explanation": "\\u0628\\u064e\\u064a\\u0652\\u062a\\u064c = baytun = maison."}, {"id": "m1l6_ex6", "type": "mcq", "skill_id": "word_comprehension", "prompt": "Quelle est la nature du mot \\u0643\\u064e\\u062a\\u064e\\u0628\\u064e ?", "promptAr": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e", "xpReward": 3, "options": ["Nom", "Verbe", "Adjectif", "Autre"], "correctIndex": 1, "explanation": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e est un verbe au pass\\u00e9 \\u2014 'il a \\u00e9crit'."}, {"id": "m1l6_ex_img1", "type": "matching_image_word", "skill_id": "word_comprehension", "prompt": "Associe chaque image au mot arabe correspondant", "xpReward": 8, "pairs": [{"image": "/assets/images/words/maktab.jpg", "ar": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c"}, {"image": "/assets/images/words/kitab.jpg", "ar": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c"}, {"image": "/assets/images/words/bab.jpg", "ar": "\\u0628\\u064e\\u0627\\u0628\\u064c"}, {"image": "/assets/images/words/bayt.jpg", "ar": "\\u0628\\u064e\\u064a\\u0652\\u062a\\u064c"}]}, {"id": "m1l6_ex_txa1", "type": "matching_text_audio", "skill_id": "word_reading", "prompt": "\\u00c9coute et trouve le son qui correspond \\u00e0 chaque mot \\u00e9crit", "xpReward": 8, "pairs": [{"text": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "audioUrl": "/assets/audio/words/maktab.mp3"}, {"text": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "audioUrl": "/assets/audio/words/kitab.mp3"}, {"text": "\\u0628\\u064e\\u0627\\u0628\\u064c", "audioUrl": "/assets/audio/words/bab.mp3"}, {"text": "\\u0628\\u064e\\u064a\\u0652\\u062a\\u064c", "audioUrl": "/assets/audio/words/bayt.mp3"}], "audioPool": ["/assets/audio/words/maktab.mp3", "/assets/audio/words/kitab.mp3", "/assets/audio/words/bab.mp3", "/assets/audio/words/bayt.mp3", "/assets/audio/words/kub.mp3", "/assets/audio/words/buma.mp3", "/assets/audio/words/mama.mp3", "/assets/audio/words/kataba.mp3"]}]}
117	11	Vocabulaire élargi — noms, verbes, adjectifs	mots	30	25	7	{"introduction": {"text": "D\\u00e9couvrez plus de mots. Notez leur nature : nom (\\u0627\\u0633\\u0645), verbe (\\u0641\\u0639\\u0644). Cliquez pour entendre.", "words": [{"ar": "\\u0643\\u064f\\u062a\\u064f\\u0628\\u064c", "phoneme": "kutubun", "translation": "Des livres", "type": "nom", "audio": "/assets/audio/words/kutub.mp3", "image": "/assets/images/words/kutub.jpg"}, {"ar": "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "phoneme": "kaatibun", "translation": "\\u00c9crivain", "type": "nom", "audio": "/assets/audio/words/katib.mp3", "image": "/assets/images/words/katib.jpg"}, {"ar": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064e\\u0629\\u064c", "phoneme": "maktabatun", "translation": "Biblioth\\u00e8que", "type": "nom", "audio": "/assets/audio/words/maktaba.mp3", "image": "/assets/images/words/maktaba.jpg"}, {"ar": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064e\\u0629\\u064c", "phoneme": "kitaabatun", "translation": "\\u00c9criture", "type": "nom", "audio": "/assets/audio/words/kitaba_nom.mp3", "image": "/assets/images/words/kitaba_nom.jpg"}, {"ar": "\\u0628\\u064e\\u0627\\u0628\\u064e\\u0627", "phoneme": "baaba", "translation": "Papa", "type": "nom", "audio": "/assets/audio/words/baba.mp3", "image": "/assets/images/words/baba.jpg"}, {"ar": "\\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "phoneme": "katkuutun", "translation": "Poussin", "type": "nom", "audio": "/assets/audio/words/katkut.mp3", "image": "/assets/images/words/katkut.jpg"}, {"ar": "\\u0645\\u064e\\u0627\\u062a\\u064e", "phoneme": "maata", "translation": "Il est mort", "type": "verbe", "audio": "/assets/audio/words/mata.mp3", "image": "/assets/images/words/mata.jpg"}, {"ar": "\\u0628\\u064e\\u0627\\u062a\\u064e", "phoneme": "baata", "translation": "Il a pass\\u00e9 la nuit", "type": "verbe", "audio": "/assets/audio/words/bata.mp3", "image": "/assets/images/words/bata.jpg"}, {"ar": "\\u062a\\u064e\\u0645\\u064e\\u0651", "phoneme": "tamma", "translation": "Il a \\u00e9t\\u00e9 achev\\u00e9", "type": "verbe", "audio": "/assets/audio/words/tamma.mp3", "image": "/assets/images/words/tamma.jpg"}, {"ar": "\\u0643\\u064e\\u062a\\u064e\\u0645\\u064e", "phoneme": "katama", "translation": "Il a cach\\u00e9", "type": "verbe", "audio": "/assets/audio/words/katam.mp3", "image": "/assets/images/words/katam.jpg"}, {"ar": "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652", "phoneme": "bakat", "translation": "Elle a pleur\\u00e9", "type": "verbe", "audio": "/assets/audio/words/bakat.mp3", "image": "/assets/images/words/bakat.jpg"}]}, "passing_score": 0.8, "exercises": [{"id": "m1l7_ex1", "type": "mcq", "skill_id": "word_comprehension", "prompt": "Que signifie \\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064e\\u0629\\u064c ?", "promptAr": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064e\\u0629\\u064c", "xpReward": 4, "options": ["Bureau", "Livre", "Biblioth\\u00e8que", "\\u00c9criture"], "correctIndex": 2, "explanation": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064e\\u0629\\u064c = maktabatun = biblioth\\u00e8que."}, {"id": "m1l7_ex2", "type": "matching", "skill_id": "word_comprehension", "prompt": "Associez les mots \\u00e0 leurs traductions", "xpReward": 8, "pairs": [{"ar": "\\u0645\\u064e\\u0627\\u062a\\u064e", "fr": "Il est mort"}, {"ar": "\\u0628\\u064e\\u0627\\u062a\\u064e", "fr": "Il a pass\\u00e9 la nuit"}, {"ar": "\\u062a\\u064e\\u0645\\u064e\\u0651", "fr": "Il a \\u00e9t\\u00e9 achev\\u00e9"}, {"ar": "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652", "fr": "Elle a pleur\\u00e9"}]}, {"id": "m1l7_ex3", "type": "mcq", "skill_id": "word_comprehension", "prompt": "Quelle est la nature du mot \\u0643\\u0627\\u062a\\u0650\\u0628\\u064c ?", "promptAr": "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "xpReward": 3, "options": ["Verbe", "Nom", "Adjectif", "Autre"], "correctIndex": 1, "explanation": "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c = kaatibun = \\u00e9crivain \\u2014 c'est un nom."}, {"id": "m1l7_ex4", "type": "audio_choice", "skill_id": "word_reading", "prompt": "\\u00c9coutez et identifiez le mot", "audioUrl": "/assets/audio/words/katkut.mp3", "xpReward": 5, "options": ["\\u0643\\u064f\\u062a\\u064f\\u0628\\u064c", "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "\\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064e\\u0629\\u064c"], "correctIndex": 2, "explanation": "\\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c = katkuutun = poussin."}, {"id": "m1l7_ex5", "type": "mcq", "skill_id": "word_comprehension", "prompt": "Quel mot signifie 'Il a cach\\u00e9' ?", "promptAr": null, "xpReward": 4, "options": ["\\u0645\\u064e\\u0627\\u062a\\u064e", "\\u0628\\u064e\\u0627\\u062a\\u064e", "\\u0643\\u064e\\u062a\\u064e\\u0645\\u064e", "\\u062a\\u064e\\u0645\\u064e\\u0651"], "correctIndex": 2, "explanation": "\\u0643\\u064e\\u062a\\u064e\\u0645\\u064e = katama = il a cach\\u00e9."}, {"id": "m1l7_ex6", "type": "mcq", "skill_id": "word_comprehension", "prompt": "Parmi ces mots, lequel est un verbe ?", "promptAr": null, "xpReward": 3, "options": ["\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "\\u0628\\u064e\\u0627\\u062a\\u064e", "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064e\\u0629\\u064c"], "correctIndex": 2, "explanation": "\\u0628\\u064e\\u0627\\u062a\\u064e = baata = il a pass\\u00e9 la nuit \\u2014 c'est un verbe."}, {"id": "m1l7_ex_img1", "type": "matching_image_word", "skill_id": "word_comprehension", "prompt": "Associe chaque image au mot arabe correspondant", "xpReward": 8, "pairs": [{"image": "/assets/images/words/katib.jpg", "ar": "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c"}, {"image": "/assets/images/words/maktaba.jpg", "ar": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064e\\u0629\\u064c"}, {"image": "/assets/images/words/baba.jpg", "ar": "\\u0628\\u064e\\u0627\\u0628\\u064e\\u0627"}, {"image": "/assets/images/words/katkut.jpg", "ar": "\\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c"}]}, {"id": "m1l7_ex_txa1", "type": "matching_text_audio", "skill_id": "word_reading", "prompt": "\\u00c9coute et trouve le son qui correspond \\u00e0 chaque mot \\u00e9crit", "xpReward": 8, "pairs": [{"text": "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "audioUrl": "/assets/audio/words/katib.mp3"}, {"text": "\\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "audioUrl": "/assets/audio/words/katkut.mp3"}, {"text": "\\u0645\\u064e\\u0627\\u062a\\u064e", "audioUrl": "/assets/audio/words/mata.mp3"}, {"text": "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652", "audioUrl": "/assets/audio/words/bakat.mp3"}], "audioPool": ["/assets/audio/words/katib.mp3", "/assets/audio/words/katkut.mp3", "/assets/audio/words/mata.mp3", "/assets/audio/words/bakat.mp3", "/assets/audio/words/bata.mp3", "/assets/audio/words/tamma.mp3", "/assets/audio/words/katam.mp3", "/assets/audio/words/maktaba.mp3"]}]}
118	11	Écriture — clavier et tracé	ecriture_clavier	30	25	8	{"introduction": {"text": "Entra\\u00eenez-vous \\u00e0 \\u00e9crire les lettres et mots en arabe. Activez le clavier arabe sur votre appareil (Windows : Alt+Shift)."}, "passing_score": 0.8, "exercises": [{"id": "m1l8_ex1", "type": "input_text", "skill_id": "word_writing", "prompt": "\\u00c9crivez la lettre Mim", "xpReward": 3, "acceptedAnswers": ["\\u0645"], "explanation": "\\u0645 = Mim."}, {"id": "m1l8_ex2", "type": "input_text", "skill_id": "word_writing", "prompt": "\\u00c9crivez la lettre Kaf", "xpReward": 3, "acceptedAnswers": ["\\u0643"], "explanation": "\\u0643 = Kaf."}, {"id": "m1l8_ex3", "type": "input_text", "skill_id": "word_writing", "prompt": "\\u00c9crivez le mot 'bureau' en arabe (sans voyelles)", "xpReward": 6, "acceptedAnswers": ["\\u0645\\u0643\\u062a\\u0628", "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "\\u0645\\u0643\\u062a\\u0628\\u064c"], "explanation": "\\u0645\\u0643\\u062a\\u0628 = maktab = bureau."}, {"id": "m1l8_ex4", "type": "input_text", "skill_id": "word_writing", "prompt": "\\u00c9crivez le mot 'livre' en arabe (sans voyelles)", "xpReward": 6, "acceptedAnswers": ["\\u0643\\u062a\\u0627\\u0628", "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "\\u0643\\u062a\\u0627\\u0628\\u064c"], "explanation": "\\u0643\\u062a\\u0627\\u0628 = kitaab = livre."}, {"id": "m1l8_ex5", "type": "input_text", "skill_id": "word_writing", "prompt": "\\u00c9crivez le mot 'porte' en arabe", "xpReward": 5, "acceptedAnswers": ["\\u0628\\u0627\\u0628", "\\u0628\\u064e\\u0627\\u0628\\u064c", "\\u0628\\u0627\\u0628\\u064c"], "explanation": "\\u0628\\u0627\\u0628 = baab = porte."}, {"id": "m1l8_ex6", "type": "drawing", "skill_id": "word_writing", "prompt": "Tracez la lettre \\u0628 (Ba) isol\\u00e9e", "promptAr": "\\u0628", "xpReward": 5, "letter": "\\u0628", "strokes": 2, "hint": "La coque horizontale puis le point en dessous."}, {"id": "m1l8_ex7", "type": "drawing", "skill_id": "word_writing", "prompt": "Tracez la lettre \\u0645 (Mim) isol\\u00e9e", "promptAr": "\\u0645", "xpReward": 5, "letter": "\\u0645", "strokes": 1, "hint": "Cercle puis queue vers le bas."}, {"id": "m1l8_ex8", "type": "input_text", "skill_id": "word_writing", "prompt": "\\u00c9crivez 'il a \\u00e9crit' en arabe", "xpReward": 6, "acceptedAnswers": ["\\u0643\\u062a\\u0628", "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e", "\\u0643\\u062a\\u0628\\u064e"], "explanation": "\\u0643\\u062a\\u0628 = kataba = il a \\u00e9crit."}]}
119	11	Construire des mots — drag & drop	exercices	30	20	9	{"passing_score": 0.8, "exercises": [{"id": "m1l9_ex1", "type": "drag_drop", "skill_id": "word_building", "prompt": "Assemblez les lettres pour former le mot 'bureau'", "letters": ["\\u0645\\u0640", "\\u0640\\u0643\\u0640", "\\u0640\\u062a\\u0640", "\\u0640\\u0628"], "correctWord": "\\u0645\\u0643\\u062a\\u0628", "targetLength": 4, "xpReward": 8, "explanation": "\\u0645\\u0643\\u062a\\u0628 = \\u0645 + \\u0643 + \\u062a + \\u0628 = bureau.", "audioUrl": "/assets/audio/words/maktab.mp3"}, {"id": "m1l9_ex2", "type": "drag_drop", "skill_id": "word_building", "prompt": "Assemblez les lettres pour former 'livre'", "letters": ["\\u0643\\u0640", "\\u0640\\u062a\\u0640", "\\u0640\\u0627", "\\u0640\\u0628"], "correctWord": "\\u0643\\u062a\\u0627\\u0628", "targetLength": 4, "xpReward": 8, "explanation": "\\u0643\\u062a\\u0627\\u0628 = \\u0643 + \\u062a + \\u0627 + \\u0628 = livre.", "audioUrl": "/assets/audio/words/kitab.mp3"}, {"id": "m1l9_ex3", "type": "mcq", "skill_id": "word_building", "prompt": "Quelle lettre manque pour compl\\u00e9ter ce mot ?", "promptAr": "\\u0643\\u0650\\u25a1\\u064e\\u0627\\u0628\\u064c", "xpReward": 6, "options": ["\\u0640\\u062a\\u0640 (m\\u00e9diane)", "\\u0640\\u0628\\u0640 (m\\u00e9diane)", "\\u0640\\u0645\\u0640 (m\\u00e9diane)", "\\u0640\\u0643\\u0640 (m\\u00e9diane)"], "correctIndex": 0, "explanation": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c = livre. La lettre \\u062a est au milieu \\u2192 forme m\\u00e9diane \\u0640\\u062a\\u0640.", "prompts": ["Quelle lettre manque pour compl\\u00e9ter ce mot ?", "Compl\\u00e9tez le mot \\u2014 quelle lettre manque ?", "Trouvez la lettre manquante"]}, {"id": "m1l9_ex4", "type": "mcq", "skill_id": "word_building", "prompt": "Quelle lettre manque pour compl\\u00e9ter ce mot ?", "promptAr": "\\u0645\\u064e\\u0643\\u0652\\u25a1\\u064e\\u0628\\u064c", "xpReward": 6, "options": ["\\u0640\\u0628\\u0640 (m\\u00e9diane)", "\\u0640\\u062a\\u0640 (m\\u00e9diane)", "\\u0640\\u0645\\u0640 (m\\u00e9diane)", "\\u0640\\u0643\\u0640 (m\\u00e9diane)"], "correctIndex": 1, "explanation": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c = bureau. La lettre \\u062a est au milieu \\u2192 forme m\\u00e9diane \\u0640\\u062a\\u0640.", "prompts": ["Quelle lettre manque pour compl\\u00e9ter ce mot ?", "Compl\\u00e9tez le mot \\u2014 quelle lettre manque ?", "Trouvez la lettre manquante"]}, {"id": "m1l9_ex5", "type": "drag_drop", "skill_id": "word_building", "prompt": "Assemblez les lettres pour former 'maison'", "letters": ["\\u0628\\u0640", "\\u0640\\u064a\\u0640", "\\u0640\\u062a"], "correctWord": "\\u0628\\u064a\\u062a", "targetLength": 3, "xpReward": 7, "explanation": "\\u0628\\u064a\\u062a = \\u0628 + \\u064a + \\u062a = maison.", "audioUrl": "/assets/audio/words/bayt.mp3"}, {"id": "m1l9_ex6", "type": "mcq", "skill_id": "word_building", "prompt": "Dans \\u0628\\u064e\\u0627\\u0628\\u064c, quelle est la forme du second \\u0628 (en fin de mot) ?", "promptAr": "\\u0628\\u064e\\u0627\\u0628\\u064c", "xpReward": 5, "options": ["\\u0628\\u0640 (initiale)", "\\u0640\\u0628\\u0640 (m\\u00e9diane)", "\\u0640\\u0628 (finale)", "\\u0628 (isol\\u00e9e)"], "correctIndex": 2, "explanation": "Le second \\u0628 dans \\u0628\\u064e\\u0627\\u0628\\u064c est en position finale \\u2014 forme \\u0640\\u0628."}]}
120	11	Phrases simples — lire et comprendre	lecture_phrase	35	25	10	{"introduction": {"text": "Lisez ces phrases construites avec les mots du module. Cliquez pour entendre la lecture.", "words": [{"ar": "\\u0645\\u064e\\u0627\\u062a\\u064e \\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "phoneme": "maata katkuutun", "translation": "Un poussin est mort", "type": "phrase", "audio": "/assets/audio/phrases/mata_katkut.mp3"}, {"ar": "\\u0628\\u064e\\u0627\\u062a\\u064e \\u0628\\u064f\\u0648\\u0628\\u0650\\u064a \\u0628\\u0650\\u0628\\u064e\\u0627\\u0628\\u0650\\u064a", "phoneme": "baata buubi bibaabi", "translation": "Bobi a pass\\u00e9 la nuit \\u00e0 ma porte", "type": "phrase", "audio": "/assets/audio/phrases/bata_bubi.mp3"}, {"ar": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e \\u0643\\u0627\\u062a\\u0650\\u0628\\u064c \\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u0627\\u064b", "phoneme": "kataba kaatibun", "translation": "Un \\u00e9crivain a \\u00e9crit un livre", "type": "phrase", "audio": "/assets/audio/phrases/kataba_katib.mp3"}, {"ar": "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652 \\u0645\\u064e\\u0627\\u0645\\u064e\\u0627", "phoneme": "bakat maama", "translation": "Maman a pleur\\u00e9", "type": "phrase", "audio": "/assets/audio/phrases/bakat_mama.mp3"}]}, "passing_score": 0.8, "exercises": [{"id": "m1l10_ex1", "type": "audio_choice", "skill_id": "sentence_reading", "prompt": "\\u00c9coutez et identifiez la phrase", "audioUrl": "/assets/audio/phrases/bakat_mama.mp3", "xpReward": 6, "options": ["\\u0645\\u064e\\u0627\\u062a\\u064e \\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652 \\u0645\\u064e\\u0627\\u0645\\u064e\\u0627", "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e \\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "\\u0628\\u064e\\u0627\\u062a\\u064e \\u0628\\u064f\\u0648\\u0628\\u0650\\u064a"], "correctIndex": 1, "explanation": "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652 \\u0645\\u064e\\u0627\\u0645\\u064e\\u0627 = bakat maama = Maman a pleur\\u00e9."}, {"id": "m1l10_ex2", "type": "mcq", "skill_id": "sentence_reading", "prompt": "Que signifie \\u0645\\u064e\\u0627\\u062a\\u064e \\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c ?", "promptAr": "\\u0645\\u064e\\u0627\\u062a\\u064e \\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "xpReward": 5, "options": ["Un poussin a pleur\\u00e9", "Un poussin est mort", "Un poussin a \\u00e9crit", "Un poussin est n\\u00e9"], "correctIndex": 1, "explanation": "\\u0645\\u064e\\u0627\\u062a\\u064e = il est mort, \\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c = poussin."}, {"id": "m1l10_ex3", "type": "word_order", "skill_id": "sentence_reading", "prompt": "Remettez les mots dans l'ordre pour former la phrase : 'Maman a pleur\\u00e9'", "words": ["\\u0645\\u064e\\u0627\\u0645\\u064e\\u0627", "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652"], "correctSentence": "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652 \\u0645\\u064e\\u0627\\u0645\\u064e\\u0627", "audioUrl": "/assets/audio/phrases/bakat_mama.mp3", "xpReward": 7, "explanation": "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652 \\u0645\\u064e\\u0627\\u0645\\u064e\\u0627 \\u2014 le verbe vient avant le nom en arabe."}, {"id": "m1l10_ex4", "type": "word_order", "skill_id": "sentence_reading", "prompt": "Remettez les mots dans l'ordre : 'Un poussin est mort'", "words": ["\\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "\\u0645\\u064e\\u0627\\u062a\\u064e"], "correctSentence": "\\u0645\\u064e\\u0627\\u062a\\u064e \\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "audioUrl": "/assets/audio/phrases/mata_katkut.mp3", "xpReward": 7, "explanation": "\\u0645\\u064e\\u0627\\u062a\\u064e \\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c \\u2014 verbe + sujet."}, {"id": "m1l10_ex5", "type": "mcq", "skill_id": "sentence_reading", "prompt": "Quel mot manque dans cette phrase ?", "promptAr": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e ___ \\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u0627\\u064b", "xpReward": 6, "options": ["\\u0645\\u064e\\u0627\\u0645\\u064e\\u0627", "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "\\u0628\\u064e\\u0627\\u0628\\u064c", "\\u0628\\u064e\\u064a\\u0652\\u062a\\u064c"], "correctIndex": 1, "explanation": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e \\u0643\\u0627\\u062a\\u0650\\u0628\\u064c \\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u0627\\u064b = un \\u00e9crivain a \\u00e9crit un livre.", "prompts": ["Quel mot manque dans cette phrase ?", "Compl\\u00e9tez la phrase", "Trouvez le mot manquant"]}, {"id": "m1l10_ex6", "type": "matching", "skill_id": "sentence_reading", "prompt": "Associez chaque phrase \\u00e0 sa traduction", "xpReward": 8, "pairs": [{"ar": "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652 \\u0645\\u064e\\u0627\\u0645\\u064e\\u0627", "fr": "Maman a pleur\\u00e9"}, {"ar": "\\u0645\\u064e\\u0627\\u062a\\u064e \\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "fr": "Un poussin est mort"}]}, {"id": "m1l10_ex_txa1", "type": "matching_text_audio", "skill_id": "sentence_reading", "prompt": "\\u00c9coute et trouve le son qui correspond \\u00e0 chaque phrase", "xpReward": 9, "pairs": [{"text": "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652 \\u0645\\u064e\\u0627\\u0645\\u064e\\u0627", "audioUrl": "/assets/audio/phrases/bakat_mama.mp3"}, {"text": "\\u0645\\u064e\\u0627\\u062a\\u064e \\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "audioUrl": "/assets/audio/phrases/mata_katkut.mp3"}, {"text": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e \\u0643\\u0627\\u062a\\u0650\\u0628\\u064c \\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u0627\\u064b", "audioUrl": "/assets/audio/phrases/kataba_katib.mp3"}, {"text": "\\u0628\\u064e\\u0627\\u062a\\u064e \\u0628\\u064f\\u0648\\u0628\\u0650\\u064a \\u0628\\u0650\\u0628\\u064e\\u0627\\u0628\\u0650\\u064a", "audioUrl": "/assets/audio/phrases/bata_bubi.mp3"}], "audioPool": ["/assets/audio/phrases/bakat_mama.mp3", "/assets/audio/phrases/mata_katkut.mp3", "/assets/audio/phrases/kataba_katib.mp3", "/assets/audio/phrases/bata_bubi.mp3"]}]}
121	11	Évaluation globale du Module 1	evaluation	60	30	11	{"description": "\\u00c9valuation finale du Module 1. Le syst\\u00e8me choisit les exercices selon votre profil.", "passing_score": 0.7, "exercises": [{"id": "m1l11_ex1", "type": "mcq", "skill_id": "letter_recognition", "prompt": "Identifiez la lettre", "promptAr": "\\u0643", "xpReward": 3, "options": ["Ba", "Mim", "Kaf", "Ta"], "correctIndex": 2, "explanation": "\\u0643 = Kaf."}, {"id": "m1l11_ex2", "type": "audio_choice", "skill_id": "harakat_reading", "prompt": "\\u00c9coutez et identifiez", "audioUrl": "/assets/audio/syllables/mim_fatha.mp3", "xpReward": 4, "options": ["\\u0645\\u064e", "\\u0645\\u0650", "\\u0645\\u064f", "\\u0645\\u0652"], "correctIndex": 0, "explanation": "\\u0645\\u064e = ma \\u2014 fatha."}, {"id": "m1l11_ex3", "type": "mcq", "skill_id": "long_vowels", "prompt": "Comment se prononce \\u0643\\u064f\\u0648\\u0628\\u064c ?", "promptAr": "\\u0643\\u064f\\u0648\\u0628\\u064c", "xpReward": 4, "options": ["kabun", "kuubun", "kibun", "kaabun"], "correctIndex": 1, "explanation": "\\u0643\\u064f\\u0648\\u0628\\u064c = kuubun."}, {"id": "m1l11_ex4", "type": "mcq", "skill_id": "tanwin", "prompt": "Que signifie \\u064c \\u00e0 la fin d'un mot ?", "promptAr": "\\u0628\\u064c", "xpReward": 4, "options": ["son 'a'", "son 'in'", "son 'oun'", "pas de son"], "correctIndex": 2, "explanation": "\\u064c = tanw\\u012bn damm \\u2192 son 'oun'."}, {"id": "m1l11_ex5", "type": "mcq", "skill_id": "letter_positions", "prompt": "Position de \\u0628 dans \\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "promptAr": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "xpReward": 5, "options": ["Initiale", "M\\u00e9diane", "Finale", "Isol\\u00e9e"], "correctIndex": 2, "explanation": "\\u0628 est \\u00e0 la fin \\u2014 forme finale \\u0640\\u0628."}, {"id": "m1l11_ex6", "type": "audio_choice", "skill_id": "word_reading", "prompt": "\\u00c9coutez et identifiez le mot", "audioUrl": "/assets/audio/words/bayt.mp3", "xpReward": 5, "options": ["\\u0628\\u064e\\u0627\\u0628\\u064c", "\\u0628\\u064e\\u064a\\u0652\\u062a\\u064c", "\\u0628\\u064f\\u0648\\u0645\\u064e\\u0629\\u064c", "\\u0628\\u064e\\u0627\\u0628\\u064e\\u0627"], "correctIndex": 1, "explanation": "\\u0628\\u064e\\u064a\\u0652\\u062a\\u064c = baytun = maison."}, {"id": "m1l11_ex7", "type": "matching", "skill_id": "word_comprehension", "prompt": "Associez les mots \\u00e0 leurs traductions", "xpReward": 8, "pairs": [{"ar": "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "fr": "\\u00c9crivain"}, {"ar": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064e\\u0629\\u064c", "fr": "Biblioth\\u00e8que"}, {"ar": "\\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "fr": "Poussin"}]}, {"id": "m1l11_ex8", "type": "input_text", "skill_id": "word_writing", "prompt": "\\u00c9crivez 'biblioth\\u00e8que' en arabe", "xpReward": 6, "acceptedAnswers": ["\\u0645\\u0643\\u062a\\u0628\\u0629", "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064e\\u0629\\u064c", "\\u0645\\u0643\\u062a\\u0628\\u0629\\u064c"], "explanation": "\\u0645\\u0643\\u062a\\u0628\\u0629 = maktabatun = biblioth\\u00e8que."}, {"id": "m1l11_ex9", "type": "word_order", "skill_id": "sentence_reading", "prompt": "Remettez dans l'ordre : 'Un \\u00e9crivain a \\u00e9crit un livre'", "words": ["\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u0627\\u064b", "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e"], "correctSentence": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e \\u0643\\u0627\\u062a\\u0650\\u0628\\u064c \\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u0627\\u064b", "audioUrl": "/assets/audio/phrases/kataba_katib.mp3", "xpReward": 8, "explanation": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e \\u0643\\u0627\\u062a\\u0650\\u0628\\u064c \\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u0627\\u064b \\u2014 verbe + sujet + objet."}, {"id": "m1l11_ex10", "type": "drag_drop", "skill_id": "word_building", "prompt": "Assemblez les lettres pour former 'poussin'", "letters": ["\\u0643\\u0640", "\\u0640\\u062a\\u0640", "\\u0640\\u0643\\u064f\\u0648", "\\u0640\\u062a"], "correctWord": "\\u0643\\u062a\\u0643\\u0648\\u062a", "targetLength": 4, "xpReward": 7, "explanation": "\\u0643\\u062a\\u0643\\u0648\\u062a = katkuut = poussin.", "audioUrl": "/assets/audio/words/katkut.mp3"}, {"id": "m1l11_ex11", "type": "matching_text_audio", "skill_id": "word_reading", "prompt": "\\u00c9coute et trouve le son qui correspond \\u00e0 chaque mot", "xpReward": 8, "pairs": [{"text": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "audioUrl": "/assets/audio/words/maktab.mp3"}, {"text": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "audioUrl": "/assets/audio/words/kitab.mp3"}, {"text": "\\u0628\\u064e\\u064a\\u0652\\u062a\\u064c", "audioUrl": "/assets/audio/words/bayt.mp3"}, {"text": "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "audioUrl": "/assets/audio/words/katib.mp3"}], "audioPool": ["/assets/audio/words/maktab.mp3", "/assets/audio/words/kitab.mp3", "/assets/audio/words/bayt.mp3", "/assets/audio/words/katib.mp3", "/assets/audio/words/bab.mp3", "/assets/audio/words/katkut.mp3", "/assets/audio/words/buma.mp3", "/assets/audio/words/mama.mp3"]}]}
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.modules (id, slug, title, description, arabic_ratio, sort_order, is_premium, part_id) FROM stdin;
1	maktab	Module 1 — مَكْتَبٌ	...	0.3	1	f	1
\.


--
-- Data for Name: parts; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.parts (id, number, title, description, degree, sort_order, is_premium, color, icon) FROM stdin;
1	1	Partie 1 — Les fondations	Découverte de l'alphabet arabe, des voyelles et des premiers mots. Les 4 lettres de base : م ك ت ب	1	1	f	#6C3FC5	🌱
2	2	Partie 2 — L'alphabet complet	Toutes les lettres de l'alphabet arabe, leurs positions et leurs formes.	2	2	f	#F07C1E	📖
3	3	Partie 3 — La lecture courante	Lecture de textes courts, phrases complexes et vocabulaire élargi.	3	3	t	#2BA84A	📝
4	4	Partie 4 — La grammaire	Bases de la grammaire arabe : genre, nombre, cas grammaticaux.	4	4	t	#1976D2	🎯
5	5	Partie 5 — L'expression	Expression orale et écrite, conjugaison, phrases complexes.	5	5	t	#9C27B0	💬
6	6	Partie 6 — La maîtrise	Textes littéraires, coraniques et journalistiques. Niveau avancé.	6	6	t	#F9A825	🏆
\.


--
-- Data for Name: user_badges; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.user_badges (user_id, badge_id, earned_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.users (id, email, username, hashed_password, native_language, avatar_url, xp, level, streak, longest_streak, last_activity_date, is_premium, is_admin, is_active, is_verified, created_at, updated_at, role, permissions) FROM stdin;
e5c15073-a411-4386-a73a-fb553d9c8cca	admin@arabiq.com	admin	$2b$12$MP6WRUIBmTMx6xEjOVE5keBABHb61AY9gkIoErHISrfWvewnRYx1S	fr	\N	841	9	0	0	\N	f	t	t	t	2026-04-19 23:29:59.671268+02	2026-04-26 21:34:56.832625+02	admin	[]
d8cc2381-e41b-42bf-bfd7-910a78d97dbd	superadmin@arabiq.com	superadmin	$2b$12$rZHQ256AKWggMfeTuegxS.6iDrkdgc7LTyr3yGGZ6ihvA0xedWuzK	fr	\N	0	1	0	0	\N	f	t	t	t	2026-04-21 11:45:05.31686+02	2026-04-21 11:45:05.31686+02	superadmin	[]
040041cc-fd61-4a48-8486-81d41d500299	gaziz60@hotmail.com	Aziz	$2b$12$nmtABCcMbAdQcqouv0aPeOVEKgCwbddAf6YhzYQyfinQqg9tLPK/G	fr	\N	152	1	0	0	\N	f	f	t	f	2026-04-21 13:31:28.762902+02	2026-04-22 18:21:12.903886+02	student	[]
2802ac9e-bc25-4edf-9a0b-5f510c5005e3	aziz60@hotmail.com	Nizar	$2b$12$yjTPdSS5fAlzhyfnxRjmpeBLFBtZpFMBqrmrBEYUty2MK81dSK2NO	fr	\N	100	2	0	0	\N	f	f	t	f	2026-04-23 13:04:24.614557+02	2026-04-24 16:40:20.071055+02	student	[]
\.


--
-- Name: admin_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: arabiq
--

SELECT pg_catalog.setval('public.admin_roles_id_seq', 1, false);


--
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: arabiq
--

SELECT pg_catalog.setval('public.courses_id_seq', 11, true);


--
-- Name: lessons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: arabiq
--

SELECT pg_catalog.setval('public.lessons_id_seq', 121, true);


--
-- Name: modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: arabiq
--

SELECT pg_catalog.setval('public.modules_id_seq', 1, false);


--
-- Name: parts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: arabiq
--

SELECT pg_catalog.setval('public.parts_id_seq', 6, true);


--
-- Name: admin_audit_log admin_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);


--
-- Name: admin_roles admin_roles_name_key; Type: CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT admin_roles_name_key UNIQUE (name);


--
-- Name: admin_roles admin_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT admin_roles_pkey PRIMARY KEY (id);


--
-- Name: admin_sessions admin_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_pkey PRIMARY KEY (id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);


--
-- Name: certifications certifications_certificate_number_key; Type: CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_certificate_number_key UNIQUE (certificate_number);


--
-- Name: certifications certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: exercise_log exercise_log_pkey; Type: CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.exercise_log
    ADD CONSTRAINT exercise_log_pkey PRIMARY KEY (id);


--
-- Name: lesson_progress lesson_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: modules modules_slug_key; Type: CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_slug_key UNIQUE (slug);


--
-- Name: parts parts_pkey; Type: CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.parts
    ADD CONSTRAINT parts_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (user_id, badge_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: ix_admin_audit_log_action; Type: INDEX; Schema: public; Owner: arabiq
--

CREATE INDEX ix_admin_audit_log_action ON public.admin_audit_log USING btree (action);


--
-- Name: ix_admin_audit_log_admin_id; Type: INDEX; Schema: public; Owner: arabiq
--

CREATE INDEX ix_admin_audit_log_admin_id ON public.admin_audit_log USING btree (admin_id);


--
-- Name: ix_admin_audit_log_created_at; Type: INDEX; Schema: public; Owner: arabiq
--

CREATE INDEX ix_admin_audit_log_created_at ON public.admin_audit_log USING btree (created_at);


--
-- Name: ix_admin_audit_log_resource_type; Type: INDEX; Schema: public; Owner: arabiq
--

CREATE INDEX ix_admin_audit_log_resource_type ON public.admin_audit_log USING btree (resource_type);


--
-- Name: ix_admin_sessions_admin_id; Type: INDEX; Schema: public; Owner: arabiq
--

CREATE INDEX ix_admin_sessions_admin_id ON public.admin_sessions USING btree (admin_id);


--
-- Name: ix_certifications_module_id; Type: INDEX; Schema: public; Owner: arabiq
--

CREATE INDEX ix_certifications_module_id ON public.certifications USING btree (module_id);


--
-- Name: ix_certifications_user_id; Type: INDEX; Schema: public; Owner: arabiq
--

CREATE INDEX ix_certifications_user_id ON public.certifications USING btree (user_id);


--
-- Name: ix_exercise_log_created_at; Type: INDEX; Schema: public; Owner: arabiq
--

CREATE INDEX ix_exercise_log_created_at ON public.exercise_log USING btree (created_at);


--
-- Name: ix_exercise_log_lesson_id; Type: INDEX; Schema: public; Owner: arabiq
--

CREATE INDEX ix_exercise_log_lesson_id ON public.exercise_log USING btree (lesson_id);


--
-- Name: ix_exercise_log_skill_id; Type: INDEX; Schema: public; Owner: arabiq
--

CREATE INDEX ix_exercise_log_skill_id ON public.exercise_log USING btree (skill_id);


--
-- Name: ix_exercise_log_user_id; Type: INDEX; Schema: public; Owner: arabiq
--

CREATE INDEX ix_exercise_log_user_id ON public.exercise_log USING btree (user_id);


--
-- Name: ix_lesson_progress_lesson_id; Type: INDEX; Schema: public; Owner: arabiq
--

CREATE INDEX ix_lesson_progress_lesson_id ON public.lesson_progress USING btree (lesson_id);


--
-- Name: ix_lesson_progress_user_id; Type: INDEX; Schema: public; Owner: arabiq
--

CREATE INDEX ix_lesson_progress_user_id ON public.lesson_progress USING btree (user_id);


--
-- Name: ix_modules_part_id; Type: INDEX; Schema: public; Owner: arabiq
--

CREATE INDEX ix_modules_part_id ON public.modules USING btree (part_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: arabiq
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: admin_audit_log admin_audit_log_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: admin_roles admin_roles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT admin_roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: admin_sessions admin_sessions_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: certifications certifications_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id);


--
-- Name: certifications certifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: courses courses_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id);


--
-- Name: exercise_log exercise_log_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.exercise_log
    ADD CONSTRAINT exercise_log_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id);


--
-- Name: exercise_log exercise_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.exercise_log
    ADD CONSTRAINT exercise_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: lesson_progress lesson_progress_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id);


--
-- Name: lesson_progress lesson_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: lessons lessons_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: modules modules_part_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id);


--
-- Name: user_badges user_badges_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id);


--
-- Name: user_badges user_badges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arabiq
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict mLFnTS1RAKTDRcffi20MbOO9gKSog9l3C78qC8gO1ql8Ct7QIQdn51veFNe5nz8


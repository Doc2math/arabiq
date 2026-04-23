--
-- PostgreSQL database dump
--

\restrict HjWfb1LWsIlJj3YrvGYYhxrrI8pI05doMXxjH644ngRmjbDhMsw9z3WSUeoZcNM

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
    is_premium boolean NOT NULL
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
3604915943af
\.


--
-- Data for Name: badges; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.badges (id, name, description, icon_url, requirement) FROM stdin;
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.courses (id, module_id, title, sort_order) FROM stdin;
1	1	Module 1 — مَكْتَبٌ	1
\.


--
-- Data for Name: exercise_log; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.exercise_log (id, user_id, lesson_id, exercise_id, skill_id, exercise_type, variant, correct, response_time_ms, hint_used, attempt, created_at) FROM stdin;
7ab953b8-c0c7-4461-9a94-ee8cd9f6a9e4	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex1	letter_recognition	mcq	1	t	2500	f	1	2026-04-23 13:42:33.529184+02
a8ba3920-c168-47db-aed7-09c2fbcace61	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex2	letter_recognition	mcq	1	f	4500	f	1	2026-04-23 13:49:00.277663+02
494de1f7-9c01-4875-b044-9d949c830248	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex6	letter_recognition	audio_choice	1	f	10976	f	1	2026-04-23 14:05:49.325451+02
9b5a9ba8-1a36-4e5e-920b-82d76f9c7877	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex5	letter_recognition	audio_choice	1	t	3004	f	1	2026-04-23 14:05:53.790552+02
85c34168-ad59-4450-8569-6eef4db85ca0	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex8	letter_recognition	audio_choice	1	f	33257	f	1	2026-04-23 14:06:28.82238+02
02ce73d4-7981-4626-bec2-b702d7329a73	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex1	letter_recognition	mcq	1	t	2162	f	1	2026-04-23 14:06:32.459618+02
1003edfa-0abf-4d05-81d7-e13fad1f2e7f	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex3	letter_recognition	mcq	1	t	1671	f	1	2026-04-23 14:06:35.621201+02
fcbe7a15-4d0a-469a-986c-ebadcb149b05	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex2	letter_recognition	mcq	1	t	2157	f	1	2026-04-23 14:06:39.286414+02
ab80fb9c-0058-4e1d-ab7a-24d9816d3180	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex7	letter_recognition	audio_choice	1	f	3651	f	1	2026-04-23 14:06:44.382037+02
b6573550-dd71-43bc-b705-837c075bfa13	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex4	letter_recognition	mcq	1	t	2257	f	1	2026-04-23 14:06:48.111148+02
593b01f3-66bd-4f3f-969d-de2d94445abf	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex5	letter_recognition	audio_choice	1	f	210074	f	1	2026-04-23 14:10:44.311044+02
9af53ced-af5c-4b6b-a1d8-7e93abec07e0	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex2	letter_recognition	mcq	1	f	1222	f	1	2026-04-23 14:10:46.9886+02
f307bd20-2103-4b42-a426-f19539e59038	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex7	letter_recognition	audio_choice	1	t	2564	f	1	2026-04-23 14:10:51.015312+02
77f69b63-642c-4f31-9e6d-a70a7564264f	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex6	letter_recognition	audio_choice	1	t	1865	f	1	2026-04-23 14:10:54.346573+02
80d01ffc-7f24-4e00-90f8-795f661539d0	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex3	letter_recognition	mcq	1	t	2770	f	1	2026-04-23 14:10:58.605149+02
1a4b749b-ab12-4725-b78c-eddf3b437ff6	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex1	letter_recognition	mcq	1	f	2396	f	1	2026-04-23 14:11:02.502235+02
cd89fb41-5dbb-445f-a20e-63c2bc2b57e2	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex4	letter_recognition	mcq	1	t	3963	f	1	2026-04-23 14:11:07.963025+02
1fd05dfa-e7bf-47f2-a5cc-6269b163d0fe	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex8	letter_recognition	audio_choice	1	t	1210	f	1	2026-04-23 14:11:10.630603+02
7dedf20b-c6f5-4fcd-b4b9-46eae05b4550	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex3	letter_recognition	mcq	1	f	2480	f	1	2026-04-23 14:18:08.543233+02
68010a57-c68e-49c4-b2bd-6d0195828be3	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex1	letter_recognition	mcq	1	t	3597	f	1	2026-04-23 14:18:13.927453+02
4c5e673f-1331-46f0-9a12-b0a9db9b6fbd	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex8	letter_recognition	audio_choice	1	t	7056	f	1	2026-04-23 14:18:30.937069+02
8acce91d-9bca-484b-bcc8-78eb7d15fb81	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex7	letter_recognition	audio_choice	1	t	2863	f	1	2026-04-23 14:18:35.280216+02
61698660-dc94-4423-8de5-ecf31ab1bd86	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex4	letter_recognition	mcq	1	f	3998	f	1	2026-04-23 14:18:41.076882+02
d437045f-7bad-42ee-9095-6f5d445442f6	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex2	letter_recognition	mcq	1	t	5438	f	1	2026-04-23 14:18:48.00374+02
9a1238e8-fabf-42b6-8cb8-fb357bf32c88	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex6	letter_recognition	audio_choice	1	t	2077	f	1	2026-04-23 14:18:51.569798+02
a84ffdc6-deda-45f0-845e-7c9e4a5619f9	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex3	letter_recognition	mcq	1	t	4504	f	1	2026-04-23 14:18:57.869982+02
e7680daf-41aa-422b-90df-8c8e36274855	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex5	letter_recognition	audio_choice	1	t	3831	f	1	2026-04-23 14:19:03.18811+02
063e743f-d4cb-44ad-bab0-84cf2b72bf83	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	m1l1_ex1	letter_recognition	mcq	1	t	1503	f	1	2026-04-23 14:19:06.195106+02
9d89a8f6-3cef-4d58-a805-ced03ad4d4b1	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	11	m1l11_ex1	letter_recognition	mcq	1	t	2575	f	1	2026-04-23 14:51:11.400342+02
b83f34fe-96d4-44a0-a81d-012c68fb1d43	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	11	m1l11_ex2	harakat_reading	audio_choice	1	f	5084	f	1	2026-04-23 14:51:17.968568+02
c2030f5e-6f80-41eb-bed4-1d2c8f31fd66	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	11	m1l11_ex3	long_vowels	mcq	1	t	2897	f	1	2026-04-23 14:51:22.367069+02
7a7d2e9a-317d-41b2-aad3-12791e4ff083	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	11	m1l11_ex4	tanwin	mcq	1	t	4592	f	1	2026-04-23 14:51:28.776408+02
8d1c1036-a481-4fa3-ad2a-8de205d9e2e9	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	11	m1l11_ex5	letter_positions	mcq	1	f	4835	f	1	2026-04-23 14:51:35.072144+02
1b339d1f-4f96-423d-b18e-8d646d21ba5b	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	11	m1l11_ex6	word_reading	audio_choice	1	t	3951	f	1	2026-04-23 14:51:40.793012+02
f4ed8b36-2599-411b-8fc9-ad5433e95c03	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	11	m1l11_ex7	word_comprehension	matching	1	t	12606	f	1	2026-04-23 14:51:54.854396+02
a222d721-288f-4fdd-9e62-a8e97d059cf3	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	11	m1l11_ex8	word_writing	input_text	1	f	4379	f	1	2026-04-23 14:52:01.033976+02
d15d6631-6d07-44ad-a36c-bc25ffe2afc7	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	11	m1l11_ex9	sentence_reading	word_order	1	t	10784	f	1	2026-04-23 14:52:13.286756+02
6b267b99-584f-48c6-9b8f-0688a2fce10f	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	11	m1l11_ex10	word_building	drag_drop	1	t	4476	f	1	2026-04-23 14:52:19.528293+02
\.


--
-- Data for Name: lesson_progress; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.lesson_progress (id, user_id, lesson_id, score, xp_earned, duration_seconds, attempts, completed_at) FROM stdin;
9bb01acc-4338-47ef-bc05-390292cade23	040041cc-fd61-4a48-8486-81d41d500299	1	1	20	120	1	2026-04-22 11:19:10.814504+02
f6d3c5bb-bb35-4edc-9338-b3de589feb6a	040041cc-fd61-4a48-8486-81d41d500299	2	0.5714285714285714	14	105	5	2026-04-22 16:59:08.361716+02
9b6af071-8ae9-4a07-b286-36f3172a43f1	040041cc-fd61-4a48-8486-81d41d500299	3	0.8333333333333334	21	90	2	2026-04-22 17:03:38.464265+02
bd5a4249-305d-4d1b-aafd-621f22c6575a	040041cc-fd61-4a48-8486-81d41d500299	5	1	25	120	1	2026-04-22 17:07:10.144673+02
4ab184ca-ac50-49ec-b026-eae033028a84	040041cc-fd61-4a48-8486-81d41d500299	6	1	30	90	3	2026-04-22 17:08:52.429207+02
a1874d4f-17f8-411c-8287-cdb2f771573b	040041cc-fd61-4a48-8486-81d41d500299	7	1	30	90	1	2026-04-22 18:21:12.907404+02
c9603f1d-91a9-444f-914f-675e70dd478d	040041cc-fd61-4a48-8486-81d41d500299	4	0.8571428571428571	21	105	2	2026-04-22 17:05:29.820852+02
b46b2c43-3399-4395-bf47-0070059397e2	e5c15073-a411-4386-a73a-fb553d9c8cca	1	1	20	120	4	2026-04-20 23:07:34.156824+02
740da6d7-d20d-4de9-99bf-63f222c1dd7b	e5c15073-a411-4386-a73a-fb553d9c8cca	2	1	25	105	2	2026-04-20 23:11:17.717444+02
bd05051f-2a50-49f4-8f2d-e89b37c12c64	e5c15073-a411-4386-a73a-fb553d9c8cca	3	0.8333333333333334	21	90	2	2026-04-20 23:12:50.739246+02
574df5c4-5ad9-44d0-b9da-1a484808275c	e5c15073-a411-4386-a73a-fb553d9c8cca	4	1	25	105	2	2026-04-20 23:14:35.153462+02
b1a8f367-888a-4df2-a83a-b9a8a654c845	e5c15073-a411-4386-a73a-fb553d9c8cca	5	1	25	120	2	2026-04-20 23:16:52.60639+02
85ec7615-06ae-4ad9-bb00-9d4b4426ee38	e5c15073-a411-4386-a73a-fb553d9c8cca	6	1	30	90	2	2026-04-20 23:17:57.306284+02
1f04b12a-8741-4e86-9ec5-e91e7fe12963	e5c15073-a411-4386-a73a-fb553d9c8cca	7	1	30	90	2	2026-04-20 23:18:58.480529+02
162455a0-218e-4632-bbd7-efb190bfc9cd	e5c15073-a411-4386-a73a-fb553d9c8cca	8	1	30	120	2	2026-04-20 23:28:25.493274+02
238daa2b-7966-4bc1-a534-cdb9b9e644bc	e5c15073-a411-4386-a73a-fb553d9c8cca	9	1	30	90	2	2026-04-20 23:29:33.450536+02
bb9bca8f-0624-4d1f-981f-784403b582ac	e5c15073-a411-4386-a73a-fb553d9c8cca	10	1	35	90	2	2026-04-20 23:30:27.065547+02
b1600d88-1c16-4573-b424-304ca25476c8	e5c15073-a411-4386-a73a-fb553d9c8cca	11	1	60	150	2	2026-04-20 23:32:07.679717+02
a04cf988-9993-4f8d-b495-7cdf26ebc81d	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	2	0	0	105	1	2026-04-23 13:48:17.477847+02
8c9494df-c802-45c3-8dd5-9c2f6b3fcc2e	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	1	0.875	18	120	4	2026-04-23 13:10:31.367684+02
a61ad853-15ba-43c3-b4d4-abf9eb8206e7	2802ac9e-bc25-4edf-9a0b-5f510c5005e3	11	0.7	42	150	1	2026-04-23 14:52:20.976567+02
\.


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.lessons (id, course_id, title, lesson_type, xp_reward, duration_minutes, sort_order, content) FROM stdin;
1	1	Les 4 lettres dorées — م ك ت ب	identification	20	15	1	{"introduction": {"text": "Voici les 4 lettres du Module 1. Cliquez sur chaque carte pour entendre son nom. M\\u00e9morisez bien leur forme avant de passer aux exercices.", "letters": [{"ar": "\\u0645", "name": "Mim", "phoneme": "m", "audio": "/assets/audio/letters/mim.mp3"}, {"ar": "\\u0643", "name": "Kaf", "phoneme": "k", "audio": "/assets/audio/letters/kaf.mp3"}, {"ar": "\\u062a", "name": "Ta", "phoneme": "t", "audio": "/assets/audio/letters/ta.mp3"}, {"ar": "\\u0628", "name": "Ba", "phoneme": "b", "audio": "/assets/audio/letters/ba.mp3"}]}, "passing_score": 0.8, "exercises": [{"id": "m1l1_ex1", "type": "mcq", "skill_id": "letter_recognition", "prompt": "Quelle est cette lettre ?", "promptAr": "\\u0645", "xpReward": 3, "options": ["Ba", "Mim", "Kaf", "Ta"], "correctIndex": 1, "explanation": "\\u0645 = Mim, prononc\\u00e9e 'm'.", "prompts": ["Quelle est cette lettre ?", "Identifiez cette lettre", "Comment s'appelle cette lettre ?", "Quel est le nom de cette lettre ?"]}, {"id": "m1l1_ex2", "type": "mcq", "skill_id": "letter_recognition", "prompt": "Quelle est cette lettre ?", "promptAr": "\\u0628", "xpReward": 3, "options": ["Ta", "Kaf", "Ba", "Mim"], "correctIndex": 2, "explanation": "\\u0628 = Ba, prononc\\u00e9e 'b'. 1 point en dessous.", "prompts": ["Quelle est cette lettre ?", "Identifiez cette lettre", "Comment s'appelle cette lettre ?", "Quel est le nom de cette lettre ?"]}, {"id": "m1l1_ex3", "type": "mcq", "skill_id": "letter_recognition", "prompt": "Quelle est cette lettre ?", "promptAr": "\\u0643", "xpReward": 3, "options": ["Kaf", "Mim", "Ba", "Ta"], "correctIndex": 0, "explanation": "\\u0643 = Kaf, prononc\\u00e9e 'k'.", "prompts": ["Quelle est cette lettre ?", "Identifiez cette lettre", "Comment s'appelle cette lettre ?", "Quel est le nom de cette lettre ?"]}, {"id": "m1l1_ex4", "type": "mcq", "skill_id": "letter_recognition", "prompt": "Quelle est cette lettre ?", "promptAr": "\\u062a", "xpReward": 3, "options": ["Ba", "Ta", "Mim", "Kaf"], "correctIndex": 1, "explanation": "\\u062a = Ta, prononc\\u00e9e 't'. 2 points au-dessus.", "prompts": ["Quelle est cette lettre ?", "Identifiez cette lettre", "Comment s'appelle cette lettre ?", "Quel est le nom de cette lettre ?"]}, {"id": "m1l1_ex5", "type": "audio_choice", "skill_id": "letter_recognition", "prompt": "\\u00c9coutez et identifiez la lettre", "audioUrl": "/assets/audio/letters/mim.mp3", "xpReward": 4, "options": ["\\u062a", "\\u0628", "\\u0645", "\\u0643"], "correctIndex": 2, "explanation": "Vous avez entendu Mim \\u2192 \\u0645", "prompts": ["\\u00c9coutez et identifiez la lettre", "Quelle lettre entendez-vous ?", "Reconnaissez la lettre entendue", "Identifiez la lettre apr\\u00e8s \\u00e9coute"]}, {"id": "m1l1_ex6", "type": "audio_choice", "skill_id": "letter_recognition", "prompt": "\\u00c9coutez et identifiez la lettre", "audioUrl": "/assets/audio/letters/ba.mp3", "xpReward": 4, "options": ["\\u0645", "\\u0628", "\\u0643", "\\u062a"], "correctIndex": 1, "explanation": "Vous avez entendu Ba \\u2192 \\u0628", "prompts": ["\\u00c9coutez et identifiez la lettre", "Quelle lettre entendez-vous ?", "Reconnaissez la lettre entendue", "Identifiez la lettre apr\\u00e8s \\u00e9coute"]}, {"id": "m1l1_ex7", "type": "audio_choice", "skill_id": "letter_recognition", "prompt": "\\u00c9coutez et identifiez la lettre", "audioUrl": "/assets/audio/letters/kaf.mp3", "xpReward": 4, "options": ["\\u0643", "\\u062a", "\\u0628", "\\u0645"], "correctIndex": 0, "explanation": "Vous avez entendu Kaf \\u2192 \\u0643", "prompts": ["\\u00c9coutez et identifiez la lettre", "Quelle lettre entendez-vous ?", "Reconnaissez la lettre entendue", "Identifiez la lettre apr\\u00e8s \\u00e9coute"]}, {"id": "m1l1_ex8", "type": "audio_choice", "skill_id": "letter_recognition", "prompt": "\\u00c9coutez et identifiez la lettre", "audioUrl": "/assets/audio/letters/ta.mp3", "xpReward": 4, "options": ["\\u0628", "\\u0645", "\\u0643", "\\u062a"], "correctIndex": 3, "explanation": "Vous avez entendu Ta \\u2192 \\u062a", "prompts": ["\\u00c9coutez et identifiez la lettre", "Quelle lettre entendez-vous ?", "Reconnaissez la lettre entendue", "Identifiez la lettre apr\\u00e8s \\u00e9coute"]}]}
2	1	Harakat — les voyelles courtes	harakat	25	20	2	{"introduction": {"text": "Les harakat sont de petits signes qui donnent leur son aux lettres. Cliquez sur chaque carte pour entendre la syllabe. Utilisez le bouton 'M\\u00e9langer' pour vous entra\\u00eener.", "signs": [{"ar": "\\u0628\\u064e", "phoneme": "ba", "description": "Fatha \\u2192 son 'a'", "audio": "/assets/audio/syllables/ba_fatha.mp3"}, {"ar": "\\u0628\\u0650", "phoneme": "bi", "description": "Kasra \\u2192 son 'i'", "audio": "/assets/audio/syllables/ba_kasra.mp3"}, {"ar": "\\u0628\\u064f", "phoneme": "bu", "description": "Damma \\u2192 son 'ou'", "audio": "/assets/audio/syllables/ba_damma.mp3"}, {"ar": "\\u0628\\u0652", "phoneme": "b", "description": "Suk\\u016bn \\u2192 pas de voyelle", "audio": "/assets/audio/syllables/ba_sukun.mp3"}, {"ar": "\\u0643\\u064e", "phoneme": "ka", "description": "Fatha \\u2192 son 'a'", "audio": "/assets/audio/syllables/kaf_fatha.mp3"}, {"ar": "\\u0643\\u0650", "phoneme": "ki", "description": "Kasra \\u2192 son 'i'", "audio": "/assets/audio/syllables/kaf_kasra.mp3"}, {"ar": "\\u0643\\u064f", "phoneme": "ku", "description": "Damma \\u2192 son 'ou'", "audio": "/assets/audio/syllables/kaf_damma.mp3"}, {"ar": "\\u062a\\u064e", "phoneme": "ta", "description": "Fatha \\u2192 son 'a'", "audio": "/assets/audio/syllables/ta_fatha.mp3"}, {"ar": "\\u062a\\u0650", "phoneme": "ti", "description": "Kasra \\u2192 son 'i'", "audio": "/assets/audio/syllables/ta_kasra.mp3"}, {"ar": "\\u062a\\u064f", "phoneme": "tu", "description": "Damma \\u2192 son 'ou'", "audio": "/assets/audio/syllables/ta_damma.mp3"}, {"ar": "\\u0645\\u064e", "phoneme": "ma", "description": "Fatha \\u2192 son 'a'", "audio": "/assets/audio/syllables/mim_fatha.mp3"}, {"ar": "\\u0645\\u0650", "phoneme": "mi", "description": "Kasra \\u2192 son 'i'", "audio": "/assets/audio/syllables/mim_kasra.mp3"}, {"ar": "\\u0645\\u064f", "phoneme": "mu", "description": "Damma \\u2192 son 'ou'", "audio": "/assets/audio/syllables/mim_damma.mp3"}, {"ar": "\\u0645\\u0652", "phoneme": "m", "description": "Suk\\u016bn \\u2192 pas de voyelle", "audio": "/assets/audio/syllables/mim_sukun.mp3"}]}, "passing_score": 0.8, "exercises": [{"id": "m1l2_ex1", "type": "audio_choice", "skill_id": "harakat_reading", "prompt": "\\u00c9coutez et identifiez la syllabe", "audioUrl": "/assets/audio/syllables/ba_fatha.mp3", "xpReward": 4, "options": ["\\u0628\\u064e", "\\u0628\\u0650", "\\u0628\\u064f", "\\u0628\\u0652"], "correctIndex": 0, "explanation": "\\u0628\\u064e = ba \\u2014 fatha au-dessus.", "prompts": ["\\u00c9coutez et identifiez la syllabe", "Quelle syllabe entendez-vous ?", "Reconnaissez la syllabe entendue", "Identifiez la syllabe apr\\u00e8s \\u00e9coute"]}, {"id": "m1l2_ex2", "type": "audio_choice", "skill_id": "harakat_reading", "prompt": "\\u00c9coutez et identifiez la syllabe", "audioUrl": "/assets/audio/syllables/kaf_kasra.mp3", "xpReward": 4, "options": ["\\u0643\\u064e", "\\u0643\\u0650", "\\u0643\\u064f", "\\u0643\\u0652"], "correctIndex": 1, "explanation": "\\u0643\\u0650 = ki \\u2014 kasra en dessous.", "prompts": ["\\u00c9coutez et identifiez la syllabe", "Quelle syllabe entendez-vous ?", "Reconnaissez la syllabe entendue", "Identifiez la syllabe apr\\u00e8s \\u00e9coute"]}, {"id": "m1l2_ex3", "type": "mcq", "skill_id": "harakat_reading", "prompt": "Comment se prononce cette syllabe ?", "promptAr": "\\u062a\\u064f", "xpReward": 3, "options": ["ta", "ti", "tou", "t"], "correctIndex": 2, "explanation": "\\u062a\\u064f = tou \\u2014 damma au-dessus \\u2192 son 'ou'."}, {"id": "m1l2_ex4", "type": "mcq", "skill_id": "harakat_reading", "prompt": "Quel signe repr\\u00e9sente la kasra ?", "promptAr": null, "xpReward": 3, "options": ["\\u064e", "\\u0650", "\\u064f", "\\u0652"], "correctIndex": 1, "explanation": "\\u0650 = kasra \\u2014 petit trait en dessous \\u2192 son 'i'."}, {"id": "m1l2_ex5", "type": "audio_choice", "skill_id": "harakat_reading", "prompt": "\\u00c9coutez et identifiez la syllabe", "audioUrl": "/assets/audio/syllables/mim_damma.mp3", "xpReward": 4, "options": ["\\u0645\\u064e", "\\u0645\\u0650", "\\u0645\\u064f", "\\u0645\\u0652"], "correctIndex": 2, "explanation": "\\u0645\\u064f = mu \\u2014 damma \\u2192 son 'ou'.", "prompts": ["\\u00c9coutez et identifiez la syllabe", "Quelle syllabe entendez-vous ?", "Reconnaissez la syllabe entendue", "Identifiez la syllabe apr\\u00e8s \\u00e9coute"]}, {"id": "m1l2_ex6", "type": "mcq", "skill_id": "harakat_reading", "prompt": "Comment se prononce \\u0645\\u0652 ?", "promptAr": "\\u0645\\u0652", "xpReward": 3, "options": ["ma", "mi", "mu", "m (sans voyelle)"], "correctIndex": 3, "explanation": "\\u0645\\u0652 = m \\u2014 suk\\u016bn \\u2192 consonne sans voyelle."}, {"id": "m1l2_ex7", "type": "audio_choice", "skill_id": "harakat_reading", "prompt": "\\u00c9coutez et identifiez la syllabe", "audioUrl": "/assets/audio/syllables/ta_kasra.mp3", "xpReward": 4, "options": ["\\u062a\\u064e", "\\u062a\\u0650", "\\u062a\\u064f", "\\u062a\\u0652"], "correctIndex": 1, "explanation": "\\u062a\\u0650 = ti \\u2014 kasra en dessous.", "prompts": ["\\u00c9coutez et identifiez la syllabe", "Quelle syllabe entendez-vous ?", "Reconnaissez la syllabe entendue", "Identifiez la syllabe apr\\u00e8s \\u00e9coute"]}]}
3	1	Voyelles longues — ا و ي	harakat	25	20	3	{"introduction": {"text": "\\u0627 \\u0648 \\u064a jouent le r\\u00f4le de voyelles longues. Elles allongent le son de la lettre qui les pr\\u00e9c\\u00e8de.", "signs": [{"ar": "\\u0628\\u064e\\u0627", "phoneme": "baa", "description": "Fatha + Alif \\u2192 son 'aa' long", "audio": "/assets/audio/syllables/ba_alif_long.mp3"}, {"ar": "\\u0628\\u064f\\u0648", "phoneme": "buu", "description": "Damma + Waw \\u2192 son 'uu' long", "audio": "/assets/audio/syllables/ba_waw_long.mp3"}, {"ar": "\\u0628\\u0650\\u064a", "phoneme": "bii", "description": "Kasra + Ya \\u2192 son 'ii' long", "audio": "/assets/audio/syllables/ba_ya_long.mp3"}, {"ar": "\\u0643\\u064e\\u0627", "phoneme": "kaa", "description": "Fatha + Alif \\u2192 son 'aa' long", "audio": "/assets/audio/syllables/kaf_alif_long.mp3"}, {"ar": "\\u0643\\u064f\\u0648", "phoneme": "kuu", "description": "Damma + Waw \\u2192 son 'uu' long", "audio": "/assets/audio/syllables/kaf_waw_long.mp3"}, {"ar": "\\u0643\\u0650\\u064a", "phoneme": "kii", "description": "Kasra + Ya \\u2192 son 'ii' long", "audio": "/assets/audio/syllables/kaf_ya_long.mp3"}]}, "passing_score": 0.8, "exercises": [{"id": "m1l3_ex1", "type": "mcq", "skill_id": "long_vowels", "prompt": "Comment se prononce \\u0628\\u064e\\u0627 ?", "promptAr": "\\u0628\\u064e\\u0627", "xpReward": 4, "options": ["ba", "baa", "bi", "buu"], "correctIndex": 1, "explanation": "\\u0628\\u064e\\u0627 = baa \\u2014 fatha + alif = voyelle longue 'aa'."}, {"id": "m1l3_ex2", "type": "audio_choice", "skill_id": "long_vowels", "prompt": "\\u00c9coutez et identifiez", "audioUrl": "/assets/audio/syllables/ba_waw_long.mp3", "xpReward": 4, "options": ["\\u0628\\u064e\\u0627", "\\u0628\\u064f\\u0648", "\\u0628\\u0650\\u064a", "\\u0628\\u064e"], "correctIndex": 1, "explanation": "\\u0628\\u064f\\u0648 = buu \\u2014 damma + waw = 'uu' long.", "prompts": ["\\u00c9coutez et identifiez", "Quelle forme reconnaissez-vous ?", "Identifiez apr\\u00e8s \\u00e9coute"]}, {"id": "m1l3_ex3", "type": "mcq", "skill_id": "long_vowels", "prompt": "Quelle voyelle longue donne le son 'ii' ?", "promptAr": null, "xpReward": 3, "options": ["\\u0627", "\\u0648", "\\u064a", "\\u0628"], "correctIndex": 2, "explanation": "\\u064a apr\\u00e8s kasra = voyelle longue 'ii'."}, {"id": "m1l3_ex4", "type": "audio_choice", "skill_id": "long_vowels", "prompt": "\\u00c9coutez et identifiez", "audioUrl": "/assets/audio/syllables/kaf_alif_long.mp3", "xpReward": 4, "options": ["\\u0643\\u064e", "\\u0643\\u064e\\u0627", "\\u0643\\u064f\\u0648", "\\u0643\\u0650\\u064a"], "correctIndex": 1, "explanation": "\\u0643\\u064e\\u0627 = kaa \\u2014 fatha + alif.", "prompts": ["\\u00c9coutez et identifiez", "Quelle forme reconnaissez-vous ?", "Identifiez apr\\u00e8s \\u00e9coute"]}, {"id": "m1l3_ex5", "type": "mcq", "skill_id": "long_vowels", "prompt": "Comment se prononce \\u0643\\u064f\\u0648\\u0628\\u064c ?", "promptAr": "\\u0643\\u064f\\u0648\\u0628\\u064c", "xpReward": 5, "options": ["kabun", "kuubun", "kibun", "kaabun"], "correctIndex": 1, "explanation": "\\u0643\\u064f\\u0648\\u0628\\u064c = kuubun \\u2014 damma + waw = 'uu' long."}, {"id": "m1l3_ex6", "type": "mcq", "skill_id": "long_vowels", "prompt": "Quelle voyelle longue correspond \\u00e0 \\u0627 ?", "promptAr": null, "xpReward": 3, "options": ["ii", "uu", "aa", "a"], "correctIndex": 2, "explanation": "\\u0627 apr\\u00e8s fatha = voyelle longue 'aa'."}]}
4	1	Tanwīn — la nunation	harakat	25	15	4	{"introduction": {"text": "Le tanw\\u012bn ajoute un son 'n' \\u00e0 la fin d'un mot. Il existe 3 formes. C'est le son 'un' dans \\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c.", "signs": [{"ar": "\\u0628\\u064b", "phoneme": "ban", "description": "Tanw\\u012bn fath \\u2192 son 'an'", "audio": "/assets/audio/syllables/ba_tanwin_fath.mp3"}, {"ar": "\\u0628\\u064d", "phoneme": "bin", "description": "Tanw\\u012bn kasr \\u2192 son 'in'", "audio": "/assets/audio/syllables/ba_tanwin_kasr.mp3"}, {"ar": "\\u0628\\u064c", "phoneme": "bun", "description": "Tanw\\u012bn damm \\u2192 son 'oun'", "audio": "/assets/audio/syllables/ba_tanwin_damm.mp3"}]}, "passing_score": 0.8, "exercises": [{"id": "m1l4_ex1", "type": "mcq", "skill_id": "tanwin", "prompt": "Comment se prononce \\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c \\u00e0 la fin ?", "promptAr": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "xpReward": 4, "options": ["maktaba", "maktabun", "maktabin", "maktab"], "correctIndex": 1, "explanation": "\\u064c = tanw\\u012bn damm \\u2192 son 'un' final."}, {"id": "m1l4_ex2", "type": "audio_choice", "skill_id": "tanwin", "prompt": "\\u00c9coutez et identifiez le tanw\\u012bn", "audioUrl": "/assets/audio/syllables/ba_tanwin_fath.mp3", "xpReward": 4, "options": ["\\u0628\\u064b", "\\u0628\\u064d", "\\u0628\\u064c", "\\u0628\\u064e"], "correctIndex": 0, "explanation": "\\u0628\\u064b = ban \\u2014 tanw\\u012bn fath \\u2192 'an'.", "prompts": ["\\u00c9coutez et identifiez le tanw\\u012bn", "Quel tanw\\u012bn entendez-vous ?", "Identifiez le signe de tanw\\u012bn"]}, {"id": "m1l4_ex3", "type": "mcq", "skill_id": "tanwin", "prompt": "Quel signe repr\\u00e9sente le tanw\\u012bn damm ?", "promptAr": null, "xpReward": 3, "options": ["\\u064b", "\\u064d", "\\u064c", "\\u0652"], "correctIndex": 2, "explanation": "\\u064c = tanw\\u012bn damm \\u2192 son 'oun'."}, {"id": "m1l4_ex4", "type": "mcq", "skill_id": "tanwin", "prompt": "Comment se prononce \\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c ?", "promptAr": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "xpReward": 4, "options": ["kitaba", "kitabin", "kitabun", "kitab"], "correctIndex": 2, "explanation": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c = kitaabun \\u2014 tanw\\u012bn damm \\u00e0 la fin."}, {"id": "m1l4_ex5", "type": "mcq", "skill_id": "tanwin", "prompt": "Combien de formes de tanw\\u012bn existe-t-il ?", "promptAr": null, "xpReward": 3, "options": ["1", "2", "3", "4"], "correctIndex": 2, "explanation": "3 formes : tanw\\u012bn fath (an), kasr (in), damm (un)."}, {"id": "m1l4_ex6", "type": "audio_choice", "skill_id": "tanwin", "prompt": "\\u00c9coutez et identifiez le tanw\\u012bn", "audioUrl": "/assets/audio/syllables/ba_tanwin_damm.mp3", "xpReward": 4, "options": ["\\u0628\\u064b", "\\u0628\\u064d", "\\u0628\\u064c", "\\u0628\\u064f"], "correctIndex": 2, "explanation": "\\u0628\\u064c = bun \\u2014 tanw\\u012bn damm.", "prompts": ["\\u00c9coutez et identifiez le tanw\\u012bn", "Quel tanw\\u012bn entendez-vous ?", "Identifiez le signe de tanw\\u012bn"]}, {"id": "m1l4_ex7", "type": "mcq", "skill_id": "tanwin", "prompt": "Identifiez la forme avec tanw\\u012bn kasr", "promptAr": null, "xpReward": 4, "options": ["\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064d", "\\u0628\\u064e\\u0627\\u0628\\u064b", "\\u062a\\u064e\\u0645\\u064e\\u0651"], "correctIndex": 1, "explanation": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064d = kitaabin \\u2014 tanw\\u012bn kasr (son 'in')."}]}
5	1	Positions des lettres — début, milieu, fin	identification	25	20	5	{"introduction": {"text": "En arabe, toutes les lettres s'attachent \\u00e0 la lettre qui les pr\\u00e9c\\u00e8de (\\u00e0 droite). Mais 6 lettres ne s'attachent jamais \\u00e0 la lettre qui les suit (\\u00e0 gauche) :\\n\\n\\u0627  \\u062f  \\u0630  \\u0631  \\u0632  \\u0648\\n\\nLa lettre qui suit l'une de ces 6 lettres :\\n\\u2022 Au milieu du mot \\u2192 forme initiale (elle repart \\u00e0 gauche normalement)\\n\\u2022 En fin de mot \\u2192 forme finale (attach\\u00e9e \\u00e0 droite seulement)\\n\\nExemples avec nos lettres :", "examples": [{"ar": "\\u0628\\u064e\\u0627\\u0628\\u064c", "phoneme": "baabun", "description": "Le 2\\u00e8me \\u0628 vient apr\\u00e8s \\u0627 \\u2192 forme initiale \\u0628\\u0640 (repart \\u00e0 gauche)", "audio": "/assets/audio/words/bab.mp3"}, {"ar": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "phoneme": "kitaabun", "description": "Le \\u0628 final vient apr\\u00e8s \\u0627 \\u2192 forme finale \\u0640\\u0628", "audio": "/assets/audio/words/kitab.mp3"}, {"ar": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064e\\u0629\\u064c", "phoneme": "kitaabatun", "description": "\\u0629 vient apr\\u00e8s \\u0628 (s'attache \\u00e0 gauche) \\u2192 Ta marbuta attach\\u00e9e \\u0640\\u0629", "audio": "/assets/audio/words/kitaba_nom.mp3"}, {"ar": "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "phoneme": "kaatibun", "description": "\\u062a vient apr\\u00e8s \\u0627 \\u2192 forme initiale \\u062a\\u0640 (repart \\u00e0 gauche)", "audio": "/assets/audio/words/katib.mp3"}], "rules": [{"title": "Les 6 lettres non-connectantes \\u00e0 gauche", "ar": "\\u0627  \\u062f  \\u0630  \\u0631  \\u0632  \\u0648", "description": "Ces lettres s'attachent \\u00e0 droite mais jamais \\u00e0 gauche."}, {"title": "Kaf \\u0643 en position finale", "ar": "\\u0640\\u0643", "description": "Kaf prend la forme finale \\u0640\\u0643. Dans certains styles elle peut s'\\u00e9crire \\u0640\\u06a9."}, {"title": "Ta marbuta \\u0629", "ar": "\\u0629 / \\u0640\\u0629", "description": "Uniquement en fin de mot. Attach\\u00e9e \\u0640\\u0629 si la lettre pr\\u00e9c\\u00e9dente se connecte \\u00e0 gauche, sinon forme isol\\u00e9e \\u0629."}], "positions": [{"letter": "\\u0645", "name": "Mim", "audio": "/assets/audio/letters/mim.mp3", "forms": [{"position": "Isol\\u00e9e", "ar": "\\u0645", "example": "", "note": ""}, {"position": "D\\u00e9but", "ar": "\\u0645\\u0640", "example": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "note": ""}, {"position": "Milieu", "ar": "\\u0640\\u0645\\u0640", "example": "\\u062a\\u064e\\u0645\\u064e\\u0651", "note": ""}, {"position": "Fin", "ar": "\\u0640\\u0645", "example": "\\u0642\\u064e\\u0644\\u064e\\u0645", "note": ""}]}, {"letter": "\\u0643", "name": "Kaf", "audio": "/assets/audio/letters/kaf.mp3", "forms": [{"position": "Isol\\u00e9e", "ar": "\\u0643", "example": "", "note": ""}, {"position": "D\\u00e9but", "ar": "\\u0643\\u0640", "example": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "note": ""}, {"position": "Milieu", "ar": "\\u0640\\u0643\\u0640", "example": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "note": ""}, {"position": "Fin", "ar": "\\u0640\\u0643", "example": "\\u0645\\u064e\\u0644\\u0650\\u0643", "note": "Peut aussi s'\\u00e9crire \\u0640\\u06a9 selon le style"}]}, {"letter": "\\u062a", "name": "Ta", "audio": "/assets/audio/letters/ta.mp3", "forms": [{"position": "Isol\\u00e9e", "ar": "\\u062a", "example": "", "note": ""}, {"position": "D\\u00e9but", "ar": "\\u062a\\u0640", "example": "\\u062a\\u064e\\u0645\\u064e\\u0651", "note": ""}, {"position": "Milieu", "ar": "\\u0640\\u062a\\u0640", "example": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "note": ""}, {"position": "Fin (Ta ouverte)", "ar": "\\u0640\\u062a", "example": "\\u0628\\u064e\\u0627\\u062a\\u064e", "note": "Ta normale en fin de mot"}, {"position": "Fin (Ta marbuta attach\\u00e9e)", "ar": "\\u0640\\u0629", "example": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064e\\u0629\\u064c", "note": "Ta marbuta apr\\u00e8s lettre connectante"}, {"position": "Fin (Ta marbuta isol\\u00e9e)", "ar": "\\u0629", "example": "\\u0648\\u064e\\u0631\\u0652\\u062f\\u064e\\u0629", "note": "Ta marbuta apr\\u00e8s \\u0627 \\u062f \\u0630 \\u0631 \\u0632 \\u0648"}]}, {"letter": "\\u0628", "name": "Ba", "audio": "/assets/audio/letters/ba.mp3", "forms": [{"position": "Isol\\u00e9e", "ar": "\\u0628", "example": "", "note": ""}, {"position": "D\\u00e9but", "ar": "\\u0628\\u0640", "example": "\\u0628\\u064e\\u0627\\u0628\\u064c", "note": ""}, {"position": "Milieu", "ar": "\\u0640\\u0628\\u0640", "example": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064e\\u0629\\u064c", "note": ""}, {"position": "Fin", "ar": "\\u0640\\u0628", "example": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "note": ""}, {"position": "Fin apr\\u00e8s \\u0627 \\u0648 \\u0631 \\u0632 \\u062f \\u0630", "ar": "\\u0628", "example": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "note": "Forme finale mais sans attachement \\u00e0 gauche"}]}]}, "passing_score": 0.8, "exercises": [{"id": "m1l5_ex1", "type": "mcq", "skill_id": "letter_positions", "prompt": "Dans \\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c, la lettre \\u0628 est en quelle position ?", "promptAr": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "xpReward": 5, "options": ["D\\u00e9but", "Milieu", "Fin (finale)", "Isol\\u00e9e"], "correctIndex": 2, "explanation": "\\u0628 est la derni\\u00e8re lettre \\u2014 forme finale \\u0640\\u0628."}, {"id": "m1l5_ex2", "type": "mcq", "skill_id": "letter_positions", "prompt": "Dans \\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c, la lettre \\u0643 est en quelle position ?", "promptAr": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "xpReward": 5, "options": ["Isol\\u00e9e", "Finale", "Initiale (d\\u00e9but)", "M\\u00e9diane (milieu)"], "correctIndex": 2, "explanation": "\\u0643 est la premi\\u00e8re lettre \\u2014 forme initiale \\u0643\\u0640."}, {"id": "m1l5_ex3", "type": "mcq", "skill_id": "letter_positions", "prompt": "Combien de formes peut avoir une lettre arabe ?", "promptAr": null, "xpReward": 3, "options": ["1", "2", "3", "4"], "correctIndex": 3, "explanation": "Jusqu'\\u00e0 4 formes : isol\\u00e9e, initiale, m\\u00e9diane, finale."}, {"id": "m1l5_ex4", "type": "mcq", "skill_id": "letter_positions", "prompt": "Quelle est la forme initiale (d\\u00e9but) de \\u0628 ?", "promptAr": "\\u0628", "xpReward": 4, "options": ["\\u0640\\u0628", "\\u0628\\u0640", "\\u0640\\u0628\\u0640", "\\u0628"], "correctIndex": 1, "explanation": "\\u0628\\u0640 est la forme initiale \\u2014 utilis\\u00e9e au d\\u00e9but d'un mot."}, {"id": "m1l5_ex5", "type": "mcq", "skill_id": "letter_positions", "prompt": "Dans \\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c, la lettre \\u062a est en quelle position ?", "promptAr": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "xpReward": 5, "options": ["Initiale", "M\\u00e9diane (milieu)", "Finale", "Isol\\u00e9e"], "correctIndex": 1, "explanation": "\\u062a est au milieu de \\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c \\u2014 forme m\\u00e9diane \\u0640\\u062a\\u0640."}, {"id": "m1l5_ex6", "type": "mcq", "skill_id": "letter_positions", "prompt": "La forme \\u0640\\u0643 correspond \\u00e0 quelle position ?", "promptAr": "\\u0640\\u0643", "xpReward": 4, "options": ["Initiale", "M\\u00e9diane", "Finale", "Isol\\u00e9e"], "correctIndex": 2, "explanation": "\\u0640\\u0643 = forme finale \\u2014 \\u0643 en fin de mot."}, {"id": "m1l5_ex7", "type": "mcq", "skill_id": "letter_positions", "prompt": "Dans \\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c, quelle est la forme de \\u062a au milieu ?", "promptAr": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "xpReward": 6, "options": ["\\u062a\\u0640 (initiale)", "\\u0640\\u062a\\u0640 (m\\u00e9diane)", "\\u0640\\u062a (finale)", "\\u062a (isol\\u00e9e)"], "correctIndex": 1, "explanation": "\\u062a est au milieu de \\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c \\u2014 forme m\\u00e9diane \\u0640\\u062a\\u0640."}, {"id": "m1l5_ex8", "type": "mcq", "skill_id": "letter_positions", "prompt": "Dans \\u0628\\u064e\\u0627\\u0628\\u064c, le premier \\u0628 est en quelle position ?", "promptAr": "\\u0628\\u064e\\u0627\\u0628\\u064c", "xpReward": 5, "options": ["Isol\\u00e9e", "Initiale (\\u0628\\u0640)", "M\\u00e9diane", "Finale"], "correctIndex": 1, "explanation": "Le premier \\u0628 dans \\u0628\\u064e\\u0627\\u0628\\u064c est en position initiale \\u2014 forme \\u0628\\u0640."}]}
6	1	Premiers mots — lecture et compréhension	mots	30	25	6	{"introduction": {"text": "D\\u00e9couvrez les premiers mots construits avec \\u0645 \\u0643 \\u062a \\u0628 et les voyelles longues \\u0627 \\u0648 \\u064a. Cliquez sur chaque carte pour entendre la prononciation.", "words": [{"ar": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "phoneme": "maktabun", "translation": "Bureau", "type": "nom", "audio": "/assets/audio/words/maktab.mp3", "image": "/assets/images/words/maktab.jpg"}, {"ar": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "phoneme": "kitaabun", "translation": "Un livre", "type": "nom", "audio": "/assets/audio/words/kitab.mp3", "image": "/assets/images/words/kitab.jpg"}, {"ar": "\\u0628\\u064e\\u0627\\u0628\\u064c", "phoneme": "baabun", "translation": "Porte", "type": "nom", "audio": "/assets/audio/words/bab.mp3", "image": "/assets/images/words/bab.jpg"}, {"ar": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e", "phoneme": "kataba", "translation": "Il a \\u00e9crit", "type": "verbe", "audio": "/assets/audio/words/kataba.mp3", "image": "/assets/images/words/kataba.jpg"}, {"ar": "\\u0628\\u064e\\u064a\\u0652\\u062a\\u064c", "phoneme": "baytun", "translation": "Maison", "type": "nom", "audio": "/assets/audio/words/bayt.mp3", "image": "/assets/images/words/bayt.jpg"}, {"ar": "\\u0643\\u064f\\u0648\\u0628\\u064c", "phoneme": "kuubun", "translation": "Tasse", "type": "nom", "audio": "/assets/audio/words/kub.mp3", "image": "/assets/images/words/kub.jpg"}, {"ar": "\\u0628\\u064f\\u0648\\u0645\\u064e\\u0629\\u064c", "phoneme": "buumatun", "translation": "Hibou", "type": "nom", "audio": "/assets/audio/words/buma.mp3", "image": "/assets/images/words/buma.jpg"}, {"ar": "\\u0645\\u064e\\u0627\\u0645\\u064e\\u0627", "phoneme": "maama", "translation": "Maman", "type": "nom", "audio": "/assets/audio/words/mama.mp3", "image": "/assets/images/words/mama.jpg"}]}, "passing_score": 0.8, "exercises": [{"id": "m1l6_ex1", "type": "audio_choice", "skill_id": "word_reading", "prompt": "\\u00c9coutez et identifiez le mot", "audioUrl": "/assets/audio/words/kitab.mp3", "xpReward": 5, "options": ["\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "\\u0628\\u064e\\u0627\\u0628\\u064c", "\\u0643\\u064f\\u0648\\u0628\\u064c"], "correctIndex": 1, "explanation": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c = kitaabun = un livre."}, {"id": "m1l6_ex2", "type": "matching", "skill_id": "word_comprehension", "prompt": "Associez chaque mot arabe \\u00e0 sa traduction", "xpReward": 8, "pairs": [{"ar": "\\u0628\\u064e\\u0627\\u0628\\u064c", "fr": "Porte"}, {"ar": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "fr": "Un livre"}, {"ar": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "fr": "Bureau"}, {"ar": "\\u0628\\u064e\\u064a\\u0652\\u062a\\u064c", "fr": "Maison"}], "shuffledFr": ["Bureau", "Maison", "Porte", "Un livre"]}, {"id": "m1l6_ex3", "type": "mcq", "skill_id": "word_comprehension", "prompt": "Que signifie \\u0643\\u064e\\u062a\\u064e\\u0628\\u064e ?", "promptAr": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e", "xpReward": 4, "options": ["Un livre", "Biblioth\\u00e8que", "Il a \\u00e9crit", "\\u00c9crivain"], "correctIndex": 2, "explanation": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e = kataba = il a \\u00e9crit (verbe au pass\\u00e9)."}, {"id": "m1l6_ex4", "type": "audio_choice", "skill_id": "word_reading", "prompt": "\\u00c9coutez et identifiez le mot", "audioUrl": "/assets/audio/words/buma.mp3", "xpReward": 5, "options": ["\\u0643\\u064f\\u0648\\u0628\\u064c", "\\u0628\\u064e\\u0627\\u0628\\u064c", "\\u0628\\u064f\\u0648\\u0645\\u064e\\u0629\\u064c", "\\u0645\\u064e\\u0627\\u0645\\u064e\\u0627"], "correctIndex": 2, "explanation": "\\u0628\\u064f\\u0648\\u0645\\u064e\\u0629\\u064c = buumatun = hibou."}, {"id": "m1l6_ex5", "type": "mcq", "skill_id": "word_comprehension", "prompt": "Quel mot signifie 'Maison' ?", "promptAr": null, "xpReward": 4, "options": ["\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "\\u0628\\u064e\\u064a\\u0652\\u062a\\u064c", "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "\\u0628\\u064e\\u0627\\u0628\\u064c"], "correctIndex": 1, "explanation": "\\u0628\\u064e\\u064a\\u0652\\u062a\\u064c = baytun = maison."}, {"id": "m1l6_ex6", "type": "mcq", "skill_id": "word_comprehension", "prompt": "Quelle est la nature du mot \\u0643\\u064e\\u062a\\u064e\\u0628\\u064e ?", "promptAr": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e", "xpReward": 3, "options": ["Nom", "Verbe", "Adjectif", "Autre"], "correctIndex": 1, "explanation": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e est un verbe au pass\\u00e9 \\u2014 'il a \\u00e9crit'."}]}
7	1	Vocabulaire élargi — noms, verbes, adjectifs	mots	30	25	7	{"introduction": {"text": "D\\u00e9couvrez plus de mots. Notez leur nature : nom (\\u0627\\u0633\\u0645), verbe (\\u0641\\u0639\\u0644). Cliquez pour entendre.", "words": [{"ar": "\\u0643\\u064f\\u062a\\u064f\\u0628\\u064c", "phoneme": "kutubun", "translation": "Des livres", "type": "nom", "audio": "/assets/audio/words/kutub.mp3", "image": "/assets/images/words/kutub.jpg"}, {"ar": "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "phoneme": "kaatibun", "translation": "\\u00c9crivain", "type": "nom", "audio": "/assets/audio/words/katib.mp3", "image": "/assets/images/words/katib.jpg"}, {"ar": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064e\\u0629\\u064c", "phoneme": "maktabatun", "translation": "Biblioth\\u00e8que", "type": "nom", "audio": "/assets/audio/words/maktaba.mp3", "image": "/assets/images/words/maktaba.jpg"}, {"ar": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064e\\u0629\\u064c", "phoneme": "kitaabatun", "translation": "\\u00c9criture", "type": "nom", "audio": "/assets/audio/words/kitaba_nom.mp3", "image": "/assets/images/words/kitaba_nom.jpg"}, {"ar": "\\u0628\\u064e\\u0627\\u0628\\u064e\\u0627", "phoneme": "baaba", "translation": "Papa", "type": "nom", "audio": "/assets/audio/words/baba.mp3", "image": "/assets/images/words/baba.jpg"}, {"ar": "\\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "phoneme": "katkuutun", "translation": "Poussin", "type": "nom", "audio": "/assets/audio/words/katkut.mp3", "image": "/assets/images/words/katkut.jpg"}, {"ar": "\\u0645\\u064e\\u0627\\u062a\\u064e", "phoneme": "maata", "translation": "Il est mort", "type": "verbe", "audio": "/assets/audio/words/mata.mp3", "image": "/assets/images/words/mata.jpg"}, {"ar": "\\u0628\\u064e\\u0627\\u062a\\u064e", "phoneme": "baata", "translation": "Il a pass\\u00e9 la nuit", "type": "verbe", "audio": "/assets/audio/words/bata.mp3", "image": "/assets/images/words/bata.jpg"}, {"ar": "\\u062a\\u064e\\u0645\\u064e\\u0651", "phoneme": "tamma", "translation": "Il a \\u00e9t\\u00e9 achev\\u00e9", "type": "verbe", "audio": "/assets/audio/words/tamma.mp3", "image": "/assets/images/words/tamma.jpg"}, {"ar": "\\u0643\\u064e\\u062a\\u064e\\u0645\\u064e", "phoneme": "katama", "translation": "Il a cach\\u00e9", "type": "verbe", "audio": "/assets/audio/words/katam.mp3", "image": "/assets/images/words/katam.jpg"}, {"ar": "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652", "phoneme": "bakat", "translation": "Elle a pleur\\u00e9", "type": "verbe", "audio": "/assets/audio/words/bakat.mp3", "image": "/assets/images/words/bakat.jpg"}]}, "passing_score": 0.8, "exercises": [{"id": "m1l7_ex1", "type": "mcq", "skill_id": "word_comprehension", "prompt": "Que signifie \\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064e\\u0629\\u064c ?", "promptAr": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064e\\u0629\\u064c", "xpReward": 4, "options": ["Bureau", "Livre", "Biblioth\\u00e8que", "\\u00c9criture"], "correctIndex": 2, "explanation": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064e\\u0629\\u064c = maktabatun = biblioth\\u00e8que."}, {"id": "m1l7_ex2", "type": "matching", "skill_id": "word_comprehension", "prompt": "Associez les mots \\u00e0 leurs traductions", "xpReward": 8, "pairs": [{"ar": "\\u0645\\u064e\\u0627\\u062a\\u064e", "fr": "Il est mort"}, {"ar": "\\u0628\\u064e\\u0627\\u062a\\u064e", "fr": "Il a pass\\u00e9 la nuit"}, {"ar": "\\u062a\\u064e\\u0645\\u064e\\u0651", "fr": "Il a \\u00e9t\\u00e9 achev\\u00e9"}, {"ar": "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652", "fr": "Elle a pleur\\u00e9"}], "shuffledFr": ["Il a pass\\u00e9 la nuit", "Il est mort", "Elle a pleur\\u00e9", "Il a \\u00e9t\\u00e9 achev\\u00e9"]}, {"id": "m1l7_ex3", "type": "mcq", "skill_id": "word_comprehension", "prompt": "Quelle est la nature du mot \\u0643\\u0627\\u062a\\u0650\\u0628\\u064c ?", "promptAr": "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "xpReward": 3, "options": ["Verbe", "Nom", "Adjectif", "Autre"], "correctIndex": 1, "explanation": "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c = kaatibun = \\u00e9crivain \\u2014 c'est un nom."}, {"id": "m1l7_ex4", "type": "audio_choice", "skill_id": "word_reading", "prompt": "\\u00c9coutez et identifiez le mot", "audioUrl": "/assets/audio/words/katkut.mp3", "xpReward": 5, "options": ["\\u0643\\u064f\\u062a\\u064f\\u0628\\u064c", "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "\\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064e\\u0629\\u064c"], "correctIndex": 2, "explanation": "\\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c = katkuutun = poussin."}, {"id": "m1l7_ex5", "type": "mcq", "skill_id": "word_comprehension", "prompt": "Quel mot signifie 'Il a cach\\u00e9' ?", "promptAr": null, "xpReward": 4, "options": ["\\u0645\\u064e\\u0627\\u062a\\u064e", "\\u0628\\u064e\\u0627\\u062a\\u064e", "\\u0643\\u064e\\u062a\\u064e\\u0645\\u064e", "\\u062a\\u064e\\u0645\\u064e\\u0651"], "correctIndex": 2, "explanation": "\\u0643\\u064e\\u062a\\u064e\\u0645\\u064e = katama = il a cach\\u00e9."}, {"id": "m1l7_ex6", "type": "mcq", "skill_id": "word_comprehension", "prompt": "Parmi ces mots, lequel est un verbe ?", "promptAr": null, "xpReward": 3, "options": ["\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "\\u0628\\u064e\\u0627\\u062a\\u064e", "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064e\\u0629\\u064c"], "correctIndex": 2, "explanation": "\\u0628\\u064e\\u0627\\u062a\\u064e = baata = il a pass\\u00e9 la nuit \\u2014 c'est un verbe."}]}
8	1	Écriture — clavier et tracé	ecriture_clavier	30	25	8	{"introduction": {"text": "Entra\\u00eenez-vous \\u00e0 \\u00e9crire les lettres et mots en arabe. Activez le clavier arabe sur votre appareil (Windows : Alt+Shift)."}, "passing_score": 0.8, "exercises": [{"id": "m1l8_ex1", "type": "input_text", "skill_id": "word_writing", "prompt": "\\u00c9crivez la lettre Mim", "xpReward": 3, "acceptedAnswers": ["\\u0645"], "explanation": "\\u0645 = Mim."}, {"id": "m1l8_ex2", "type": "input_text", "skill_id": "word_writing", "prompt": "\\u00c9crivez la lettre Kaf", "xpReward": 3, "acceptedAnswers": ["\\u0643"], "explanation": "\\u0643 = Kaf."}, {"id": "m1l8_ex3", "type": "input_text", "skill_id": "word_writing", "prompt": "\\u00c9crivez le mot 'bureau' en arabe (sans voyelles)", "xpReward": 6, "acceptedAnswers": ["\\u0645\\u0643\\u062a\\u0628", "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "\\u0645\\u0643\\u062a\\u0628\\u064c"], "explanation": "\\u0645\\u0643\\u062a\\u0628 = maktab = bureau."}, {"id": "m1l8_ex4", "type": "input_text", "skill_id": "word_writing", "prompt": "\\u00c9crivez le mot 'livre' en arabe (sans voyelles)", "xpReward": 6, "acceptedAnswers": ["\\u0643\\u062a\\u0627\\u0628", "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c", "\\u0643\\u062a\\u0627\\u0628\\u064c"], "explanation": "\\u0643\\u062a\\u0627\\u0628 = kitaab = livre."}, {"id": "m1l8_ex5", "type": "input_text", "skill_id": "word_writing", "prompt": "\\u00c9crivez le mot 'porte' en arabe", "xpReward": 5, "acceptedAnswers": ["\\u0628\\u0627\\u0628", "\\u0628\\u064e\\u0627\\u0628\\u064c", "\\u0628\\u0627\\u0628\\u064c"], "explanation": "\\u0628\\u0627\\u0628 = baab = porte."}, {"id": "m1l8_ex6", "type": "drawing", "skill_id": "word_writing", "prompt": "Tracez la lettre \\u0628 (Ba) isol\\u00e9e", "promptAr": "\\u0628", "xpReward": 5, "letter": "\\u0628", "strokes": 2, "hint": "La coque horizontale puis le point en dessous."}, {"id": "m1l8_ex7", "type": "drawing", "skill_id": "word_writing", "prompt": "Tracez la lettre \\u0645 (Mim) isol\\u00e9e", "promptAr": "\\u0645", "xpReward": 5, "letter": "\\u0645", "strokes": 1, "hint": "Cercle puis queue vers le bas."}, {"id": "m1l8_ex8", "type": "input_text", "skill_id": "word_writing", "prompt": "\\u00c9crivez 'il a \\u00e9crit' en arabe", "xpReward": 6, "acceptedAnswers": ["\\u0643\\u062a\\u0628", "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e", "\\u0643\\u062a\\u0628\\u064e"], "explanation": "\\u0643\\u062a\\u0628 = kataba = il a \\u00e9crit."}]}
9	1	Construire des mots — drag & drop	exercices	30	20	9	{"passing_score": 0.8, "exercises": [{"id": "m1l9_ex1", "type": "drag_drop", "skill_id": "word_building", "prompt": "Assemblez les lettres pour former le mot 'bureau'", "letters": ["\\u0645\\u0640", "\\u0640\\u0643\\u0640", "\\u0640\\u062a\\u0640", "\\u0640\\u0628"], "correctWord": "\\u0645\\u0643\\u062a\\u0628", "targetLength": 4, "xpReward": 8, "explanation": "\\u0645\\u0643\\u062a\\u0628 = \\u0645 + \\u0643 + \\u062a + \\u0628 = bureau.", "audioUrl": "/assets/audio/words/maktab.mp3"}, {"id": "m1l9_ex2", "type": "drag_drop", "skill_id": "word_building", "prompt": "Assemblez les lettres pour former 'livre'", "letters": ["\\u0643\\u0640", "\\u0640\\u062a\\u0640", "\\u0640\\u0627", "\\u0640\\u0628"], "correctWord": "\\u0643\\u062a\\u0627\\u0628", "targetLength": 4, "xpReward": 8, "explanation": "\\u0643\\u062a\\u0627\\u0628 = \\u0643 + \\u062a + \\u0627 + \\u0628 = livre.", "audioUrl": "/assets/audio/words/kitab.mp3"}, {"id": "m1l9_ex3", "type": "mcq", "skill_id": "word_building", "prompt": "Quelle lettre manque pour compl\\u00e9ter ce mot ?", "prompts": ["Quelle lettre manque pour compl\\u00e9ter ce mot ?", "Compl\\u00e9tez le mot \\u2014 quelle lettre manque ?", "Trouvez la lettre manquante"], "promptAr": "\\u0643\\u0650\\u25a1\\u064e\\u0627\\u0628\\u064c", "xpReward": 6, "options": ["\\u0640\\u062a\\u0640 (m\\u00e9diane)", "\\u0640\\u0628\\u0640 (m\\u00e9diane)", "\\u0640\\u0645\\u0640 (m\\u00e9diane)", "\\u0640\\u0643\\u0640 (m\\u00e9diane)"], "correctIndex": 0, "explanation": "\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u064c = livre. La lettre \\u062a est au milieu \\u2192 forme m\\u00e9diane \\u0640\\u062a\\u0640."}, {"id": "m1l9_ex4", "type": "mcq", "skill_id": "word_building", "prompt": "Quelle lettre manque pour compl\\u00e9ter ce mot ?", "prompts": ["Quelle lettre manque pour compl\\u00e9ter ce mot ?", "Compl\\u00e9tez le mot \\u2014 quelle lettre manque ?", "Trouvez la lettre manquante"], "promptAr": "\\u0645\\u064e\\u0643\\u0652\\u25a1\\u064e\\u0628\\u064c", "xpReward": 6, "options": ["\\u0640\\u0628\\u0640 (m\\u00e9diane)", "\\u0640\\u062a\\u0640 (m\\u00e9diane)", "\\u0640\\u0645\\u0640 (m\\u00e9diane)", "\\u0640\\u0643\\u0640 (m\\u00e9diane)"], "correctIndex": 1, "explanation": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c = bureau. La lettre \\u062a est au milieu \\u2192 forme m\\u00e9diane \\u0640\\u062a\\u0640."}, {"id": "m1l9_ex5", "type": "drag_drop", "skill_id": "word_building", "prompt": "Assemblez les lettres pour former 'maison'", "letters": ["\\u0628\\u0640", "\\u0640\\u064a\\u0640", "\\u0640\\u062a"], "correctWord": "\\u0628\\u064a\\u062a", "targetLength": 3, "xpReward": 7, "explanation": "\\u0628\\u064a\\u062a = \\u0628 + \\u064a + \\u062a = maison.", "audioUrl": "/assets/audio/words/bayt.mp3"}, {"id": "m1l9_ex6", "type": "mcq", "skill_id": "word_building", "prompt": "Dans \\u0628\\u064e\\u0627\\u0628\\u064c, quelle est la forme du second \\u0628 (en fin de mot) ?", "promptAr": "\\u0628\\u064e\\u0627\\u0628\\u064c", "xpReward": 5, "options": ["\\u0628\\u0640 (initiale)", "\\u0640\\u0628\\u0640 (m\\u00e9diane)", "\\u0640\\u0628 (finale)", "\\u0628 (isol\\u00e9e)"], "correctIndex": 2, "explanation": "Le second \\u0628 dans \\u0628\\u064e\\u0627\\u0628\\u064c est en position finale \\u2014 forme \\u0640\\u0628."}]}
10	1	Phrases simples — lire et comprendre	lecture_phrase	35	25	10	{"introduction": {"text": "Lisez ces phrases construites avec les mots du module. Cliquez pour entendre la lecture.", "words": [{"ar": "\\u0645\\u064e\\u0627\\u062a\\u064e \\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "phoneme": "maata katkuutun", "translation": "Un poussin est mort", "type": "phrase", "audio": "/assets/audio/phrases/mata_katkut.mp3"}, {"ar": "\\u0628\\u064e\\u0627\\u062a\\u064e \\u0628\\u064f\\u0648\\u0628\\u0650\\u064a \\u0628\\u0650\\u0628\\u064e\\u0627\\u0628\\u0650\\u064a", "phoneme": "baata buubi bibaabi", "translation": "Bobi a pass\\u00e9 la nuit \\u00e0 ma porte", "type": "phrase", "audio": "/assets/audio/phrases/bata_bubi.mp3"}, {"ar": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e \\u0643\\u0627\\u062a\\u0650\\u0628\\u064c \\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u0627\\u064b", "phoneme": "kataba kaatibun kitaaban", "translation": "Un \\u00e9crivain a \\u00e9crit un livre", "type": "phrase", "audio": "/assets/audio/phrases/kataba_katib.mp3"}, {"ar": "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652 \\u0645\\u064e\\u0627\\u0645\\u064e\\u0627", "phoneme": "bakat maama", "translation": "Maman a pleur\\u00e9", "type": "phrase", "audio": "/assets/audio/phrases/bakat_mama.mp3"}]}, "passing_score": 0.8, "exercises": [{"id": "m1l10_ex1", "type": "audio_choice", "skill_id": "sentence_reading", "prompt": "\\u00c9coutez et identifiez la phrase", "audioUrl": "/assets/audio/phrases/bakat_mama.mp3", "xpReward": 6, "options": ["\\u0645\\u064e\\u0627\\u062a\\u064e \\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652 \\u0645\\u064e\\u0627\\u0645\\u064e\\u0627", "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e \\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "\\u0628\\u064e\\u0627\\u062a\\u064e \\u0628\\u064f\\u0648\\u0628\\u0650\\u064a"], "correctIndex": 1, "explanation": "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652 \\u0645\\u064e\\u0627\\u0645\\u064e\\u0627 = bakat maama = Maman a pleur\\u00e9."}, {"id": "m1l10_ex2", "type": "mcq", "skill_id": "sentence_reading", "prompt": "Que signifie \\u0645\\u064e\\u0627\\u062a\\u064e \\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c ?", "promptAr": "\\u0645\\u064e\\u0627\\u062a\\u064e \\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "xpReward": 5, "options": ["Un poussin a pleur\\u00e9", "Un poussin est mort", "Un poussin a \\u00e9crit", "Un poussin est n\\u00e9"], "correctIndex": 1, "explanation": "\\u0645\\u064e\\u0627\\u062a\\u064e = il est mort, \\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c = poussin."}, {"id": "m1l10_ex3", "type": "word_order", "skill_id": "sentence_reading", "prompt": "Remettez les mots dans l'ordre pour former la phrase : 'Maman a pleur\\u00e9'", "words": ["\\u0645\\u064e\\u0627\\u0645\\u064e\\u0627", "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652"], "correctSentence": "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652 \\u0645\\u064e\\u0627\\u0645\\u064e\\u0627", "audioUrl": "/assets/audio/phrases/bakat_mama.mp3", "xpReward": 7, "explanation": "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652 \\u0645\\u064e\\u0627\\u0645\\u064e\\u0627 \\u2014 le verbe vient avant le nom en arabe."}, {"id": "m1l10_ex4", "type": "word_order", "skill_id": "sentence_reading", "prompt": "Remettez les mots dans l'ordre : 'Un poussin est mort'", "words": ["\\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "\\u0645\\u064e\\u0627\\u062a\\u064e"], "correctSentence": "\\u0645\\u064e\\u0627\\u062a\\u064e \\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "audioUrl": "/assets/audio/phrases/mata_katkut.mp3", "xpReward": 7, "explanation": "\\u0645\\u064e\\u0627\\u062a\\u064e \\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c \\u2014 verbe + sujet."}, {"id": "m1l10_ex5", "type": "mcq", "skill_id": "sentence_reading", "prompt": "Quel mot manque dans cette phrase ?", "promptAr": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e ___ \\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u0627\\u064b", "xpReward": 6, "options": ["\\u0645\\u064e\\u0627\\u0645\\u064e\\u0627", "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "\\u0628\\u064e\\u0627\\u0628\\u064c", "\\u0628\\u064e\\u064a\\u0652\\u062a\\u064c"], "correctIndex": 1, "explanation": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e \\u0643\\u0627\\u062a\\u0650\\u0628\\u064c \\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u0627\\u064b = un \\u00e9crivain a \\u00e9crit un livre.", "prompts": ["Quel mot manque dans cette phrase ?", "Compl\\u00e9tez la phrase", "Trouvez le mot manquant"]}, {"id": "m1l10_ex6", "type": "matching", "skill_id": "sentence_reading", "prompt": "Associez chaque phrase \\u00e0 sa traduction", "xpReward": 8, "pairs": [{"ar": "\\u0628\\u064e\\u0643\\u064e\\u062a\\u0652 \\u0645\\u064e\\u0627\\u0645\\u064e\\u0627", "fr": "Maman a pleur\\u00e9"}, {"ar": "\\u0645\\u064e\\u0627\\u062a\\u064e \\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "fr": "Un poussin est mort"}], "shuffledFr": ["Un poussin est mort", "Maman a pleur\\u00e9"]}]}
11	1	Évaluation globale du Module 1	evaluation	60	30	11	{"description": "\\u00c9valuation finale du Module 1. Le syst\\u00e8me choisit les exercices selon votre profil \\u2014 il insiste sur ce que vous ma\\u00eetrisez moins.", "passing_score": 0.7, "exercises": [{"id": "m1l11_ex1", "type": "mcq", "skill_id": "letter_recognition", "prompt": "Identifiez la lettre", "promptAr": "\\u0643", "xpReward": 3, "options": ["Ba", "Mim", "Kaf", "Ta"], "correctIndex": 2, "explanation": "\\u0643 = Kaf."}, {"id": "m1l11_ex2", "type": "audio_choice", "skill_id": "harakat_reading", "prompt": "\\u00c9coutez et identifiez", "audioUrl": "/assets/audio/syllables/mim_fatha.mp3", "xpReward": 4, "options": ["\\u0645\\u064e", "\\u0645\\u0650", "\\u0645\\u064f", "\\u0645\\u0652"], "correctIndex": 0, "explanation": "\\u0645\\u064e = ma \\u2014 fatha."}, {"id": "m1l11_ex3", "type": "mcq", "skill_id": "long_vowels", "prompt": "Comment se prononce \\u0643\\u064f\\u0648\\u0628\\u064c ?", "promptAr": "\\u0643\\u064f\\u0648\\u0628\\u064c", "xpReward": 4, "options": ["kabun", "kuubun", "kibun", "kaabun"], "correctIndex": 1, "explanation": "\\u0643\\u064f\\u0648\\u0628\\u064c = kuubun \\u2014 damma + waw = 'uu'."}, {"id": "m1l11_ex4", "type": "mcq", "skill_id": "tanwin", "prompt": "Que signifie \\u064c \\u00e0 la fin d'un mot ?", "promptAr": "\\u0628\\u064c", "xpReward": 4, "options": ["son 'a'", "son 'in'", "son 'oun'", "pas de son"], "correctIndex": 2, "explanation": "\\u064c = tanw\\u012bn damm \\u2192 son 'oun'."}, {"id": "m1l11_ex5", "type": "mcq", "skill_id": "letter_positions", "prompt": "Position de \\u0628 dans \\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "promptAr": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064c", "xpReward": 5, "options": ["Initiale", "M\\u00e9diane", "Finale", "Isol\\u00e9e"], "correctIndex": 2, "explanation": "\\u0628 est \\u00e0 la fin \\u2014 forme finale \\u0640\\u0628."}, {"id": "m1l11_ex6", "type": "audio_choice", "skill_id": "word_reading", "prompt": "\\u00c9coutez et identifiez le mot", "audioUrl": "/assets/audio/words/bayt.mp3", "xpReward": 5, "options": ["\\u0628\\u064e\\u0627\\u0628\\u064c", "\\u0628\\u064e\\u064a\\u0652\\u062a\\u064c", "\\u0628\\u064f\\u0648\\u0645\\u064e\\u0629\\u064c", "\\u0628\\u064e\\u0627\\u0628\\u064e\\u0627"], "correctIndex": 1, "explanation": "\\u0628\\u064e\\u064a\\u0652\\u062a\\u064c = baytun = maison."}, {"id": "m1l11_ex7", "type": "matching", "skill_id": "word_comprehension", "prompt": "Associez les mots \\u00e0 leurs traductions", "xpReward": 8, "pairs": [{"ar": "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "fr": "\\u00c9crivain"}, {"ar": "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064e\\u0629\\u064c", "fr": "Biblioth\\u00e8que"}, {"ar": "\\u0643\\u064e\\u062a\\u0652\\u0643\\u064f\\u0648\\u062a\\u064c", "fr": "Poussin"}], "shuffledFr": ["Poussin", "\\u00c9crivain", "Biblioth\\u00e8que"]}, {"id": "m1l11_ex8", "type": "input_text", "skill_id": "word_writing", "prompt": "\\u00c9crivez 'biblioth\\u00e8que' en arabe", "xpReward": 6, "acceptedAnswers": ["\\u0645\\u0643\\u062a\\u0628\\u0629", "\\u0645\\u064e\\u0643\\u0652\\u062a\\u064e\\u0628\\u064e\\u0629\\u064c", "\\u0645\\u0643\\u062a\\u0628\\u0629\\u064c"], "explanation": "\\u0645\\u0643\\u062a\\u0628\\u0629 = maktabatun = biblioth\\u00e8que."}, {"id": "m1l11_ex9", "type": "word_order", "skill_id": "sentence_reading", "prompt": "Remettez dans l'ordre : 'Un \\u00e9crivain a \\u00e9crit un livre'", "words": ["\\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u0627\\u064b", "\\u0643\\u0627\\u062a\\u0650\\u0628\\u064c", "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e"], "correctSentence": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e \\u0643\\u0627\\u062a\\u0650\\u0628\\u064c \\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u0627\\u064b", "audioUrl": "/assets/audio/phrases/kataba_katib.mp3", "xpReward": 8, "explanation": "\\u0643\\u064e\\u062a\\u064e\\u0628\\u064e \\u0643\\u0627\\u062a\\u0650\\u0628\\u064c \\u0643\\u0650\\u062a\\u064e\\u0627\\u0628\\u0627\\u064b \\u2014 verbe + sujet + objet."}, {"id": "m1l11_ex10", "type": "drag_drop", "skill_id": "word_building", "prompt": "Assemblez les lettres pour former 'poussin'", "letters": ["\\u0643\\u0640", "\\u0640\\u062a\\u0640", "\\u0640\\u0643\\u064f\\u0648", "\\u0640\\u062a"], "correctWord": "\\u0643\\u062a\\u0643\\u0648\\u062a", "targetLength": 4, "xpReward": 7, "explanation": "\\u0643\\u062a\\u0643\\u0648\\u062a = katkuut = poussin.", "audioUrl": "/assets/audio/words/katkut.mp3"}]}
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: arabiq
--

COPY public.modules (id, slug, title, description, arabic_ratio, sort_order, is_premium) FROM stdin;
1	maktab	Module 1 — مَكْتَبٌ	Les lettres م ك ت ب avec ا و ي comme voyelles longues. Premiers mots et phrases simples.	0.3	1	f
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
d8cc2381-e41b-42bf-bfd7-910a78d97dbd	superadmin@arabiq.com	superadmin	$2b$12$rZHQ256AKWggMfeTuegxS.6iDrkdgc7LTyr3yGGZ6ihvA0xedWuzK	fr	\N	0	1	0	0	\N	f	t	t	t	2026-04-21 11:45:05.31686+02	2026-04-21 11:45:05.31686+02	superadmin	[]
e5c15073-a411-4386-a73a-fb553d9c8cca	admin@arabiq.com	admin	$2b$12$MP6WRUIBmTMx6xEjOVE5keBABHb61AY9gkIoErHISrfWvewnRYx1S	fr	\N	301	1	0	0	\N	f	t	t	t	2026-04-19 23:29:59.671268+02	2026-04-20 23:32:07.679717+02	admin	[]
040041cc-fd61-4a48-8486-81d41d500299	gaziz60@hotmail.com	Aziz	$2b$12$nmtABCcMbAdQcqouv0aPeOVEKgCwbddAf6YhzYQyfinQqg9tLPK/G	fr	\N	152	1	0	0	\N	f	f	t	f	2026-04-21 13:31:28.762902+02	2026-04-22 18:21:12.903886+02	student	[]
2802ac9e-bc25-4edf-9a0b-5f510c5005e3	aziz60@hotmail.com	Nizar	$2b$12$yjTPdSS5fAlzhyfnxRjmpeBLFBtZpFMBqrmrBEYUty2MK81dSK2NO	fr	\N	57	1	0	0	\N	f	f	t	f	2026-04-23 13:04:24.614557+02	2026-04-23 14:52:20.966399+02	student	[]
\.


--
-- Name: admin_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: arabiq
--

SELECT pg_catalog.setval('public.admin_roles_id_seq', 1, false);


--
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: arabiq
--

SELECT pg_catalog.setval('public.courses_id_seq', 1, true);


--
-- Name: lessons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: arabiq
--

SELECT pg_catalog.setval('public.lessons_id_seq', 11, true);


--
-- Name: modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: arabiq
--

SELECT pg_catalog.setval('public.modules_id_seq', 1, false);


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

\unrestrict HjWfb1LWsIlJj3YrvGYYhxrrI8pI05doMXxjH644ngRmjbDhMsw9z3WSUeoZcNM


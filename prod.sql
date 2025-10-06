--
-- PostgreSQL database dump from Supabase
--

-- Dumped from database version 15.6
-- Dumped by pg_dump version 15.12 (Homebrew)

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
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: pgtle; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA pgtle;


ALTER SCHEMA pgtle OWNER TO supabase_admin;

--
-- Name: pg_tle; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_tle WITH SCHEMA pgtle;


--
-- Name: EXTENSION pg_tle; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_tle IS 'Trusted Language Extensions for PostgreSQL';


--
-- Name: supabase-dbdev; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "supabase-dbdev" WITH SCHEMA public;


--
-- Name: EXTENSION "supabase-dbdev"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "supabase-dbdev" IS 'PostgreSQL package manager';


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: keycloak; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA keycloak;


ALTER SCHEMA keycloak OWNER TO postgres;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: pgsodium; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA pgsodium;


ALTER SCHEMA pgsodium OWNER TO supabase_admin;

--
-- Name: pgsodium; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgsodium WITH SCHEMA pgsodium;


--
-- Name: EXTENSION pgsodium; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgsodium IS 'Pgsodium is a modern cryptography library for Postgres.';


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA supabase_migrations;


ALTER SCHEMA supabase_migrations OWNER TO postgres;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: http; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;


--
-- Name: EXTENSION http; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION http IS 'HTTP client for PostgreSQL, allows web page retrieval inside the database.';


--
-- Name: hypopg; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS hypopg WITH SCHEMA public;


--
-- Name: EXTENSION hypopg; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION hypopg IS 'Hypothetical indexes for PostgreSQL';


--
-- Name: index_advisor; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS index_advisor WITH SCHEMA extensions;


--
-- Name: EXTENSION index_advisor; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION index_advisor IS 'Query index advisor';


--
-- Name: olirice-index_advisor; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "olirice-index_advisor" WITH SCHEMA public;


--
-- Name: EXTENSION "olirice-index_advisor"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "olirice-index_advisor" IS 'olirice-index_advisor';


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: pgjwt; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;


--
-- Name: EXTENSION pgjwt; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgjwt IS 'JSON Web Token API for Postgresql';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: LLMProvider; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LLMProvider" AS ENUM (
    'Azure',
    'OpenAI',
    'Anthropic',
    'Ollama',
    'NCSAHosted',
    'WebLLM',
    'null'
);


ALTER TYPE public."LLMProvider" OWNER TO postgres;

--
-- Name: TYPE "LLMProvider"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public."LLMProvider" IS 'One of "azure", "openai", "anthropic", "google"... etc.';


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: postgres
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;
    grant all on all functions in schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO postgres;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: postgres
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: postgres
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM pg_event_trigger_ddl_commands() AS ev
      JOIN pg_extension AS ext
      ON ev.objid = ext.oid
      WHERE ext.extname = 'pg_net'
    )
    THEN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = 'supabase_functions_admin'
      )
      THEN
        CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
      END IF;

      GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

      IF EXISTS (
        SELECT FROM pg_extension
        WHERE extname = 'pg_net'
        -- all versions in use on existing projects as of 2025-02-20
        -- version 0.12.0 onwards don't need these applied
        AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8.0', '0.10.0', '0.11.0')
      ) THEN
        ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
        ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

        ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
        ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

        REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
        REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

        GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
        GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      END IF;
    END IF;
  END;
  $$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO postgres;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: postgres
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: postgres
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RAISE WARNING 'PgBouncer auth request: %', p_usename;

    RETURN QUERY
    SELECT usename::TEXT, passwd::TEXT FROM pg_catalog.pg_shadow
    WHERE usename = p_usename;
END;
$$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO postgres;

--
-- Name: olirice-index_advisor--0.1.0.sql(); Type: FUNCTION; Schema: pgtle; Owner: postgres
--

CREATE FUNCTION pgtle."olirice-index_advisor--0.1.0.sql"() RETURNS text
    LANGUAGE sql
    AS $_X$SELECT $_pgtle_i_$


-- Enforce requirements
-- Workaround to https://github.com/aws/pg_tle/issues/183
do $$
    declare
        hypopg_exists boolean = exists(
            select 1
            from pg_available_extensions
            where
                name = 'hypopg'
                and installed_version is not null
        );
    begin

        if not hypopg_exists then
            raise
                exception '"olirice-index_advisor" requires "hypopg"'
                using hint = 'Run "create extension hypopg" and try again';
        end if;
    end
$$;


create type index_advisor_output as (
    index_statements text[],
    startup_cost_before jsonb,
    startup_cost_after jsonb,
    total_cost_before jsonb,
    total_cost_after jsonb
);

create function index_advisor(
    query text
)
    returns table  (
        startup_cost_before jsonb,
        startup_cost_after jsonb,
        total_cost_before jsonb,
        total_cost_after jsonb,
        index_statements text[]
    )
    volatile
    language plpgsql
    as $$
declare
    n_args int;
    prepared_statement_name text = 'index_advisor_working_statement';
    hypopg_schema_name text = (select extnamespace::regnamespace::text from pg_extension where extname = 'hypopg');
    explain_plan_statement text;
    rec record;
    plan_initial jsonb;
    plan_final jsonb;
    statements text[] = '{}';
begin

    -- Disallow multiple statements
    if query ilike '%;%' then
        raise exception 'query must not contain a semicolon';
    end if;

    -- Hack to support PostgREST because the prepared statement for args incorrectly defaults to text
    query := replace(query, 'WITH pgrst_payload AS (SELECT $1 AS json_data)', 'WITH pgrst_payload AS (SELECT $1::json AS json_data)');

    -- Create a prepared statement for the given query
    deallocate all;
    execute format('prepare %I as %s', prepared_statement_name, query);

    -- Detect how many arguments are present in the prepared statement
    n_args = (
        select
            coalesce(array_length(parameter_types, 1), 0)
        from
            pg_prepared_statements
        where
            name = prepared_statement_name
        limit
            1
    );

    -- Create a SQL statement that can be executed to collect the explain plan
    explain_plan_statement = format(
        'set local plan_cache_mode = force_generic_plan; explain (format json) execute %I%s',
        --'explain (format json) execute %I%s',
        prepared_statement_name,
        case
            when n_args = 0 then ''
            else format(
                '(%s)', array_to_string(array_fill('null'::text, array[n_args]), ',')
            )
        end
    );

    -- Store the query plan before any new indexes
    execute explain_plan_statement into plan_initial;

    -- Create possible indexes
    for rec in (
        with extension_regclass as (
            select
                distinct objid as oid
            from
                pg_depend
            where
                deptype = 'e'
        )
        select
            pc.relnamespace::regnamespace::text as schema_name,
            pc.relname as table_name,
            pa.attname as column_name,
            format(
                'select %I.hypopg_create_index($i$create index on %I.%I(%I)$i$)',
                hypopg_schema_name,
                pc.relnamespace::regnamespace::text,
                pc.relname,
                pa.attname
            ) hypopg_statement
        from
            pg_catalog.pg_class pc
            join pg_catalog.pg_attribute pa
                on pc.oid = pa.attrelid
            left join extension_regclass er
                on pc.oid = er.oid
            left join pg_index pi
                on pc.oid = pi.indrelid
                and (select array_agg(x) from unnest(pi.indkey) v(x)) = array[pa.attnum]
                and pi.indexprs is null -- ignore expression indexes
                and pi.indpred is null -- ignore partial indexes
        where
            pc.relnamespace::regnamespace::text not in ( -- ignore schema list
                'pg_catalog', 'pg_toast', 'information_schema'
            )
            and er.oid is null -- ignore entities owned by extensions
            and pc.relkind in ('r', 'm') -- regular tables, and materialized views
            and pc.relpersistence = 'p' -- permanent tables (not unlogged or temporary)
            and pa.attnum > 0
            and not pa.attisdropped
            and pi.indrelid is null
            and pa.atttypid in (20,16,1082,1184,1114,701,23,21,700,1083,2950,1700,25,18,1042,1043)
        )
        loop
            -- Create the hypothetical index
            execute rec.hypopg_statement;
        end loop;

    -- Create a prepared statement for the given query
    -- The original prepared statement MUST be dropped because its plan is cached
    execute format('deallocate %I', prepared_statement_name);
    execute format('prepare %I as %s', prepared_statement_name, query);

    -- Store the query plan after new indexes
    execute explain_plan_statement into plan_final;


    -- Idenfity referenced indexes in new plan
    execute format(
        'select
            coalesce(array_agg(hypopg_get_indexdef(indexrelid) order by indrelid, indkey::text), $i${}$i$::text[])
        from
            %I.hypopg()
        where
            %s ilike ($i$%%$i$ || indexname || $i$%%$i$)
        ',
        hypopg_schema_name,
        quote_literal(plan_final)::text
    ) into statements;

    -- Reset all hypothetical indexes
    perform hypopg_reset();

    -- Reset prepared statements
    deallocate all;

    return query values (
        (plan_initial -> 0 -> 'Plan' -> 'Startup Cost'),
        (plan_final -> 0 -> 'Plan' -> 'Startup Cost'),
        (plan_initial -> 0 -> 'Plan' -> 'Total Cost'),
        (plan_final -> 0 -> 'Plan' -> 'Total Cost'),
        statements::text[]
    );

end;
$$;

$_pgtle_i_$$_X$;


ALTER FUNCTION pgtle."olirice-index_advisor--0.1.0.sql"() OWNER TO postgres;

--
-- Name: olirice-index_advisor--0.2.0.sql(); Type: FUNCTION; Schema: pgtle; Owner: postgres
--

CREATE FUNCTION pgtle."olirice-index_advisor--0.2.0.sql"() RETURNS text
    LANGUAGE sql
    AS $_X$SELECT $_pgtle_i_$

-- Enforce requirements
-- Workaround to https://github.com/aws/pg_tle/issues/183
do $$
    declare
        hypopg_exists boolean = exists(
            select 1
            from pg_available_extensions
            where
                name = 'hypopg'
                and installed_version is not null
        );
    begin

        if not hypopg_exists then
            raise
                exception '"olirice-index_advisor" requires "hypopg"'
                using hint = 'Run "create extension hypopg" and try again';
        end if;
    end
$$;

create or replace function index_advisor(
    query text
)
    returns table  (
        startup_cost_before jsonb,
        startup_cost_after jsonb,
        total_cost_before jsonb,
        total_cost_after jsonb,
        index_statements text[],
        errors text[]
    )
    volatile
    language plpgsql
    as $$
declare
    n_args int;
    prepared_statement_name text = 'index_advisor_working_statement';
    hypopg_schema_name text = (select extnamespace::regnamespace::text from pg_extension where extname = 'hypopg');
    explain_plan_statement text;
    error_message text;
    rec record;
    plan_initial jsonb;
    plan_final jsonb;
    statements text[] = '{}';
begin

    -- Remove comment lines (its common that they contain semicolons)
    query := trim(
        regexp_replace(
            regexp_replace(
                regexp_replace(query,'\/\*.+\*\/', '', 'g'),
            '--[^\r\n]*', ' ', 'g'),
        '\s+', ' ', 'g')
    );

    -- Remove trailing semicolon
    query := regexp_replace(query, ';\s*$', '');

    begin
        -- Disallow multiple statements
        if query ilike '%;%' then
            raise exception 'Query must not contain a semicolon';
        end if;

        -- Hack to support PostgREST because the prepared statement for args incorrectly defaults to text
        query := replace(query, 'WITH pgrst_payload AS (SELECT $1 AS json_data)', 'WITH pgrst_payload AS (SELECT $1::json AS json_data)');

        -- Create a prepared statement for the given query
        deallocate all;
        execute format('prepare %I as %s', prepared_statement_name, query);

        -- Detect how many arguments are present in the prepared statement
        n_args = (
            select
                coalesce(array_length(parameter_types, 1), 0)
            from
                pg_prepared_statements
            where
                name = prepared_statement_name
            limit
                1
        );

        -- Create a SQL statement that can be executed to collect the explain plan
        explain_plan_statement = format(
            'set local plan_cache_mode = force_generic_plan; explain (format json) execute %I%s',
            --'explain (format json) execute %I%s',
            prepared_statement_name,
            case
                when n_args = 0 then ''
                else format(
                    '(%s)', array_to_string(array_fill('null'::text, array[n_args]), ',')
                )
            end
        );

        -- Store the query plan before any new indexes
        execute explain_plan_statement into plan_initial;

        -- Create possible indexes
        for rec in (
            with extension_regclass as (
                select
                    distinct objid as oid
                from
                    pg_catalog.pg_depend
                where
                    deptype = 'e'
            )
            select
                pc.relnamespace::regnamespace::text as schema_name,
                pc.relname as table_name,
                pa.attname as column_name,
                format(
                    'select %I.hypopg_create_index($i$create index on %I.%I(%I)$i$)',
                    hypopg_schema_name,
                    pc.relnamespace::regnamespace::text,
                    pc.relname,
                    pa.attname
                ) hypopg_statement
            from
                pg_catalog.pg_class pc
                join pg_catalog.pg_attribute pa
                    on pc.oid = pa.attrelid
                left join extension_regclass er
                    on pc.oid = er.oid
                left join pg_catalog.pg_index pi
                    on pc.oid = pi.indrelid
                    and (select array_agg(x) from unnest(pi.indkey) v(x)) = array[pa.attnum]
                    and pi.indexprs is null -- ignore expression indexes
                    and pi.indpred is null -- ignore partial indexes
            where
                pc.relnamespace::regnamespace::text not in ( -- ignore schema list
                    'pg_catalog', 'pg_toast', 'information_schema'
                )
                and er.oid is null -- ignore entities owned by extensions
                and pc.relkind in ('r', 'm') -- regular tables, and materialized views
                and pc.relpersistence = 'p' -- permanent tables (not unlogged or temporary)
                and pa.attnum > 0
                and not pa.attisdropped
                and pi.indrelid is null
                and pa.atttypid in (20,16,1082,1184,1114,701,23,21,700,1083,2950,1700,25,18,1042,1043)
            )
            loop
                -- Create the hypothetical index
                execute rec.hypopg_statement;
            end loop;

        -- Create a prepared statement for the given query
        -- The original prepared statement MUST be dropped because its plan is cached
        execute format('deallocate %I', prepared_statement_name);
        execute format('prepare %I as %s', prepared_statement_name, query);

        -- Store the query plan after new indexes
        execute explain_plan_statement into plan_final;

        --raise notice '%', plan_final;

        -- Idenfity referenced indexes in new plan
        execute format(
            'select
                coalesce(array_agg(hypopg_get_indexdef(indexrelid) order by indrelid, indkey::text), $i${}$i$::text[])
            from
                %I.hypopg()
            where
                %s ilike ($i$%%$i$ || indexname || $i$%%$i$)
            ',
            hypopg_schema_name,
            quote_literal(plan_final)::text
        ) into statements;

        -- Reset all hypothetical indexes
        perform hypopg_reset();

        -- Reset prepared statements
        deallocate all;

        return query values (
            (plan_initial -> 0 -> 'Plan' -> 'Startup Cost'),
            (plan_final -> 0 -> 'Plan' -> 'Startup Cost'),
            (plan_initial -> 0 -> 'Plan' -> 'Total Cost'),
            (plan_final -> 0 -> 'Plan' -> 'Total Cost'),
            statements::text[],
            array[]::text[]
        );
        return;

    exception when others then
        get stacked diagnostics error_message = MESSAGE_TEXT;

        return query values (
            null::jsonb,
            null::jsonb,
            null::jsonb,
            null::jsonb,
            array[]::text[],
            array[error_message]::text[]
        );
        return;
    end;

end;
$$;

$_pgtle_i_$$_X$;


ALTER FUNCTION pgtle."olirice-index_advisor--0.2.0.sql"() OWNER TO postgres;

--
-- Name: olirice-index_advisor.control(); Type: FUNCTION; Schema: pgtle; Owner: postgres
--

CREATE FUNCTION pgtle."olirice-index_advisor.control"() RETURNS text
    LANGUAGE sql
    AS $_X$SELECT $_pgtle_i_$default_version = '0.1.0'
comment = 'olirice-index_advisor'
relocatable = false
superuser = false
trusted = false
requires = 'hypopg,pg_tle'
$_pgtle_i_$$_X$;


ALTER FUNCTION pgtle."olirice-index_advisor.control"() OWNER TO postgres;

--
-- Name: supabase-dbdev--0.0.2.sql(); Type: FUNCTION; Schema: pgtle; Owner: postgres
--

CREATE FUNCTION pgtle."supabase-dbdev--0.0.2.sql"() RETURNS text
    LANGUAGE sql
    AS $_X$SELECT $_pgtle_i_$

create schema dbdev;

create or replace function dbdev.install(package_name text)
    returns bool
    language plpgsql
as $$
declare
    -- Endpoint
    base_url text = 'https://api.database.dev/rest/v1/';
    apikey text = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdXB0cHBsZnZpaWZyYndtbXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODAxMDczNzIsImV4cCI6MTk5NTY4MzM3Mn0.z2CN0mvO2No8wSi46Gw59DFGCTJrzM0AQKsu_5k134s';

    http_ext_schema regnamespace = extnamespace::regnamespace from pg_catalog.pg_extension where extname = 'http' limit 1;
    pgtle_is_available bool = true from pg_catalog.pg_extension where extname = 'pg_tle' limit 1;
    -- HTTP respones
    rec jsonb;
    status int;
    contents json;

    -- Install Record
    rec_sql text;
    rec_ver text;
    rec_from_ver text;
    rec_to_ver text;
    rec_package_name text;
    rec_description text;
    rec_requires text[];
begin

    if http_ext_schema is null then
        raise exception using errcode='22000', message=format('dbdev requires the http extension and it is not available');
    end if;

    if pgtle_is_available is null then
        raise exception using errcode='22000', message=format('dbdev requires the pgtle extension and it is not available');
    end if;

    -------------------
    -- Base Versions --
    -------------------
    execute  $stmt$select row_to_json(x)
    from $stmt$ || pg_catalog.quote_ident(http_ext_schema::text) || $stmt$.http(
        (
            'GET',
            format(
                '%spackage_versions?select=package_name,version,sql,control_description,control_requires&limit=50&package_name=eq.%s',
                $stmt$ || pg_catalog.quote_literal(base_url) || $stmt$,
                $stmt$ || pg_catalog.quote_literal($1) || $stmt$
            ),
            array[
                ('apiKey', $stmt$ || pg_catalog.quote_literal(apikey) || $stmt$)::http_header
            ],
            null,
            null
        )
    ) x
    limit 1; $stmt$
    into rec;

    status = (rec ->> 'status')::int;
    contents = to_json(rec ->> 'content') #>> '{}';

    if status <> 200 then
        raise notice using errcode='22000', message=format('DBDEV INFO: %s', contents);
        raise exception using errcode='22000', message=format('Non-200 response code while loading versions from dbdev');
    end if;

    if contents is null or json_typeof(contents) <> 'array' or json_array_length(contents) = 0 then
        raise exception using errcode='22000', message=format('No versions for package named named %s', package_name);
    end if;

    for rec_package_name, rec_ver, rec_sql, rec_description, rec_requires in select
            (r ->> 'package_name'),
            (r ->> 'version'),
            (r ->> 'sql'),
            (r ->> 'control_description'),
            to_json(rec ->> 'control_requires') #>> '{}'
        from
            json_array_elements(contents) as r
        loop

        if not exists (
            select true
            from pgtle.available_extension_versions()
            where
                -- TLE will not allow multiple full install scripts
                -- TODO(OR) open upstream issue to discuss
                name = rec_package_name
        ) then
            perform pgtle.install_extension(rec_package_name, rec_ver, rec_package_name, rec_sql);
        end if;
    end loop;

    ----------------------
    -- Upgrade Versions --
    ----------------------
    execute  $stmt$select row_to_json(x)
    from $stmt$ || pg_catalog.quote_ident(http_ext_schema::text) || $stmt$.http(
        (
            'GET',
            format(
                '%spackage_upgrades?select=package_name,from_version,to_version,sql&limit=50&package_name=eq.%s',
                $stmt$ || pg_catalog.quote_literal(base_url) || $stmt$,
                $stmt$ || pg_catalog.quote_literal($1) || $stmt$
            ),
            array[
                ('apiKey', $stmt$ || pg_catalog.quote_literal(apikey) || $stmt$)::http_header
            ],
            null,
            null
        )
    ) x
    limit 1; $stmt$
    into rec;

    status = (rec ->> 'status')::int;
    contents = to_json(rec ->> 'content') #>> '{}';

    if status <> 200 then
        raise notice using errcode='22000', message=format('DBDEV INFO: %s', contents);
        raise exception using errcode='22000', message=format('Non-200 response code while loading upgrade pathes from dbdev');
    end if;

    if json_typeof(contents) <> 'array' then
        raise exception using errcode='22000', message=format('Invalid response from dbdev upgrade pathes');
    end if;

    for rec_package_name, rec_from_ver, rec_to_ver, rec_sql in select
            (r ->> 'package_name'),
            (r ->> 'from_version'),
            (r ->> 'to_version'),
            (r ->> 'sql')
        from
            json_array_elements(contents) as r
        loop

        if not exists (
            select true
            from pgtle.extension_update_paths(rec_package_name)
            where
                source = rec_from_ver
                and target = rec_to_ver
                and path is not null
        ) then
            perform pgtle.install_update_path(rec_package_name, rec_from_ver, rec_to_ver, rec_sql);
        end if;
    end loop;

    --------------------------
    -- Send Download Notice --
    --------------------------
    -- Notifies dbdev that a package has been downloaded and records IP + user agent so we can compute unique download counts
    execute  $stmt$select row_to_json(x)
    from $stmt$ || pg_catalog.quote_ident(http_ext_schema::text) || $stmt$.http(
        (
            'POST',
            format(
                '%srpc/register_download',
                $stmt$ || pg_catalog.quote_literal(base_url) || $stmt$
            ),
            array[
                ('apiKey', $stmt$ || pg_catalog.quote_literal(apikey) || $stmt$)::http_header,
                ('x-client-info', 'dbdev/0.0.2')::http_header
            ],
            'application/json',
            json_build_object('package_name', $stmt$ || pg_catalog.quote_literal($1) || $stmt$)::text
        )
    ) x
    limit 1; $stmt$
    into rec;

    return true;
end;
$$;

$_pgtle_i_$$_X$;


ALTER FUNCTION pgtle."supabase-dbdev--0.0.2.sql"() OWNER TO postgres;

--
-- Name: supabase-dbdev--0.0.3.sql(); Type: FUNCTION; Schema: pgtle; Owner: postgres
--

CREATE FUNCTION pgtle."supabase-dbdev--0.0.3.sql"() RETURNS text
    LANGUAGE sql
    AS $_X$SELECT $_pgtle_i_$

create schema dbdev;

create or replace function dbdev.install(package_name text)
    returns bool
    language plpgsql
as $$
declare
    -- Endpoint
    base_url text = 'https://api.database.dev/rest/v1/';
    apikey text = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdXB0cHBsZnZpaWZyYndtbXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODAxMDczNzIsImV4cCI6MTk5NTY4MzM3Mn0.z2CN0mvO2No8wSi46Gw59DFGCTJrzM0AQKsu_5k134s';

    http_ext_schema regnamespace = extnamespace::regnamespace from pg_catalog.pg_extension where extname = 'http' limit 1;
    pgtle_is_available bool = true from pg_catalog.pg_extension where extname = 'pg_tle' limit 1;
    -- HTTP respones
    rec jsonb;
    status int;
    contents json;

    -- Install Record
    rec_sql text;
    rec_ver text;
    rec_from_ver text;
    rec_to_ver text;
    rec_package_name text;
    rec_description text;
    rec_requires text[];
begin

    if http_ext_schema is null then
        raise exception using errcode='22000', message=format('dbdev requires the http extension and it is not available');
    end if;

    if pgtle_is_available is null then
        raise exception using errcode='22000', message=format('dbdev requires the pgtle extension and it is not available');
    end if;

    -------------------
    -- Base Versions --
    -------------------
    execute  $stmt$select row_to_json(x)
    from $stmt$ || pg_catalog.quote_ident(http_ext_schema::text) || $stmt$.http(
        (
            'GET',
            format(
                '%spackage_versions?select=package_name,version,sql,control_description,control_requires&limit=50&package_name=eq.%s',
                $stmt$ || pg_catalog.quote_literal(base_url) || $stmt$,
                $stmt$ || pg_catalog.quote_literal($1) || $stmt$
            ),
            array[
                ('apiKey', $stmt$ || pg_catalog.quote_literal(apikey) || $stmt$)::http_header
            ],
            null,
            null
        )
    ) x
    limit 1; $stmt$
    into rec;

    status = (rec ->> 'status')::int;
    contents = to_json(rec ->> 'content') #>> '{}';

    if status <> 200 then
        raise notice using errcode='22000', message=format('DBDEV INFO: %s', contents);
        raise exception using errcode='22000', message=format('Non-200 response code while loading versions from dbdev');
    end if;

    if contents is null or json_typeof(contents) <> 'array' or json_array_length(contents) = 0 then
        raise exception using errcode='22000', message=format('No versions for package named named %s', package_name);
    end if;

    for rec_package_name, rec_ver, rec_sql, rec_description, rec_requires in select
            (r ->> 'package_name'),
            (r ->> 'version'),
            (r ->> 'sql'),
            (r ->> 'control_description'),
            array(select json_array_elements_text((r -> 'control_requires')))
        from
            json_array_elements(contents) as r
        loop

        -- Install the primary version
        if not exists (
            select true
            from pgtle.available_extensions()
            where
                name = rec_package_name
        ) then
            perform pgtle.install_extension(rec_package_name, rec_ver, rec_package_name, rec_sql, rec_requires);
        end if;

        -- Install other available versions
        if not exists (
            select true
            from pgtle.available_extension_versions()
            where
                name = rec_package_name
                and version = rec_ver
        ) then
            perform pgtle.install_extension_version_sql(rec_package_name, rec_ver, rec_sql);
        end if;

    end loop;

    ----------------------
    -- Upgrade Versions --
    ----------------------
    execute  $stmt$select row_to_json(x)
    from $stmt$ || pg_catalog.quote_ident(http_ext_schema::text) || $stmt$.http(
        (
            'GET',
            format(
                '%spackage_upgrades?select=package_name,from_version,to_version,sql&limit=50&package_name=eq.%s',
                $stmt$ || pg_catalog.quote_literal(base_url) || $stmt$,
                $stmt$ || pg_catalog.quote_literal($1) || $stmt$
            ),
            array[
                ('apiKey', $stmt$ || pg_catalog.quote_literal(apikey) || $stmt$)::http_header
            ],
            null,
            null
        )
    ) x
    limit 1; $stmt$
    into rec;

    status = (rec ->> 'status')::int;
    contents = to_json(rec ->> 'content') #>> '{}';

    if status <> 200 then
        raise notice using errcode='22000', message=format('DBDEV INFO: %s', contents);
        raise exception using errcode='22000', message=format('Non-200 response code while loading upgrade pathes from dbdev');
    end if;

    if json_typeof(contents) <> 'array' then
        raise exception using errcode='22000', message=format('Invalid response from dbdev upgrade pathes');
    end if;

    for rec_package_name, rec_from_ver, rec_to_ver, rec_sql in select
            (r ->> 'package_name'),
            (r ->> 'from_version'),
            (r ->> 'to_version'),
            (r ->> 'sql')
        from
            json_array_elements(contents) as r
        loop

        if not exists (
            select true
            from pgtle.extension_update_paths(rec_package_name)
            where
                source = rec_from_ver
                and target = rec_to_ver
                and path is not null
        ) then
            perform pgtle.install_update_path(rec_package_name, rec_from_ver, rec_to_ver, rec_sql);
        end if;
    end loop;

    --------------------------
    -- Send Download Notice --
    --------------------------
    -- Notifies dbdev that a package has been downloaded and records IP + user agent so we can compute unique download counts
    execute  $stmt$select row_to_json(x)
    from $stmt$ || pg_catalog.quote_ident(http_ext_schema::text) || $stmt$.http(
        (
            'POST',
            format(
                '%srpc/register_download',
                $stmt$ || pg_catalog.quote_literal(base_url) || $stmt$
            ),
            array[
                ('apiKey', $stmt$ || pg_catalog.quote_literal(apikey) || $stmt$)::http_header,
                ('x-client-info', 'dbdev/0.0.2')::http_header
            ],
            'application/json',
            json_build_object('package_name', $stmt$ || pg_catalog.quote_literal($1) || $stmt$)::text
        )
    ) x
    limit 1; $stmt$
    into rec;

    return true;
end;
$$;

$_pgtle_i_$$_X$;


ALTER FUNCTION pgtle."supabase-dbdev--0.0.3.sql"() OWNER TO postgres;

--
-- Name: supabase-dbdev.control(); Type: FUNCTION; Schema: pgtle; Owner: postgres
--

CREATE FUNCTION pgtle."supabase-dbdev.control"() RETURNS text
    LANGUAGE sql
    AS $_X$SELECT $_pgtle_i_$default_version = '0.0.3'
comment = 'PostgreSQL package manager'
relocatable = false
superuser = false
trusted = false
requires = 'pg_tle'
$_pgtle_i_$$_X$;


ALTER FUNCTION pgtle."supabase-dbdev.control"() OWNER TO postgres;

--
-- Name: add_document_to_group(text, text, text, text, text[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_document_to_group(p_course_name text, p_s3_path text, p_url text, p_readable_filename text, p_doc_groups text[]) RETURNS boolean
    LANGUAGE plpgsql
    AS $$DECLARE
    v_document_id bigint;
    v_doc_group_id bigint;
    v_success boolean := true;
    p_doc_group text;
BEGIN
    -- Ensure the document exists
    SELECT id INTO v_document_id FROM public.documents WHERE course_name = p_course_name AND (
    (s3_path <> '' AND s3_path IS NOT NULL AND s3_path = p_s3_path)
);

    raise log 'id of document: %', v_document_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Document does not exist';
    END IF;

    -- Loop through document groups
    FOREACH p_doc_group IN ARRAY p_doc_groups
    LOOP
        -- Upsert document group, assuming 'name' and 'course_name' can uniquely identify a row
        INSERT INTO public.doc_groups(name, course_name)
        VALUES (p_doc_group, p_course_name)
        ON CONFLICT (name, course_name) DO UPDATE
        SET name = EXCLUDED.name
        RETURNING id INTO v_doc_group_id;

        raise log 'id of document group: %', v_doc_group_id;

        -- Upsert the association in documents_doc_groups
        INSERT INTO public.documents_doc_groups(document_id, doc_group_id)
        VALUES (v_document_id, v_doc_group_id)
        ON CONFLICT (document_id, doc_group_id) DO NOTHING;

        raise log 'completed for %',v_doc_group_id;
    END LOOP;

    raise log 'completed for %',v_document_id;
    RETURN v_success;
EXCEPTION
    WHEN OTHERS THEN
        v_success := false;
        RAISE;
        RETURN v_success;
END;$$;


ALTER FUNCTION public.add_document_to_group(p_course_name text, p_s3_path text, p_url text, p_readable_filename text, p_doc_groups text[]) OWNER TO postgres;

--
-- Name: add_document_to_group_url(text, text, text, text, text[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_document_to_group_url(p_course_name text, p_s3_path text, p_url text, p_readable_filename text, p_doc_groups text[]) RETURNS boolean
    LANGUAGE plpgsql
    AS $$DECLARE
    v_document_id bigint;
    v_doc_group_id bigint;
    v_success boolean := true;
    p_doc_group text;
BEGIN
    -- Ensure the document exists
    SELECT id INTO v_document_id FROM public.documents WHERE course_name = p_course_name AND (
    (s3_path <> '' AND s3_path IS NOT NULL AND s3_path = p_s3_path) OR
    (url = p_url)
);

    raise log 'id of document: %', v_document_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Document does not exist';
    END IF;

    -- Loop through document groups
    FOREACH p_doc_group IN ARRAY p_doc_groups
    LOOP
        -- Upsert document group, assuming 'name' and 'course_name' can uniquely identify a row
        INSERT INTO public.doc_groups(name, course_name)
        VALUES (p_doc_group, p_course_name)
        ON CONFLICT (name, course_name) DO UPDATE
        SET name = EXCLUDED.name
        RETURNING id INTO v_doc_group_id;

        raise log 'id of document group: %', v_doc_group_id;

        -- Upsert the association in documents_doc_groups
        INSERT INTO public.documents_doc_groups(document_id, doc_group_id)
        VALUES (v_document_id, v_doc_group_id)
        ON CONFLICT (document_id, doc_group_id) DO NOTHING;

        raise log 'completed for %',v_doc_group_id;
    END LOOP;

    raise log 'completed for %',v_document_id;
    RETURN v_success;
EXCEPTION
    WHEN OTHERS THEN
        v_success := false;
        RAISE;
        RETURN v_success;
END;$$;


ALTER FUNCTION public.add_document_to_group_url(p_course_name text, p_s3_path text, p_url text, p_readable_filename text, p_doc_groups text[]) OWNER TO postgres;

--
-- Name: c(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.c() RETURNS record
    LANGUAGE plpgsql
    AS $$DECLARE
    course_names record;
BEGIN
    SELECT distinct course_name INTO course_names
    FROM public.documents
    LIMIT 1;

    RAISE LOG 'distinct_course_names: %', course_names;
    RETURN course_names;
END;$$;


ALTER FUNCTION public.c() OWNER TO postgres;

--
-- Name: calculate_weekly_trends(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_weekly_trends(course_name_input text) RETURNS TABLE(metric_name text, current_week_value numeric, previous_week_value numeric, percentage_change numeric)
    LANGUAGE plpgsql
    AS $$DECLARE
    current_7_days_start DATE;
    previous_7_days_start DATE;
BEGIN
    -- Determine the start of the current 7-day period and the previous 7-day period
    current_7_days_start := CURRENT_DATE - INTERVAL '7 days';
    previous_7_days_start := CURRENT_DATE - INTERVAL '14 days';

    -- Debug: Log the date ranges
    RAISE NOTICE 'Current 7 Days: Start %, End %', current_7_days_start, CURRENT_DATE;
    RAISE NOTICE 'Previous 7 Days: Start %, End %', previous_7_days_start, current_7_days_start;

    -- Aggregate data for the 7-day periods
    RETURN QUERY
    WITH weekly_data AS (
        SELECT
            course_name,
            COUNT(DISTINCT user_email)::NUMERIC AS unique_users,
            COUNT(convo_id)::NUMERIC AS total_conversations,
            CASE
                WHEN created_at >= current_7_days_start AND created_at < CURRENT_DATE THEN 'current'
                WHEN created_at >= previous_7_days_start AND created_at < current_7_days_start THEN 'previous'
            END AS period
        FROM
            public."llm-convo-monitor"
        WHERE
            course_name = course_name_input
            AND created_at >= previous_7_days_start
            AND created_at < CURRENT_DATE
        GROUP BY
            course_name, period
    )
    -- Calculate trends for unique users
    SELECT
        'Unique Users' AS metric_name,
        COALESCE(current_data.unique_users, 0) AS current_week_value,
        COALESCE(previous_data.unique_users, 0) AS previous_week_value,
        CASE
            WHEN previous_data.unique_users = 0 THEN NULL
            ELSE ROUND(((current_data.unique_users - previous_data.unique_users) / previous_data.unique_users) * 100, 2)
        END AS percentage_change
    FROM
        (SELECT unique_users FROM weekly_data WHERE period = 'current') AS current_data
        FULL OUTER JOIN
        (SELECT unique_users FROM weekly_data WHERE period = 'previous') AS previous_data
        ON TRUE

    UNION ALL

    -- Calculate trends for total conversations
    SELECT
        'Total Conversations' AS metric_name,
        COALESCE(current_data.total_conversations, 0) AS current_week_value,
        COALESCE(previous_data.total_conversations, 0) AS previous_week_value,
        CASE
            WHEN previous_data.total_conversations = 0 THEN NULL
            ELSE ROUND(((current_data.total_conversations - previous_data.total_conversations) / previous_data.total_conversations) * 100, 2)
        END AS percentage_change
    FROM
        (SELECT total_conversations FROM weekly_data WHERE period = 'current') AS current_data
        FULL OUTER JOIN
        (SELECT total_conversations FROM weekly_data WHERE period = 'previous') AS previous_data
        ON TRUE;
END;$$;


ALTER FUNCTION public.calculate_weekly_trends(course_name_input text) OWNER TO postgres;

--
-- Name: check_and_lock_flows_v2(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_and_lock_flows_v2(id integer) RETURNS text
    LANGUAGE plpgsql
    AS $$DECLARE
    workflow_id bigint;
    workflow_locked boolean;
BEGIN
    -- Get the latest workflow id and its lock status
    select latest_workflow_id, is_locked
    into workflow_id, workflow_locked
    from public.n8n_workflows
    order by latest_workflow_id desc
    limit 1;

    -- Check if the latest workflow is locked
    if id = workflow_id then
        return 'id already exists';
    elseif workflow_locked then
        return 'Workflow is locked';
    else
        -- Update the latest_workflow_id
        update public.n8n_workflows
        set latest_workflow_id = id,
        is_locked = True
        where latest_workflow_id = workflow_id;
        return 'Workflow updated';

    
    end if;
end;$$;


ALTER FUNCTION public.check_and_lock_flows_v2(id integer) OWNER TO postgres;

--
-- Name: cn(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cn() RETURNS text
    LANGUAGE plpgsql
    AS $$DECLARE
    course_names text;
BEGIN
    SELECT distinct course_name INTO course_names
    FROM public.documents;

    RAISE LOG 'distinct_course_names: %', course_names;
    RETURN course_names;
END;$$;


ALTER FUNCTION public.cn() OWNER TO postgres;

--
-- Name: count_models_by_project(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.count_models_by_project(project_name_input text) RETURNS TABLE(model character varying, count bigint)
    LANGUAGE plpgsql
    AS $$BEGIN
    RETURN QUERY
    SELECT conversations.model, COUNT(*) AS count
    FROM conversations
    WHERE conversations.project_name = project_name_input
    GROUP BY conversations.model
    ORDER BY count DESC;
END;$$;


ALTER FUNCTION public.count_models_by_project(project_name_input text) OWNER TO postgres;

--
-- Name: count_models_by_project_v2(text, timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.count_models_by_project_v2(project_name_input text, start_date timestamp without time zone DEFAULT NULL::timestamp without time zone, end_date timestamp without time zone DEFAULT NULL::timestamp without time zone) RETURNS TABLE(model character varying, count bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT c.model, COUNT(*) AS count
    FROM conversations c
    WHERE c.project_name = project_name_input
        AND (start_date IS NULL OR c.created_at >= start_date)
        AND (end_date IS NULL OR c.created_at < end_date)
    GROUP BY c.model
    ORDER BY count DESC;
END;
$$;


ALTER FUNCTION public.count_models_by_project_v2(project_name_input text, start_date timestamp without time zone, end_date timestamp without time zone) OWNER TO postgres;

--
-- Name: get_base_url_with_doc_groups(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_base_url_with_doc_groups(p_course_name text) RETURNS json
    LANGUAGE plpgsql
    AS $$DECLARE
    result JSON;
BEGIN
    -- Aggregate base URLs and their respective group names into a JSON object
    SELECT JSON_OBJECT_AGG(base_url, group_names) INTO result
    FROM (
        SELECT 
            d.base_url, 
            COALESCE(JSON_AGG(DISTINCT dg.name) FILTER (WHERE dg.name IS NOT NULL AND dg.name != 'CropWizard Public'), '[]') AS group_names
        FROM public.documents d
        LEFT JOIN public.documents_doc_groups ddg ON d.id = ddg.document_id
        LEFT JOIN public.doc_groups dg ON ddg.doc_group_id = dg.id
        WHERE d.course_name = p_course_name
          AND d.base_url != ''
        GROUP BY d.base_url
    ) subquery;

    -- Return the final JSON object
    RETURN result;
END;$$;


ALTER FUNCTION public.get_base_url_with_doc_groups(p_course_name text) OWNER TO postgres;

--
-- Name: get_convo_maps(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_convo_maps() RETURNS json
    LANGUAGE plpgsql
    AS $$DECLARE
    course_details JSON;
BEGIN
    -- Aggregate course details into JSON format
    WITH filtered_courses AS (
        SELECT course_name
        FROM public."llm-convo-monitor"
        GROUP BY course_name
        HAVING COUNT(id) > 20
    )
    SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
            'course_name', p.course_name,
            'convo_map_id', COALESCE(p.convo_map_id, 'N/A'),
            'last_uploaded_convo_id', COALESCE(p.last_uploaded_convo_id, 0)
        )
    ) INTO course_details
    FROM public.projects p
    JOIN filtered_courses fc ON p.course_name = fc.course_name
    WHERE p.course_name IS NOT NULL;

    -- Return the aggregated JSON
    RETURN course_details;
END;$$;


ALTER FUNCTION public.get_convo_maps() OWNER TO postgres;

--
-- Name: get_course_details(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_course_details() RETURNS TABLE(course_name text, convo_map_id text, last_uploaded_convo_id bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT p.course_name, p.convo_map_id, p.last_uploaded_convo_id
    FROM public."llm-convo-monitor" l
    JOIN public.projects p ON l.course_name = p.course_name
    GROUP BY p.course_name, p.convo_map_id, p.last_uploaded_convo_id
    HAVING COUNT(l.id) > 20;
END;
$$;


ALTER FUNCTION public.get_course_details() OWNER TO postgres;

--
-- Name: get_course_names(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_course_names() RETURNS json
    LANGUAGE plpgsql
    AS $$DECLARE
    course_names text;
BEGIN
    -- Get the latest workflow id and its lock status
    SELECT distinct course_name INTO course_names
    FROM public.documents;

    RAISE LOG 'distinct_course_names: %', course_names;
    RETURN course_names;
END;$$;


ALTER FUNCTION public.get_course_names() OWNER TO postgres;

--
-- Name: get_distinct_base_urls(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_distinct_base_urls(p_course_name text) RETURNS json
    LANGUAGE plpgsql
    AS $$DECLARE
    distinct_base_urls JSON;
BEGIN
    -- Aggregate all distinct base URLs into an array
    SELECT JSON_AGG(DISTINCT d.base_url) INTO distinct_base_urls
    FROM public.documents d  -- Ensure d is correctly defined here
    WHERE d.course_name = p_course_name and d.base_url != '';

    --RAISE LOG 'distinct_course_names: %', distinct_base_urls;
    RETURN distinct_base_urls;
END;$$;


ALTER FUNCTION public.get_distinct_base_urls(p_course_name text) OWNER TO postgres;

--
-- Name: get_distinct_course_names(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_distinct_course_names() RETURNS TABLE(course_name text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT d.course_name
    FROM public.documents d
    WHERE d.course_name IS NOT NULL;

    RAISE LOG 'Distinct course names retrieved';
END;
$$;


ALTER FUNCTION public.get_distinct_course_names() OWNER TO postgres;

--
-- Name: get_doc_map_details(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_doc_map_details() RETURNS json
    LANGUAGE plpgsql
    AS $$DECLARE
    course_details JSON;
BEGIN
    -- Aggregate course details into JSON format
    WITH filtered_courses AS (
        SELECT course_name
        FROM public."documents"
        GROUP BY course_name
        HAVING COUNT(id) > 20
    )
    SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
            'course_name', p.course_name,
            'doc_map_id', COALESCE(p.doc_map_id, 'N/A'),
            'last_uploaded_doc_id', COALESCE(p.last_uploaded_doc_id, 0)
        )
    ) INTO course_details
    FROM public.projects p
    JOIN filtered_courses fc ON p.course_name = fc.course_name
    WHERE p.course_name IS NOT NULL;

    -- Return the aggregated JSON
    RETURN course_details;
END;$$;


ALTER FUNCTION public.get_doc_map_details() OWNER TO postgres;

--
-- Name: get_latest_workflow_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_latest_workflow_id() RETURNS bigint
    LANGUAGE plpgsql
    AS $$DECLARE
    v_workflow_id bigint;
BEGIN
    -- Get the latest workflow id and its lock status
    SELECT latest_workflow_id INTO v_workflow_id
    FROM public.n8n_workflows
    ORDER BY latest_workflow_id DESC
    LIMIT 1;

    RAISE LOG 'latest_workflow_id: %', v_workflow_id;
    RETURN v_workflow_id;
END;$$;


ALTER FUNCTION public.get_latest_workflow_id() OWNER TO postgres;

--
-- Name: get_run_data(text, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_run_data(p_run_ids text, p_limit integer, p_offset integer) RETURNS json
    LANGUAGE plpgsql
    AS $$DECLARE
    documents JSONB;
    v_limit INTEGER := COALESCE(p_limit, 10); -- Default limit is 10
    v_offset INTEGER := COALESCE(p_offset, 0); -- Default offset is 0
    v_run_ids INTEGER[] := STRING_TO_ARRAY(p_run_ids, ',')::INTEGER[]; -- Convert string to integer array
BEGIN
    WITH document_data AS (
        SELECT 
            cdm.run_id,
            cdm.document_id,
            c.readable_filename,
            cdm.field_name,
            cdm.field_value,
            cdm.created_at
        FROM cedar_documents c
        INNER JOIN cedar_document_metadata cdm 
        ON c.id = cdm.document_id
        WHERE cdm.run_id = ANY(v_run_ids) -- Dynamic filtering using converted array
        ORDER BY cdm.created_at DESC -- Optional: ordering by creation time
        LIMIT v_limit
        OFFSET v_offset
    )
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'run_id', dd.run_id,
                'document_id', dd.document_id,
                'readable_filename', dd.readable_filename,
                'field_name', dd.field_name,
                'field_value', dd.field_value,
                'created_at', dd.created_at
            )
        ) INTO documents
    FROM document_data dd;

    RETURN documents;
END;$$;


ALTER FUNCTION public.get_run_data(p_run_ids text, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: hello(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.hello() RETURNS text
    LANGUAGE sql
    AS $$select 'hello world';$$;


ALTER FUNCTION public.hello() OWNER TO postgres;

--
-- Name: increment(integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment(usage integer, apikey text) RETURNS void
    LANGUAGE sql
    AS $$
					update api_keys 
					set usage_count = usage_count + usage
					where key = apikey
				$$;


ALTER FUNCTION public.increment(usage integer, apikey text) OWNER TO postgres;

--
-- Name: increment_api_usage(integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_api_usage(usage integer, apikey text) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    AS $_$create function increment (usage int, apikey string)
				returns void as
				$$
					update api_keys 
					set usage_count = usage_count + usage
					where api_key = apiKey
				$$ 
				language sql volatile;$_$;


ALTER FUNCTION public.increment_api_usage(usage integer, apikey text) OWNER TO postgres;

--
-- Name: increment_api_usage_count(integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_api_usage_count(usage integer, apikey text) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    AS $_$create function increment (usage int, apikey text)
				returns void as
				$$
					update api_keys 
					set usage_count = usage_count + usage
					where key = apikey
				$$ 
				language sql volatile;$_$;


ALTER FUNCTION public.increment_api_usage_count(usage integer, apikey text) OWNER TO postgres;

--
-- Name: increment_workflows(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_workflows() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
    -- Increase doc_count on insert
    IF TG_OP = 'INSERT' THEN
        UPDATE n8n_workflows
        SET latest_workflow_id = NEW.latest_workflow_id,
        is_locked = True
        WHERE latest_workflow_id = NEW.latest_workflow_id;
        RETURN NEW;
    -- Decrease doc_count on delete
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE n8n_workflows
        SET latest_workflow_id = OLD.latest_workflow_id,
        is_locked = False
        WHERE latest_workflow_id = OLD.latest_workflow_id;
        RETURN OLD;
    END IF;
    RETURN NULL; -- Should never reach here
END;$$;


ALTER FUNCTION public.increment_workflows() OWNER TO postgres;

--
-- Name: initialize_project_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.initialize_project_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
    INSERT INTO public.project_stats (project_id, project_name, total_conversations, total_messages, unique_users)
    VALUES (NEW.id, NEW.course_name, 0, 0, 0);
    RETURN NEW;
END;$$;


ALTER FUNCTION public.initialize_project_stats() OWNER TO postgres;

--
-- Name: myfunc(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.myfunc() RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
  set statement_timeout TO '600s'; -- set custom timeout;

  SELECT *
  FROM public.documents
  WHERE EXISTS (
    SELECT 1
    FROM jsonb_array_elements(contexts) AS elem
    WHERE elem->>'text' ILIKE '%We use cookies to provide you with the best possible experience. By continuing to use thi%'
  )
  LIMIT 5;
end;
$$;


ALTER FUNCTION public.myfunc() OWNER TO postgres;

--
-- Name: remove_document_from_group(text, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.remove_document_from_group(p_course_name text, p_s3_path text, p_url text, p_doc_group text) RETURNS void
    LANGUAGE plpgsql
    AS $$DECLARE
    v_document_id bigint;
    v_doc_group_id bigint;
    v_doc_count bigint;
BEGIN
    -- Check if the document exists
    SELECT id INTO v_document_id FROM public.documents WHERE course_name = p_course_name AND (
    (s3_path <> '' AND s3_path IS NOT NULL AND s3_path = p_s3_path) OR
    (url = p_url)
);
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Document does not exist';
    END IF;

    -- Check if the document group exists
    SELECT id, doc_count INTO v_doc_group_id, v_doc_count
    FROM public.doc_groups
    WHERE name = p_doc_group AND course_name = p_course_name;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Document group does not exist';
    END IF;

    -- Delete the association
    DELETE FROM public.documents_doc_groups
    WHERE document_id = v_document_id AND doc_group_id = v_doc_group_id;

    -- If the doc_count becomes 0, delete the doc_group
    IF v_doc_count = 1 THEN
        DELETE FROM public.doc_groups
        WHERE id = v_doc_group_id;
    END IF;
END;$$;


ALTER FUNCTION public.remove_document_from_group(p_course_name text, p_s3_path text, p_url text, p_doc_group text) OWNER TO postgres;

--
-- Name: search_conversations(text, text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.search_conversations(p_user_email text, p_project_name text, p_search_term text DEFAULT NULL::text, p_limit integer DEFAULT 10, p_offset integer DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$DECLARE
    total_count INT;
    conversations JSONB;
BEGIN
    -- Get the total count of conversations first
    SELECT COUNT(*) INTO total_count
    FROM public.conversations c
    WHERE c.user_email = p_user_email
    AND c.project_name = p_project_name
    AND c.folder_id IS NULL
    AND (
        p_search_term IS NULL 
        OR c.name ILIKE '%' || p_search_term || '%' 
        OR EXISTS (
            SELECT 1
            FROM public.messages m
            WHERE m.conversation_id = c.id
            AND m.content_text ILIKE '%' || p_search_term || '%'
        )
    );

    WITH conversation_data AS (
    SELECT 
        c.id AS conversation_id,
        c.name AS conversation_name,
        c.model,
        c.prompt,
        c.temperature,
        c.user_email,
        c.created_at AS conversation_created_at,
        c.updated_at AS conversation_updated_at,
        c.project_name,
        c.folder_id
    FROM public.conversations c
    WHERE c.user_email = p_user_email
    AND c.project_name = p_project_name
    AND c.folder_id IS NULL
    AND (
        p_search_term IS NULL 
        OR c.name ILIKE '%' || p_search_term || '%' 
        OR EXISTS (
            SELECT 1
            FROM public.messages m
            WHERE m.conversation_id = c.id
            AND m.content_text ILIKE '%' || p_search_term || '%'
        )
    )
    ORDER BY c.created_at DESC
    LIMIT p_limit OFFSET p_offset
)
SELECT 
    jsonb_build_object(
        'conversations', COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', cd.conversation_id,
                'name', cd.conversation_name,
                'model', cd.model,
                'prompt', cd.prompt,
                'temperature', cd.temperature,
                'user_email', cd.user_email,
                'created_at', cd.conversation_created_at,
                'updated_at', cd.conversation_updated_at,
                'project_name', cd.project_name,
                'folder_id', cd.folder_id,
                'messages', (
                    SELECT COALESCE(
                        jsonb_agg(
                            jsonb_build_object(
                                'id', m.id,
                                'role', m.role,
                                'created_at', m.created_at,
                                'content_text', m.content_text,
                                'contexts', m.contexts,
                                'tools', m.tools,
                                'latest_system_message', m.latest_system_message,
                                'final_prompt_engineered_message', m.final_prompt_engineered_message,
                                'response_time_sec', m.response_time_sec,
                                'updated_at', m.updated_at,
                                'content_image_url', m.content_image_url,
                                'image_description', m.image_description
                            )
                            ORDER BY m.created_at ASC
                        ), '[]'::jsonb
                    )
                    FROM public.messages m
                    WHERE m.conversation_id = cd.conversation_id
                )
            )
        ), '[]'::jsonb),
        'total_count', total_count
    ) INTO conversations
FROM conversation_data cd;

    RETURN conversations;
END;$$;


ALTER FUNCTION public.search_conversations(p_user_email text, p_project_name text, p_search_term text, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: search_conversations_v2(text, text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.search_conversations_v2(p_user_email text, p_project_name text, p_search_term text, p_limit integer, p_offset integer) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$DECLARE
    total_count INT;
    conversations JSONB;
    v_search_term text := COALESCE(p_search_term, NULL);
    v_limit integer := COALESCE(p_limit, 10);
    v_offset integer := COALESCE(p_offset, 0);
BEGIN
    -- Get the total count of conversations first
    SELECT COUNT(*) INTO total_count
    FROM public.conversations c
    WHERE c.user_email = p_user_email
    AND c.project_name = p_project_name
    AND c.folder_id IS NULL
    AND (
        v_search_term IS NULL 
        OR c.name ILIKE '%' || v_search_term || '%' 
        OR EXISTS (
            SELECT 1
            FROM public.messages m
            WHERE m.conversation_id = c.id
            AND m.content_text ILIKE '%' || v_search_term || '%'
        )
    );

    WITH conversation_data AS (
    SELECT 
        c.id AS conversation_id,
        c.name AS conversation_name,
        c.model,
        c.prompt,
        c.temperature,
        c.user_email,
        c.created_at AS conversation_created_at,
        c.updated_at AS conversation_updated_at,
        c.project_name,
        c.folder_id
    FROM public.conversations c
    WHERE c.user_email = p_user_email
    AND c.project_name = p_project_name
    AND c.folder_id IS NULL
    AND (
        v_search_term IS NULL 
        OR c.name ILIKE '%' || v_search_term || '%' 
        OR EXISTS (
            SELECT 1
            FROM public.messages m
            WHERE m.conversation_id = c.id
            AND m.content_text ILIKE '%' || v_search_term || '%'
        )
    )
    ORDER BY c.created_at DESC
    LIMIT v_limit OFFSET v_offset
)
SELECT 
    jsonb_build_object(
        'conversations', COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', cd.conversation_id,
                'name', cd.conversation_name,
                'model', cd.model,
                'prompt', cd.prompt,
                'temperature', cd.temperature,
                'user_email', cd.user_email,
                'created_at', cd.conversation_created_at,
                'updated_at', cd.conversation_updated_at,
                'project_name', cd.project_name,
                'folder_id', cd.folder_id,
                'messages', (
                    SELECT COALESCE(
                        jsonb_agg(
                            jsonb_build_object(
                                'id', m.id,
                                'role', m.role,
                                'created_at', m.created_at,
                                'content_text', m.content_text,
                                'contexts', m.contexts,
                                'tools', m.tools,
                                'latest_system_message', m.latest_system_message,
                                'final_prompt_engineered_message', m.final_prompt_engineered_message,
                                'response_time_sec', m.response_time_sec,
                                'updated_at', m.updated_at,
                                'content_image_url', m.content_image_url,
                                'image_description', m.image_description,
                                'feedback', (
                                    CASE 
                                        WHEN m.feedback_is_positive IS NOT NULL 
                                        THEN jsonb_build_object(
                                            'feedback_is_positive', m.feedback_is_positive,
                                            'feedback_category', m.feedback_category,
                                            'feedback_details', m.feedback_details
                                        )
                                        ELSE NULL
                                    END
                                )
                            )
                            ORDER BY m.created_at ASC
                        ), '[]'::jsonb
                    )
                    FROM public.messages m
                    WHERE m.conversation_id = cd.conversation_id
                )
            )
        ), '[]'::jsonb),
        'total_count', total_count
    ) INTO conversations
FROM conversation_data cd;

    RETURN conversations;
END;$$;


ALTER FUNCTION public.search_conversations_v2(p_user_email text, p_project_name text, p_search_term text, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: search_conversations_v3(text, text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.search_conversations_v3(p_user_email text, p_project_name text, p_search_term text, p_limit integer, p_offset integer) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$DECLARE
    total_count INT;
    conversations JSONB;
    v_search_term text := COALESCE(p_search_term, NULL);
    v_limit integer := COALESCE(p_limit, 10);
    v_offset integer := COALESCE(p_offset, 0);
BEGIN
    -- Get the total count of conversations first
    SELECT COUNT(*) INTO total_count
    FROM public.conversations c
    WHERE c.user_email = p_user_email
    AND c.project_name = p_project_name
    AND c.folder_id IS NULL
    AND (
        v_search_term IS NULL 
        OR c.name ILIKE '%' || v_search_term || '%' 
        OR EXISTS (
            SELECT 1
            FROM public.messages m
            WHERE m.conversation_id = c.id
            AND m.content_text ILIKE '%' || v_search_term || '%'
        )
    );

    WITH conversation_data AS (
    SELECT 
        c.id AS conversation_id,
        c.name AS conversation_name,
        c.model,
        c.prompt,
        c.temperature,
        c.user_email,
        c.created_at AS conversation_created_at,
        c.updated_at AS conversation_updated_at,
        c.project_name,
        c.folder_id
    FROM public.conversations c
    WHERE c.user_email = p_user_email
    AND c.project_name = p_project_name
    AND c.folder_id IS NULL
    AND (
        v_search_term IS NULL 
        OR c.name ILIKE '%' || v_search_term || '%' 
        OR EXISTS (
            SELECT 1
            FROM public.messages m
            WHERE m.conversation_id = c.id
            AND m.content_text ILIKE '%' || v_search_term || '%'
        )
    )
    ORDER BY c.created_at DESC
    LIMIT v_limit OFFSET v_offset
)
SELECT 
    jsonb_build_object(
        'conversations', COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', cd.conversation_id,
                'name', cd.conversation_name,
                'model', cd.model,
                'prompt', cd.prompt,
                'temperature', cd.temperature,
                'user_email', cd.user_email,
                'created_at', cd.conversation_created_at,
                'updated_at', cd.conversation_updated_at,
                'project_name', cd.project_name,
                'folder_id', cd.folder_id,
                'messages', (
                    SELECT COALESCE(
                        jsonb_agg(
                            jsonb_build_object(
                                'id', m.id,
                                'role', m.role,
                                'created_at', m.created_at,
                                'content_text', m.content_text,
                                'contexts', m.contexts,
                                'tools', m.tools,
                                'latest_system_message', m.latest_system_message,
                                'final_prompt_engineered_message', m.final_prompt_engineered_message,
                                'response_time_sec', m.response_time_sec,
                                'updated_at', m.updated_at,
                                'content_image_url', m.content_image_url,
                                'image_description', m.image_description,
                                'was_query_rewritten', m.was_query_rewritten,
                                'query_rewrite_text', m.query_rewrite_text,
                                'feedback', (
                                    CASE 
                                        WHEN m.feedback_is_positive IS NOT NULL 
                                        THEN jsonb_build_object(
                                            'feedback_is_positive', m.feedback_is_positive,
                                            'feedback_category', m.feedback_category,
                                            'feedback_details', m.feedback_details
                                        )
                                        ELSE NULL
                                    END
                                )
                            )
                            ORDER BY m.created_at ASC
                        ), '[]'::jsonb
                    )
                    FROM public.messages m
                    WHERE m.conversation_id = cd.conversation_id
                )
            )
        ), '[]'::jsonb),
        'total_count', total_count
    ) INTO conversations
FROM conversation_data cd;

    RETURN conversations;
END;$$;


ALTER FUNCTION public.search_conversations_v3(p_user_email text, p_project_name text, p_search_term text, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: test_function(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.test_function(id integer) RETURNS text
    LANGUAGE plpgsql
    AS $$DECLARE
    workflow_id bigint;
    workflow_locked boolean;
BEGIN
    -- Get the latest workflow id and its lock status
    select latest_workflow_id, is_locked
    into workflow_id, workflow_locked
    from public.n8n_workflows
    order by latest_workflow_id desc
    limit 1;

    -- Check if the latest workflow is locked
    if id = workflow_id then
        return 'id already exists';
    elseif workflow_locked then
        return 'Workflow is locked';
    else
        -- Update the latest_workflow_id
        -- update public.n8n_workflows
        -- set latest_workflow_id = id,
        -- is_locked = True
        -- where latest_workflow_id = workflow_id;
        return 'Workflow updated';

    
    end if;
end;$$;


ALTER FUNCTION public.test_function(id integer) OWNER TO postgres;

--
-- Name: update_doc_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_doc_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
    -- Increase doc_count on insert
    IF TG_OP = 'INSERT' THEN
        UPDATE doc_groups
        SET doc_count = doc_count + 1
        WHERE id = NEW.doc_group_id;
        RETURN NEW;
    -- Decrease doc_count on delete
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE doc_groups
        SET doc_count = doc_count - 1
        WHERE id = OLD.doc_group_id;
        RETURN OLD;
    END IF;
    RETURN NULL; -- Should never reach here
END;$$;


ALTER FUNCTION public.update_doc_count() OWNER TO postgres;

--
-- Name: update_project_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_project_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_conversation_message_count INT;
    updated_distinct_user_count INT;
    old_message_count INT;
    new_message_count INT;
BEGIN
    
    IF TG_OP = 'INSERT' THEN

        -- Calculate message count for the new conversation
        SELECT COUNT(*)
        INTO new_conversation_message_count
        FROM json_array_elements(NEW.convo->'messages') AS message
        WHERE message->>'role' = 'user';

        -- Calculate distinct user count after the insert
        SELECT COUNT(DISTINCT user_email)
        INTO updated_distinct_user_count
        FROM public."llm-convo-monitor"
        WHERE course_name = NEW.course_name;

        -- Update project_stats with new conversation and distinct users
        UPDATE public.project_stats
        SET total_conversations = COALESCE(total_conversations, 0) + 1,
            total_messages = COALESCE(total_messages, 0) + new_conversation_message_count,
            unique_users = updated_distinct_user_count
        WHERE project_name = NEW.course_name;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Get old and new message counts
        SELECT COUNT(*)
        INTO old_message_count
        FROM json_array_elements(OLD.convo->'messages') AS message
        WHERE message->>'role' = 'user';

        SELECT COUNT(*)
        INTO new_message_count
        FROM json_array_elements(NEW.convo->'messages') AS message
        WHERE message->>'role' = 'user';

        -- Update only message count if conversation content changed
        UPDATE public.project_stats
        SET total_messages = COALESCE(total_messages, 0) - old_message_count + new_message_count
        WHERE project_name = NEW.course_name;

    ELSIF TG_OP = 'DELETE' THEN
        -- Calculate message count of deleted conversation
        SELECT COUNT(*)
        INTO old_message_count
        FROM json_array_elements(OLD.convo->'messages') AS message
        WHERE message->>'role' = 'user';

        -- Calculate distinct user count after the delete
        SELECT COUNT(DISTINCT user_email)
        INTO updated_distinct_user_count
        FROM public."llm-convo-monitor"
        WHERE course_name = OLD.course_name;

        -- Update project_stats for deleted conversation and messages
        UPDATE public.project_stats
        SET total_conversations = COALESCE(total_conversations, 0) - 1,
            total_messages = COALESCE(total_messages, 0) - old_message_count,
            unique_users = updated_distinct_user_count
        WHERE project_name = OLD.course_name;
    END IF;

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;


ALTER FUNCTION public.update_project_stats() OWNER TO postgres;

--
-- Name: update_total_messages_by_id_range(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_total_messages_by_id_range(start_id integer, end_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    project RECORD;
BEGIN
    -- Loop through projects within the specified id range in project_stats
    FOR project IN
        SELECT id, project_name
        FROM public.project_stats
        WHERE id BETWEEN start_id AND end_id
        ORDER BY id
    LOOP
        -- Update total messages for each project in the specified range
        UPDATE public.project_stats ps
        SET total_messages = (
            SELECT COALESCE(SUM(
                (SELECT COUNT(*)
                 FROM json_array_elements(lcm.convo->'messages') AS message
                 WHERE message->>'role' = 'user')
            ), 0)
            FROM public."llm-convo-monitor" lcm
            WHERE lcm.course_name = project.project_name
        )
        WHERE ps.id = project.id
        AND EXISTS (
            SELECT 1 FROM public."llm-convo-monitor" lcm
            WHERE lcm.course_name = project.project_name
        );

        -- Set total_messages to 0 if no conversations exist for the project
        UPDATE public.project_stats ps
        SET total_messages = 0
        WHERE ps.id = project.id
        AND NOT EXISTS (
            SELECT 1 FROM public."llm-convo-monitor" lcm
            WHERE lcm.course_name = project.project_name
        );

        -- Optional: Display progress
        RAISE NOTICE 'Updated total_messages for project: % with id: %', project.project_name, project.id;
    END LOOP;
END;
$$;


ALTER FUNCTION public.update_total_messages_by_id_range(start_id integer, end_id integer) OWNER TO postgres;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      PERFORM pg_notify(
          'realtime:system',
          jsonb_build_object(
              'error', SQLERRM,
              'function', 'realtime.send',
              'event', event,
              'topic', topic,
              'private', private
          )::text
      );
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
    select string_to_array(name, '/') into _parts;
    select _parts[array_length(_parts,1)] into _filename;
    -- @todo return the last part instead of 2
    return split_part(_filename, '.', 2);
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
    select string_to_array(name, '/') into _parts;
    return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
    select string_to_array(name, '/') into _parts;
    return _parts[1:array_length(_parts,1)-1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text) OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

--
-- Name: secrets_encrypt_secret_secret(); Type: FUNCTION; Schema: vault; Owner: supabase_admin
--

CREATE FUNCTION vault.secrets_encrypt_secret_secret() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
		BEGIN
		        new.secret = CASE WHEN new.secret IS NULL THEN NULL ELSE
			CASE WHEN new.key_id IS NULL THEN NULL ELSE pg_catalog.encode(
			  pgsodium.crypto_aead_det_encrypt(
				pg_catalog.convert_to(new.secret, 'utf8'),
				pg_catalog.convert_to((new.id::text || new.description::text || new.created_at::text || new.updated_at::text)::text, 'utf8'),
				new.key_id::uuid,
				new.nonce
			  ),
				'base64') END END;
		RETURN new;
		END;
		$$;


ALTER FUNCTION vault.secrets_encrypt_secret_secret() OWNER TO supabase_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: admin_event_entity; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.admin_event_entity (
    id character varying(36) NOT NULL,
    admin_event_time bigint,
    realm_id character varying(255),
    operation_type character varying(255),
    auth_realm_id character varying(255),
    auth_client_id character varying(255),
    auth_user_id character varying(255),
    ip_address character varying(255),
    resource_path character varying(2550),
    representation text,
    error character varying(255),
    resource_type character varying(64)
);


ALTER TABLE keycloak.admin_event_entity OWNER TO postgres;

--
-- Name: associated_policy; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.associated_policy (
    policy_id character varying(36) NOT NULL,
    associated_policy_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.associated_policy OWNER TO postgres;

--
-- Name: authentication_execution; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.authentication_execution (
    id character varying(36) NOT NULL,
    alias character varying(255),
    authenticator character varying(36),
    realm_id character varying(36),
    flow_id character varying(36),
    requirement integer,
    priority integer,
    authenticator_flow boolean DEFAULT false NOT NULL,
    auth_flow_id character varying(36),
    auth_config character varying(36)
);


ALTER TABLE keycloak.authentication_execution OWNER TO postgres;

--
-- Name: authentication_flow; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.authentication_flow (
    id character varying(36) NOT NULL,
    alias character varying(255),
    description character varying(255),
    realm_id character varying(36),
    provider_id character varying(36) DEFAULT 'basic-flow'::character varying NOT NULL,
    top_level boolean DEFAULT false NOT NULL,
    built_in boolean DEFAULT false NOT NULL
);


ALTER TABLE keycloak.authentication_flow OWNER TO postgres;

--
-- Name: authenticator_config; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.authenticator_config (
    id character varying(36) NOT NULL,
    alias character varying(255),
    realm_id character varying(36)
);


ALTER TABLE keycloak.authenticator_config OWNER TO postgres;

--
-- Name: authenticator_config_entry; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.authenticator_config_entry (
    authenticator_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE keycloak.authenticator_config_entry OWNER TO postgres;

--
-- Name: broker_link; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.broker_link (
    identity_provider character varying(255) NOT NULL,
    storage_provider_id character varying(255),
    realm_id character varying(36) NOT NULL,
    broker_user_id character varying(255),
    broker_username character varying(255),
    token text,
    user_id character varying(255) NOT NULL
);


ALTER TABLE keycloak.broker_link OWNER TO postgres;

--
-- Name: client; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.client (
    id character varying(36) NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    full_scope_allowed boolean DEFAULT false NOT NULL,
    client_id character varying(255),
    not_before integer,
    public_client boolean DEFAULT false NOT NULL,
    secret character varying(255),
    base_url character varying(255),
    bearer_only boolean DEFAULT false NOT NULL,
    management_url character varying(255),
    surrogate_auth_required boolean DEFAULT false NOT NULL,
    realm_id character varying(36),
    protocol character varying(255),
    node_rereg_timeout integer DEFAULT 0,
    frontchannel_logout boolean DEFAULT false NOT NULL,
    consent_required boolean DEFAULT false NOT NULL,
    name character varying(255),
    service_accounts_enabled boolean DEFAULT false NOT NULL,
    client_authenticator_type character varying(255),
    root_url character varying(255),
    description character varying(255),
    registration_token character varying(255),
    standard_flow_enabled boolean DEFAULT true NOT NULL,
    implicit_flow_enabled boolean DEFAULT false NOT NULL,
    direct_access_grants_enabled boolean DEFAULT false NOT NULL,
    always_display_in_console boolean DEFAULT false NOT NULL
);


ALTER TABLE keycloak.client OWNER TO postgres;

--
-- Name: client_attributes; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.client_attributes (
    client_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


ALTER TABLE keycloak.client_attributes OWNER TO postgres;

--
-- Name: client_auth_flow_bindings; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.client_auth_flow_bindings (
    client_id character varying(36) NOT NULL,
    flow_id character varying(36),
    binding_name character varying(255) NOT NULL
);


ALTER TABLE keycloak.client_auth_flow_bindings OWNER TO postgres;

--
-- Name: client_initial_access; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.client_initial_access (
    id character varying(36) NOT NULL,
    realm_id character varying(36) NOT NULL,
    "timestamp" integer,
    expiration integer,
    count integer,
    remaining_count integer
);


ALTER TABLE keycloak.client_initial_access OWNER TO postgres;

--
-- Name: client_node_registrations; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.client_node_registrations (
    client_id character varying(36) NOT NULL,
    value integer,
    name character varying(255) NOT NULL
);


ALTER TABLE keycloak.client_node_registrations OWNER TO postgres;

--
-- Name: client_scope; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.client_scope (
    id character varying(36) NOT NULL,
    name character varying(255),
    realm_id character varying(36),
    description character varying(255),
    protocol character varying(255)
);


ALTER TABLE keycloak.client_scope OWNER TO postgres;

--
-- Name: client_scope_attributes; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.client_scope_attributes (
    scope_id character varying(36) NOT NULL,
    value character varying(2048),
    name character varying(255) NOT NULL
);


ALTER TABLE keycloak.client_scope_attributes OWNER TO postgres;

--
-- Name: client_scope_client; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.client_scope_client (
    client_id character varying(255) NOT NULL,
    scope_id character varying(255) NOT NULL,
    default_scope boolean DEFAULT false NOT NULL
);


ALTER TABLE keycloak.client_scope_client OWNER TO postgres;

--
-- Name: client_scope_role_mapping; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.client_scope_role_mapping (
    scope_id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.client_scope_role_mapping OWNER TO postgres;

--
-- Name: client_session; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.client_session (
    id character varying(36) NOT NULL,
    client_id character varying(36),
    redirect_uri character varying(255),
    state character varying(255),
    "timestamp" integer,
    session_id character varying(36),
    auth_method character varying(255),
    realm_id character varying(255),
    auth_user_id character varying(36),
    current_action character varying(36)
);


ALTER TABLE keycloak.client_session OWNER TO postgres;

--
-- Name: client_session_auth_status; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.client_session_auth_status (
    authenticator character varying(36) NOT NULL,
    status integer,
    client_session character varying(36) NOT NULL
);


ALTER TABLE keycloak.client_session_auth_status OWNER TO postgres;

--
-- Name: client_session_note; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.client_session_note (
    name character varying(255) NOT NULL,
    value character varying(255),
    client_session character varying(36) NOT NULL
);


ALTER TABLE keycloak.client_session_note OWNER TO postgres;

--
-- Name: client_session_prot_mapper; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.client_session_prot_mapper (
    protocol_mapper_id character varying(36) NOT NULL,
    client_session character varying(36) NOT NULL
);


ALTER TABLE keycloak.client_session_prot_mapper OWNER TO postgres;

--
-- Name: client_session_role; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.client_session_role (
    role_id character varying(255) NOT NULL,
    client_session character varying(36) NOT NULL
);


ALTER TABLE keycloak.client_session_role OWNER TO postgres;

--
-- Name: client_user_session_note; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.client_user_session_note (
    name character varying(255) NOT NULL,
    value character varying(2048),
    client_session character varying(36) NOT NULL
);


ALTER TABLE keycloak.client_user_session_note OWNER TO postgres;

--
-- Name: component; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.component (
    id character varying(36) NOT NULL,
    name character varying(255),
    parent_id character varying(36),
    provider_id character varying(36),
    provider_type character varying(255),
    realm_id character varying(36),
    sub_type character varying(255)
);


ALTER TABLE keycloak.component OWNER TO postgres;

--
-- Name: component_config; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.component_config (
    id character varying(36) NOT NULL,
    component_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


ALTER TABLE keycloak.component_config OWNER TO postgres;

--
-- Name: composite_role; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.composite_role (
    composite character varying(36) NOT NULL,
    child_role character varying(36) NOT NULL
);


ALTER TABLE keycloak.composite_role OWNER TO postgres;

--
-- Name: credential; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.credential (
    id character varying(36) NOT NULL,
    salt bytea,
    type character varying(255),
    user_id character varying(36),
    created_date bigint,
    user_label character varying(255),
    secret_data text,
    credential_data text,
    priority integer
);


ALTER TABLE keycloak.credential OWNER TO postgres;

--
-- Name: databasechangelog; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.databasechangelog (
    id character varying(255) NOT NULL,
    author character varying(255) NOT NULL,
    filename character varying(255) NOT NULL,
    dateexecuted timestamp without time zone NOT NULL,
    orderexecuted integer NOT NULL,
    exectype character varying(10) NOT NULL,
    md5sum character varying(35),
    description character varying(255),
    comments character varying(255),
    tag character varying(255),
    liquibase character varying(20),
    contexts character varying(255),
    labels character varying(255),
    deployment_id character varying(10)
);


ALTER TABLE keycloak.databasechangelog OWNER TO postgres;

--
-- Name: databasechangeloglock; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.databasechangeloglock (
    id integer NOT NULL,
    locked boolean NOT NULL,
    lockgranted timestamp without time zone,
    lockedby character varying(255)
);


ALTER TABLE keycloak.databasechangeloglock OWNER TO postgres;

--
-- Name: default_client_scope; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.default_client_scope (
    realm_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL,
    default_scope boolean DEFAULT false NOT NULL
);


ALTER TABLE keycloak.default_client_scope OWNER TO postgres;

--
-- Name: event_entity; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.event_entity (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    details_json character varying(2550),
    error character varying(255),
    ip_address character varying(255),
    realm_id character varying(255),
    session_id character varying(255),
    event_time bigint,
    type character varying(255),
    user_id character varying(255),
    details_json_long_value text
);


ALTER TABLE keycloak.event_entity OWNER TO postgres;

--
-- Name: fed_user_attribute; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.fed_user_attribute (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    value character varying(2024),
    long_value_hash bytea,
    long_value_hash_lower_case bytea,
    long_value text
);


ALTER TABLE keycloak.fed_user_attribute OWNER TO postgres;

--
-- Name: fed_user_consent; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.fed_user_consent (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    created_date bigint,
    last_updated_date bigint,
    client_storage_provider character varying(36),
    external_client_id character varying(255)
);


ALTER TABLE keycloak.fed_user_consent OWNER TO postgres;

--
-- Name: fed_user_consent_cl_scope; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.fed_user_consent_cl_scope (
    user_consent_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.fed_user_consent_cl_scope OWNER TO postgres;

--
-- Name: fed_user_credential; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.fed_user_credential (
    id character varying(36) NOT NULL,
    salt bytea,
    type character varying(255),
    created_date bigint,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    user_label character varying(255),
    secret_data text,
    credential_data text,
    priority integer
);


ALTER TABLE keycloak.fed_user_credential OWNER TO postgres;

--
-- Name: fed_user_group_membership; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.fed_user_group_membership (
    group_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


ALTER TABLE keycloak.fed_user_group_membership OWNER TO postgres;

--
-- Name: fed_user_required_action; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.fed_user_required_action (
    required_action character varying(255) DEFAULT ' '::character varying NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


ALTER TABLE keycloak.fed_user_required_action OWNER TO postgres;

--
-- Name: fed_user_role_mapping; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.fed_user_role_mapping (
    role_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


ALTER TABLE keycloak.fed_user_role_mapping OWNER TO postgres;

--
-- Name: federated_identity; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.federated_identity (
    identity_provider character varying(255) NOT NULL,
    realm_id character varying(36),
    federated_user_id character varying(255),
    federated_username character varying(255),
    token text,
    user_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.federated_identity OWNER TO postgres;

--
-- Name: federated_user; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.federated_user (
    id character varying(255) NOT NULL,
    storage_provider_id character varying(255),
    realm_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.federated_user OWNER TO postgres;

--
-- Name: group_attribute; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.group_attribute (
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255),
    group_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.group_attribute OWNER TO postgres;

--
-- Name: group_role_mapping; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.group_role_mapping (
    role_id character varying(36) NOT NULL,
    group_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.group_role_mapping OWNER TO postgres;

--
-- Name: identity_provider; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.identity_provider (
    internal_id character varying(36) NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    provider_alias character varying(255),
    provider_id character varying(255),
    store_token boolean DEFAULT false NOT NULL,
    authenticate_by_default boolean DEFAULT false NOT NULL,
    realm_id character varying(36),
    add_token_role boolean DEFAULT true NOT NULL,
    trust_email boolean DEFAULT false NOT NULL,
    first_broker_login_flow_id character varying(36),
    post_broker_login_flow_id character varying(36),
    provider_display_name character varying(255),
    link_only boolean DEFAULT false NOT NULL
);


ALTER TABLE keycloak.identity_provider OWNER TO postgres;

--
-- Name: identity_provider_config; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.identity_provider_config (
    identity_provider_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE keycloak.identity_provider_config OWNER TO postgres;

--
-- Name: identity_provider_mapper; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.identity_provider_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    idp_alias character varying(255) NOT NULL,
    idp_mapper_name character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.identity_provider_mapper OWNER TO postgres;

--
-- Name: idp_mapper_config; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.idp_mapper_config (
    idp_mapper_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE keycloak.idp_mapper_config OWNER TO postgres;

--
-- Name: keycloak_group; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.keycloak_group (
    id character varying(36) NOT NULL,
    name character varying(255),
    parent_group character varying(36) NOT NULL,
    realm_id character varying(36)
);


ALTER TABLE keycloak.keycloak_group OWNER TO postgres;

--
-- Name: keycloak_role; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.keycloak_role (
    id character varying(36) NOT NULL,
    client_realm_constraint character varying(255),
    client_role boolean DEFAULT false NOT NULL,
    description character varying(255),
    name character varying(255),
    realm_id character varying(255),
    client character varying(36),
    realm character varying(36)
);


ALTER TABLE keycloak.keycloak_role OWNER TO postgres;

--
-- Name: migration_model; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.migration_model (
    id character varying(36) NOT NULL,
    version character varying(36),
    update_time bigint DEFAULT 0 NOT NULL
);


ALTER TABLE keycloak.migration_model OWNER TO postgres;

--
-- Name: offline_client_session; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.offline_client_session (
    user_session_id character varying(36) NOT NULL,
    client_id character varying(255) NOT NULL,
    offline_flag character varying(4) NOT NULL,
    "timestamp" integer,
    data text,
    client_storage_provider character varying(36) DEFAULT 'local'::character varying NOT NULL,
    external_client_id character varying(255) DEFAULT 'local'::character varying NOT NULL,
    version integer DEFAULT 0
);


ALTER TABLE keycloak.offline_client_session OWNER TO postgres;

--
-- Name: offline_user_session; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.offline_user_session (
    user_session_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    created_on integer NOT NULL,
    offline_flag character varying(4) NOT NULL,
    data text,
    last_session_refresh integer DEFAULT 0 NOT NULL,
    broker_session_id character varying(1024),
    version integer DEFAULT 0
);


ALTER TABLE keycloak.offline_user_session OWNER TO postgres;

--
-- Name: org; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.org (
    id character varying(255) NOT NULL,
    enabled boolean NOT NULL,
    realm_id character varying(255) NOT NULL,
    group_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(4000)
);


ALTER TABLE keycloak.org OWNER TO postgres;

--
-- Name: org_domain; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.org_domain (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    verified boolean NOT NULL,
    org_id character varying(255) NOT NULL
);


ALTER TABLE keycloak.org_domain OWNER TO postgres;

--
-- Name: policy_config; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.policy_config (
    policy_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


ALTER TABLE keycloak.policy_config OWNER TO postgres;

--
-- Name: protocol_mapper; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.protocol_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    protocol character varying(255) NOT NULL,
    protocol_mapper_name character varying(255) NOT NULL,
    client_id character varying(36),
    client_scope_id character varying(36)
);


ALTER TABLE keycloak.protocol_mapper OWNER TO postgres;

--
-- Name: protocol_mapper_config; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.protocol_mapper_config (
    protocol_mapper_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE keycloak.protocol_mapper_config OWNER TO postgres;

--
-- Name: realm; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.realm (
    id character varying(36) NOT NULL,
    access_code_lifespan integer,
    user_action_lifespan integer,
    access_token_lifespan integer,
    account_theme character varying(255),
    admin_theme character varying(255),
    email_theme character varying(255),
    enabled boolean DEFAULT false NOT NULL,
    events_enabled boolean DEFAULT false NOT NULL,
    events_expiration bigint,
    login_theme character varying(255),
    name character varying(255),
    not_before integer,
    password_policy character varying(2550),
    registration_allowed boolean DEFAULT false NOT NULL,
    remember_me boolean DEFAULT false NOT NULL,
    reset_password_allowed boolean DEFAULT false NOT NULL,
    social boolean DEFAULT false NOT NULL,
    ssl_required character varying(255),
    sso_idle_timeout integer,
    sso_max_lifespan integer,
    update_profile_on_soc_login boolean DEFAULT false NOT NULL,
    verify_email boolean DEFAULT false NOT NULL,
    master_admin_client character varying(36),
    login_lifespan integer,
    internationalization_enabled boolean DEFAULT false NOT NULL,
    default_locale character varying(255),
    reg_email_as_username boolean DEFAULT false NOT NULL,
    admin_events_enabled boolean DEFAULT false NOT NULL,
    admin_events_details_enabled boolean DEFAULT false NOT NULL,
    edit_username_allowed boolean DEFAULT false NOT NULL,
    otp_policy_counter integer DEFAULT 0,
    otp_policy_window integer DEFAULT 1,
    otp_policy_period integer DEFAULT 30,
    otp_policy_digits integer DEFAULT 6,
    otp_policy_alg character varying(36) DEFAULT 'HmacSHA1'::character varying,
    otp_policy_type character varying(36) DEFAULT 'totp'::character varying,
    browser_flow character varying(36),
    registration_flow character varying(36),
    direct_grant_flow character varying(36),
    reset_credentials_flow character varying(36),
    client_auth_flow character varying(36),
    offline_session_idle_timeout integer DEFAULT 0,
    revoke_refresh_token boolean DEFAULT false NOT NULL,
    access_token_life_implicit integer DEFAULT 0,
    login_with_email_allowed boolean DEFAULT true NOT NULL,
    duplicate_emails_allowed boolean DEFAULT false NOT NULL,
    docker_auth_flow character varying(36),
    refresh_token_max_reuse integer DEFAULT 0,
    allow_user_managed_access boolean DEFAULT false NOT NULL,
    sso_max_lifespan_remember_me integer DEFAULT 0 NOT NULL,
    sso_idle_timeout_remember_me integer DEFAULT 0 NOT NULL,
    default_role character varying(255)
);


ALTER TABLE keycloak.realm OWNER TO postgres;

--
-- Name: realm_attribute; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.realm_attribute (
    name character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    value text
);


ALTER TABLE keycloak.realm_attribute OWNER TO postgres;

--
-- Name: realm_default_groups; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.realm_default_groups (
    realm_id character varying(36) NOT NULL,
    group_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.realm_default_groups OWNER TO postgres;

--
-- Name: realm_enabled_event_types; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.realm_enabled_event_types (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE keycloak.realm_enabled_event_types OWNER TO postgres;

--
-- Name: realm_events_listeners; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.realm_events_listeners (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE keycloak.realm_events_listeners OWNER TO postgres;

--
-- Name: realm_localizations; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.realm_localizations (
    realm_id character varying(255) NOT NULL,
    locale character varying(255) NOT NULL,
    texts text NOT NULL
);


ALTER TABLE keycloak.realm_localizations OWNER TO postgres;

--
-- Name: realm_required_credential; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.realm_required_credential (
    type character varying(255) NOT NULL,
    form_label character varying(255),
    input boolean DEFAULT false NOT NULL,
    secret boolean DEFAULT false NOT NULL,
    realm_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.realm_required_credential OWNER TO postgres;

--
-- Name: realm_smtp_config; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.realm_smtp_config (
    realm_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE keycloak.realm_smtp_config OWNER TO postgres;

--
-- Name: realm_supported_locales; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.realm_supported_locales (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE keycloak.realm_supported_locales OWNER TO postgres;

--
-- Name: redirect_uris; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.redirect_uris (
    client_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE keycloak.redirect_uris OWNER TO postgres;

--
-- Name: required_action_config; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.required_action_config (
    required_action_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE keycloak.required_action_config OWNER TO postgres;

--
-- Name: required_action_provider; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.required_action_provider (
    id character varying(36) NOT NULL,
    alias character varying(255),
    name character varying(255),
    realm_id character varying(36),
    enabled boolean DEFAULT false NOT NULL,
    default_action boolean DEFAULT false NOT NULL,
    provider_id character varying(255),
    priority integer
);


ALTER TABLE keycloak.required_action_provider OWNER TO postgres;

--
-- Name: resource_attribute; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.resource_attribute (
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255),
    resource_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.resource_attribute OWNER TO postgres;

--
-- Name: resource_policy; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.resource_policy (
    resource_id character varying(36) NOT NULL,
    policy_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.resource_policy OWNER TO postgres;

--
-- Name: resource_scope; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.resource_scope (
    resource_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.resource_scope OWNER TO postgres;

--
-- Name: resource_server; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.resource_server (
    id character varying(36) NOT NULL,
    allow_rs_remote_mgmt boolean DEFAULT false NOT NULL,
    policy_enforce_mode smallint NOT NULL,
    decision_strategy smallint DEFAULT 1 NOT NULL
);


ALTER TABLE keycloak.resource_server OWNER TO postgres;

--
-- Name: resource_server_perm_ticket; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.resource_server_perm_ticket (
    id character varying(36) NOT NULL,
    owner character varying(255) NOT NULL,
    requester character varying(255) NOT NULL,
    created_timestamp bigint NOT NULL,
    granted_timestamp bigint,
    resource_id character varying(36) NOT NULL,
    scope_id character varying(36),
    resource_server_id character varying(36) NOT NULL,
    policy_id character varying(36)
);


ALTER TABLE keycloak.resource_server_perm_ticket OWNER TO postgres;

--
-- Name: resource_server_policy; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.resource_server_policy (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    type character varying(255) NOT NULL,
    decision_strategy smallint,
    logic smallint,
    resource_server_id character varying(36) NOT NULL,
    owner character varying(255)
);


ALTER TABLE keycloak.resource_server_policy OWNER TO postgres;

--
-- Name: resource_server_resource; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.resource_server_resource (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255),
    icon_uri character varying(255),
    owner character varying(255) NOT NULL,
    resource_server_id character varying(36) NOT NULL,
    owner_managed_access boolean DEFAULT false NOT NULL,
    display_name character varying(255)
);


ALTER TABLE keycloak.resource_server_resource OWNER TO postgres;

--
-- Name: resource_server_scope; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.resource_server_scope (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    icon_uri character varying(255),
    resource_server_id character varying(36) NOT NULL,
    display_name character varying(255)
);


ALTER TABLE keycloak.resource_server_scope OWNER TO postgres;

--
-- Name: resource_uris; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.resource_uris (
    resource_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE keycloak.resource_uris OWNER TO postgres;

--
-- Name: role_attribute; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.role_attribute (
    id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255)
);


ALTER TABLE keycloak.role_attribute OWNER TO postgres;

--
-- Name: scope_mapping; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.scope_mapping (
    client_id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.scope_mapping OWNER TO postgres;

--
-- Name: scope_policy; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.scope_policy (
    scope_id character varying(36) NOT NULL,
    policy_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.scope_policy OWNER TO postgres;

--
-- Name: user_attribute; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.user_attribute (
    name character varying(255) NOT NULL,
    value character varying(255),
    user_id character varying(36) NOT NULL,
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    long_value_hash bytea,
    long_value_hash_lower_case bytea,
    long_value text
);


ALTER TABLE keycloak.user_attribute OWNER TO postgres;

--
-- Name: user_consent; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.user_consent (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    user_id character varying(36) NOT NULL,
    created_date bigint,
    last_updated_date bigint,
    client_storage_provider character varying(36),
    external_client_id character varying(255)
);


ALTER TABLE keycloak.user_consent OWNER TO postgres;

--
-- Name: user_consent_client_scope; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.user_consent_client_scope (
    user_consent_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.user_consent_client_scope OWNER TO postgres;

--
-- Name: user_entity; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.user_entity (
    id character varying(36) NOT NULL,
    email character varying(255),
    email_constraint character varying(255),
    email_verified boolean DEFAULT false NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    federation_link character varying(255),
    first_name character varying(255),
    last_name character varying(255),
    realm_id character varying(255),
    username character varying(255),
    created_timestamp bigint,
    service_account_client_link character varying(255),
    not_before integer DEFAULT 0 NOT NULL
);


ALTER TABLE keycloak.user_entity OWNER TO postgres;

--
-- Name: user_federation_config; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.user_federation_config (
    user_federation_provider_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE keycloak.user_federation_config OWNER TO postgres;

--
-- Name: user_federation_mapper; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.user_federation_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    federation_provider_id character varying(36) NOT NULL,
    federation_mapper_type character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.user_federation_mapper OWNER TO postgres;

--
-- Name: user_federation_mapper_config; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.user_federation_mapper_config (
    user_federation_mapper_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE keycloak.user_federation_mapper_config OWNER TO postgres;

--
-- Name: user_federation_provider; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.user_federation_provider (
    id character varying(36) NOT NULL,
    changed_sync_period integer,
    display_name character varying(255),
    full_sync_period integer,
    last_sync integer,
    priority integer,
    provider_name character varying(255),
    realm_id character varying(36)
);


ALTER TABLE keycloak.user_federation_provider OWNER TO postgres;

--
-- Name: user_group_membership; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.user_group_membership (
    group_id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.user_group_membership OWNER TO postgres;

--
-- Name: user_required_action; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.user_required_action (
    user_id character varying(36) NOT NULL,
    required_action character varying(255) DEFAULT ' '::character varying NOT NULL
);


ALTER TABLE keycloak.user_required_action OWNER TO postgres;

--
-- Name: user_role_mapping; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.user_role_mapping (
    role_id character varying(255) NOT NULL,
    user_id character varying(36) NOT NULL
);


ALTER TABLE keycloak.user_role_mapping OWNER TO postgres;

--
-- Name: user_session; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.user_session (
    id character varying(36) NOT NULL,
    auth_method character varying(255),
    ip_address character varying(255),
    last_session_refresh integer,
    login_username character varying(255),
    realm_id character varying(255),
    remember_me boolean DEFAULT false NOT NULL,
    started integer,
    user_id character varying(255),
    user_session_state integer,
    broker_session_id character varying(255),
    broker_user_id character varying(255)
);


ALTER TABLE keycloak.user_session OWNER TO postgres;

--
-- Name: user_session_note; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.user_session_note (
    user_session character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(2048)
);


ALTER TABLE keycloak.user_session_note OWNER TO postgres;

--
-- Name: username_login_failure; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.username_login_failure (
    realm_id character varying(36) NOT NULL,
    username character varying(255) NOT NULL,
    failed_login_not_before integer,
    last_failure bigint,
    last_ip_failure character varying(255),
    num_failures integer
);


ALTER TABLE keycloak.username_login_failure OWNER TO postgres;

--
-- Name: web_origins; Type: TABLE; Schema: keycloak; Owner: postgres
--

CREATE TABLE keycloak.web_origins (
    client_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE keycloak.web_origins OWNER TO postgres;

--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_keys (
    user_id text NOT NULL,
    key text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    modified_at timestamp with time zone DEFAULT now() NOT NULL,
    usage_count bigint DEFAULT '0'::bigint NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    keycloak_id character varying(255),
    email character varying(255)
);


ALTER TABLE public.api_keys OWNER TO postgres;

--
-- Name: COLUMN api_keys.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.api_keys.user_id IS 'User ID from Clerk auth';


--
-- Name: cedar_chunks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cedar_chunks (
    id bigint NOT NULL,
    document_id integer NOT NULL,
    segment_id integer,
    chunk_number integer NOT NULL,
    chunk_type text NOT NULL,
    content text NOT NULL,
    table_html text,
    table_image_paths text[],
    table_data json,
    chunk_metadata json,
    orig_elements text,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.cedar_chunks OWNER TO postgres;

--
-- Name: cedar_chunks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.cedar_chunks ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cedar_chunks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cedar_document_metadata; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cedar_document_metadata (
    id integer NOT NULL,
    document_id integer NOT NULL,
    field_name character varying NOT NULL,
    field_value json,
    confidence_score integer,
    extraction_method character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    run_id bigint,
    prompt text
);


ALTER TABLE public.cedar_document_metadata OWNER TO postgres;

--
-- Name: cedar_document_metadata_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cedar_document_metadata_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cedar_document_metadata_id_seq OWNER TO postgres;

--
-- Name: cedar_document_metadata_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cedar_document_metadata_id_seq OWNED BY public.cedar_document_metadata.id;


--
-- Name: cedar_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cedar_documents (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    course_name character varying,
    readable_filename character varying,
    s3_path character varying,
    url character varying,
    base_url character varying,
    last_error character varying
);


ALTER TABLE public.cedar_documents OWNER TO postgres;

--
-- Name: cedar_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cedar_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cedar_documents_id_seq OWNER TO postgres;

--
-- Name: cedar_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cedar_documents_id_seq OWNED BY public.cedar_documents.id;


--
-- Name: cedar_documents_id_seq1; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.cedar_documents ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cedar_documents_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cedar_runs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cedar_runs (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    run_id bigint NOT NULL,
    document_id integer,
    readable_filename character varying,
    run_status character varying,
    last_error character varying,
    prompt text
);


ALTER TABLE public.cedar_runs OWNER TO postgres;

--
-- Name: cedar_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.cedar_runs ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cedar_runs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    model character varying(100) NOT NULL,
    prompt text NOT NULL,
    temperature double precision NOT NULL,
    user_email character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    project_name text DEFAULT ''::text NOT NULL,
    folder_id uuid
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: course_names; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_names (
    course_name text
);


ALTER TABLE public.course_names OWNER TO postgres;

--
-- Name: cropwizard-papers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."cropwizard-papers" (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    doi text,
    publisher text,
    license text,
    metadata jsonb
);


ALTER TABLE public."cropwizard-papers" OWNER TO postgres;

--
-- Name: TABLE "cropwizard-papers"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public."cropwizard-papers" IS 'Metadata about research papers ingested in cropwizard';


--
-- Name: cropwizard-papers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public."cropwizard-papers" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."cropwizard-papers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: depricated_uiuc_chatbot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.depricated_uiuc_chatbot (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    metadata json,
    content text
);


ALTER TABLE public.depricated_uiuc_chatbot OWNER TO postgres;

--
-- Name: TABLE depricated_uiuc_chatbot; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.depricated_uiuc_chatbot IS 'Depricated course materials';


--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    s3_path text,
    readable_filename text,
    course_name text,
    url text,
    contexts jsonb,
    base_url text
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: TABLE documents; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.documents IS 'Course materials, full info for each document';


--
-- Name: COLUMN documents.base_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.documents.base_url IS 'Input url for web scraping function';


--
-- Name: distinct_course_names; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.distinct_course_names AS
 SELECT DISTINCT documents.course_name
   FROM public.documents;


ALTER TABLE public.distinct_course_names OWNER TO postgres;

--
-- Name: doc_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doc_groups (
    id bigint NOT NULL,
    name text NOT NULL,
    course_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    private boolean DEFAULT true NOT NULL,
    doc_count bigint DEFAULT '0'::bigint
);


ALTER TABLE public.doc_groups OWNER TO postgres;

--
-- Name: TABLE doc_groups; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.doc_groups IS 'This table is to store metadata for the document groups';


--
-- Name: doc_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.doc_groups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.doc_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: doc_groups_sharing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doc_groups_sharing (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    destination_project_id bigint,
    doc_group_id bigint,
    destination_project_name character varying,
    doc_group_name text
);


ALTER TABLE public.doc_groups_sharing OWNER TO postgres;

--
-- Name: TABLE doc_groups_sharing; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.doc_groups_sharing IS '`Source` - the document group being cloned. `Destination` - the project doing the cloning. e.g. Cropwizard (Source) is cloned into Industry Partner project (Destination).';


--
-- Name: doc_groups_sharing_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.doc_groups_sharing ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.doc_groups_sharing_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: documents_doc_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_doc_groups (
    document_id bigint NOT NULL,
    doc_group_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.documents_doc_groups OWNER TO postgres;

--
-- Name: TABLE documents_doc_groups; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.documents_doc_groups IS 'This is a junction table between documents and doc_groups';


--
-- Name: documents_doc_groups_document_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.documents_doc_groups ALTER COLUMN document_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.documents_doc_groups_document_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: documents_failed; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_failed (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    s3_path text,
    readable_filename text,
    course_name text,
    url text,
    contexts jsonb,
    base_url text,
    doc_groups text,
    error text
);


ALTER TABLE public.documents_failed OWNER TO postgres;

--
-- Name: TABLE documents_failed; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.documents_failed IS 'Documents that failed to ingest. If we retry and they succeed, it should be removed from this table.';


--
-- Name: documents_failed_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.documents_failed ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.documents_failed_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.documents ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.documents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: documents_in_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_in_progress (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    s3_path text,
    readable_filename text,
    course_name text,
    url text,
    contexts jsonb,
    base_url text,
    doc_groups text,
    error text,
    beam_task_id text
);


ALTER TABLE public.documents_in_progress OWNER TO postgres;

--
-- Name: TABLE documents_in_progress; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.documents_in_progress IS 'Document ingest in progress. In Beam.cloud ingest queue.';


--
-- Name: documents_in_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.documents_in_progress ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.documents_in_progress_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: email-newsletter; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."email-newsletter" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    email text,
    "unsubscribed-from-newsletter" boolean
);


ALTER TABLE public."email-newsletter" OWNER TO postgres;

--
-- Name: folders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.folders (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    user_email character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL,
    type text,
    updated_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text)
);


ALTER TABLE public.folders OWNER TO postgres;

--
-- Name: llm-convo-monitor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."llm-convo-monitor" (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    convo json,
    convo_id text,
    course_name text,
    user_email text,
    summary text,
    convo_analysis_tags jsonb
);


ALTER TABLE public."llm-convo-monitor" OWNER TO postgres;

--
-- Name: COLUMN "llm-convo-monitor".convo_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."llm-convo-monitor".convo_id IS 'id from Conversation object in Typescript.';


--
-- Name: COLUMN "llm-convo-monitor".user_email; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."llm-convo-monitor".user_email IS 'The users'' email address (first email only, if they have multiple)';


--
-- Name: COLUMN "llm-convo-monitor".summary; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."llm-convo-monitor".summary IS 'Running summary of conversation';


--
-- Name: COLUMN "llm-convo-monitor".convo_analysis_tags; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."llm-convo-monitor".convo_analysis_tags IS 'A json array of tags / categories that an LLM has tagged this conversation with.';


--
-- Name: llm-convo-monitor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public."llm-convo-monitor" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."llm-convo-monitor_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: llm-guided-contexts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."llm-guided-contexts" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    text text,
    num_tokens text,
    stop_reason text,
    doc_id uuid,
    section_id uuid
);


ALTER TABLE public."llm-guided-contexts" OWNER TO postgres;

--
-- Name: TABLE "llm-guided-contexts"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public."llm-guided-contexts" IS 'PROTOTYPE';


--
-- Name: COLUMN "llm-guided-contexts".doc_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."llm-guided-contexts".doc_id IS 'A foreign key to the document ID';


--
-- Name: COLUMN "llm-guided-contexts".section_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."llm-guided-contexts".section_id IS 'A foreign key link to the appropriate doc section.';


--
-- Name: llm-guided-docs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."llm-guided-docs" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    num_tokens bigint,
    date_published timestamp with time zone,
    authors text,
    outline text,
    minio_path text,
    title text
);


ALTER TABLE public."llm-guided-docs" OWNER TO postgres;

--
-- Name: TABLE "llm-guided-docs"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public."llm-guided-docs" IS 'PROTOTYPE ONLY.';


--
-- Name: COLUMN "llm-guided-docs".title; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."llm-guided-docs".title IS 'Document title.';


--
-- Name: llm-guided-sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."llm-guided-sections" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    num_tokens bigint,
    section_title text,
    section_num text,
    doc_id uuid
);


ALTER TABLE public."llm-guided-sections" OWNER TO postgres;

--
-- Name: TABLE "llm-guided-sections"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public."llm-guided-sections" IS 'PROTOTYPE ONLY';


--
-- Name: COLUMN "llm-guided-sections".section_num; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."llm-guided-sections".section_num IS 'Could be a section number or the name of a biblography references to a paper & authors. i.e. BIBREF0 and section-title will be the full text citation.';


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid NOT NULL,
    conversation_id uuid,
    role character varying(50) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    content_text text NOT NULL,
    contexts jsonb,
    tools jsonb,
    latest_system_message text,
    final_prompt_engineered_message text,
    response_time_sec integer,
    updated_at timestamp with time zone,
    content_image_url text[],
    image_description text,
    feedback_is_positive boolean,
    feedback_category text,
    feedback_details text,
    was_query_rewritten boolean,
    query_rewrite_text text,
    processed_content text,
    "llm-monitor-tags" jsonb
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: COLUMN messages."llm-monitor-tags"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages."llm-monitor-tags" IS 'Tags created by an LLM monitor';


--
-- Name: n8n_workflows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.n8n_workflows (
    latest_workflow_id bigint NOT NULL,
    is_locked boolean NOT NULL
);


ALTER TABLE public.n8n_workflows OWNER TO postgres;

--
-- Name: TABLE n8n_workflows; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.n8n_workflows IS 'Just the highest number of the latest workflow being run...';


--
-- Name: COLUMN n8n_workflows.latest_workflow_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.n8n_workflows.latest_workflow_id IS 'The highest possible workflow number as it corresponds to N8n workflow IDs.';


--
-- Name: COLUMN n8n_workflows.is_locked; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.n8n_workflows.is_locked IS 'During the time between when we getExpectedWorkflowID and the time that we actually start the workflow, another workflow could be started.';


--
-- Name: n8n_api_keys_in_progress_workflow_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.n8n_workflows ALTER COLUMN latest_workflow_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.n8n_api_keys_in_progress_workflow_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: nal_publications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nal_publications (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    doi text,
    title text,
    publisher text,
    license text,
    doi_number text,
    metadata jsonb,
    link text,
    ingested boolean DEFAULT false NOT NULL,
    downloadable boolean DEFAULT true NOT NULL,
    notes text,
    modified_date timestamp without time zone DEFAULT now()
);


ALTER TABLE public.nal_publications OWNER TO postgres;

--
-- Name: nal_publications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.nal_publications ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.nal_publications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: pre_authorized_api_keys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pre_authorized_api_keys (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    "providerBodyNoModels" jsonb,
    emails jsonb,
    "providerName" public."LLMProvider",
    notes text
);


ALTER TABLE public.pre_authorized_api_keys OWNER TO postgres;

--
-- Name: TABLE pre_authorized_api_keys; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.pre_authorized_api_keys IS 'These users have access to pre-authorized API keys';


--
-- Name: COLUMN pre_authorized_api_keys."providerBodyNoModels"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pre_authorized_api_keys."providerBodyNoModels" IS 'The given LLM Provider''s Body JSON, with everything EXCEPT models, which will be grabbed dynamically.';


--
-- Name: COLUMN pre_authorized_api_keys."providerName"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pre_authorized_api_keys."providerName" IS 'One of "azure", "openai", "anthropic", "google"... etc.';


--
-- Name: COLUMN pre_authorized_api_keys.notes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pre_authorized_api_keys.notes IS 'Just general reference info';


--
-- Name: pre-authorized-api-keys_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.pre_authorized_api_keys ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."pre-authorized-api-keys_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: project_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_stats (
    id bigint NOT NULL,
    project_id bigint,
    project_name character varying,
    total_conversations bigint DEFAULT '0'::bigint,
    total_messages bigint DEFAULT '0'::bigint,
    unique_users bigint DEFAULT '0'::bigint,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    model_usage_counts jsonb
);


ALTER TABLE public.project_stats OWNER TO postgres;

--
-- Name: project_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.project_stats ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.project_stats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    course_name character varying,
    doc_map_id character varying,
    convo_map_id character varying,
    n8n_api_key text,
    last_uploaded_doc_id bigint,
    last_uploaded_convo_id bigint,
    subscribed bigint,
    description text,
    metadata_schema json,
    conversation_map_index text,
    document_map_index text
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: COLUMN projects.n8n_api_key; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.projects.n8n_api_key IS 'N8N API key(s) for each course. If multiple users create tools, they EACH need to store their API key.';


--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.projects ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.projects_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: publications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.publications (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    pmid character varying NOT NULL,
    pmcid character varying,
    doi character varying,
    journal_title character varying,
    article_title character varying,
    issn character varying,
    published date,
    last_revised date,
    license character varying,
    modified_at timestamp with time zone DEFAULT now(),
    full_text boolean,
    live boolean,
    release_date date,
    pubmed_ftp_link text,
    filepath text,
    xml_filename text
);


ALTER TABLE public.publications OWNER TO postgres;

--
-- Name: COLUMN publications.filepath; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.publications.filepath IS 'A comma-separated list of filepaths. Either to the .txt for abstracts, or to PDFs for full text. There can be multiple PDFs (supplementary materials, etc) per article.';


--
-- Name: publications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.publications ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.publications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: pubmed_daily_update; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pubmed_daily_update (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_xml_file text,
    status text
);


ALTER TABLE public.pubmed_daily_update OWNER TO postgres;

--
-- Name: TABLE pubmed_daily_update; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.pubmed_daily_update IS 'Table to keep track of all the XML files we have processed';


--
-- Name: pubmed_daily_update_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.pubmed_daily_update ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.pubmed_daily_update_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: uiuc-chatbot_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.depricated_uiuc_chatbot ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."uiuc-chatbot_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: uiuc-course-table; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."uiuc-course-table" (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    total_tokens real,
    total_prompt_price real,
    total_completions_price real,
    total_embeddings_price real,
    total_queries real,
    course_name text
);


ALTER TABLE public."uiuc-course-table" OWNER TO postgres;

--
-- Name: TABLE "uiuc-course-table"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public."uiuc-course-table" IS 'Details about each course';


--
-- Name: uiuc-course-table_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public."uiuc-course-table" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."uiuc-course-table_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: usage_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usage_metrics (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    course_name text,
    total_docs bigint,
    total_convos bigint,
    most_recent_convo timestamp without time zone,
    owner_name text,
    admin_name text
);


ALTER TABLE public.usage_metrics OWNER TO postgres;

--
-- Name: usage_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.usage_metrics ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.usage_metrics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: postgres
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


ALTER TABLE supabase_migrations.schema_migrations OWNER TO postgres;

--
-- Name: decrypted_secrets; Type: VIEW; Schema: vault; Owner: supabase_admin
--

CREATE VIEW vault.decrypted_secrets AS
 SELECT secrets.id,
    secrets.name,
    secrets.description,
    secrets.secret,
        CASE
            WHEN (secrets.secret IS NULL) THEN NULL::text
            ELSE
            CASE
                WHEN (secrets.key_id IS NULL) THEN NULL::text
                ELSE convert_from(pgsodium.crypto_aead_det_decrypt(decode(secrets.secret, 'base64'::text), convert_to(((((secrets.id)::text || secrets.description) || (secrets.created_at)::text) || (secrets.updated_at)::text), 'utf8'::name), secrets.key_id, secrets.nonce), 'utf8'::name)
            END
        END AS decrypted_secret,
    secrets.key_id,
    secrets.nonce,
    secrets.created_at,
    secrets.updated_at
   FROM vault.secrets;


ALTER TABLE vault.decrypted_secrets OWNER TO supabase_admin;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: cedar_document_metadata id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cedar_document_metadata ALTER COLUMN id SET DEFAULT nextval('public.cedar_document_metadata_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: username_login_failure CONSTRAINT_17-2; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.username_login_failure
    ADD CONSTRAINT "CONSTRAINT_17-2" PRIMARY KEY (realm_id, username);


--
-- Name: org_domain ORG_DOMAIN_pkey; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.org_domain
    ADD CONSTRAINT "ORG_DOMAIN_pkey" PRIMARY KEY (id, name);


--
-- Name: org ORG_pkey; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.org
    ADD CONSTRAINT "ORG_pkey" PRIMARY KEY (id);


--
-- Name: keycloak_role UK_J3RWUVD56ONTGSUHOGM184WW2-2; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.keycloak_role
    ADD CONSTRAINT "UK_J3RWUVD56ONTGSUHOGM184WW2-2" UNIQUE (name, client_realm_constraint);


--
-- Name: client_auth_flow_bindings c_cli_flow_bind; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_auth_flow_bindings
    ADD CONSTRAINT c_cli_flow_bind PRIMARY KEY (client_id, binding_name);


--
-- Name: client_scope_client c_cli_scope_bind; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_scope_client
    ADD CONSTRAINT c_cli_scope_bind PRIMARY KEY (client_id, scope_id);


--
-- Name: client_initial_access cnstr_client_init_acc_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_initial_access
    ADD CONSTRAINT cnstr_client_init_acc_pk PRIMARY KEY (id);


--
-- Name: realm_default_groups con_group_id_def_groups; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.realm_default_groups
    ADD CONSTRAINT con_group_id_def_groups UNIQUE (group_id);


--
-- Name: broker_link constr_broker_link_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.broker_link
    ADD CONSTRAINT constr_broker_link_pk PRIMARY KEY (identity_provider, user_id);


--
-- Name: client_user_session_note constr_cl_usr_ses_note; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_user_session_note
    ADD CONSTRAINT constr_cl_usr_ses_note PRIMARY KEY (client_session, name);


--
-- Name: component_config constr_component_config_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.component_config
    ADD CONSTRAINT constr_component_config_pk PRIMARY KEY (id);


--
-- Name: component constr_component_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.component
    ADD CONSTRAINT constr_component_pk PRIMARY KEY (id);


--
-- Name: fed_user_required_action constr_fed_required_action; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.fed_user_required_action
    ADD CONSTRAINT constr_fed_required_action PRIMARY KEY (required_action, user_id);


--
-- Name: fed_user_attribute constr_fed_user_attr_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.fed_user_attribute
    ADD CONSTRAINT constr_fed_user_attr_pk PRIMARY KEY (id);


--
-- Name: fed_user_consent constr_fed_user_consent_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.fed_user_consent
    ADD CONSTRAINT constr_fed_user_consent_pk PRIMARY KEY (id);


--
-- Name: fed_user_credential constr_fed_user_cred_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.fed_user_credential
    ADD CONSTRAINT constr_fed_user_cred_pk PRIMARY KEY (id);


--
-- Name: fed_user_group_membership constr_fed_user_group; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.fed_user_group_membership
    ADD CONSTRAINT constr_fed_user_group PRIMARY KEY (group_id, user_id);


--
-- Name: fed_user_role_mapping constr_fed_user_role; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.fed_user_role_mapping
    ADD CONSTRAINT constr_fed_user_role PRIMARY KEY (role_id, user_id);


--
-- Name: federated_user constr_federated_user; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.federated_user
    ADD CONSTRAINT constr_federated_user PRIMARY KEY (id);


--
-- Name: realm_default_groups constr_realm_default_groups; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.realm_default_groups
    ADD CONSTRAINT constr_realm_default_groups PRIMARY KEY (realm_id, group_id);


--
-- Name: realm_enabled_event_types constr_realm_enabl_event_types; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.realm_enabled_event_types
    ADD CONSTRAINT constr_realm_enabl_event_types PRIMARY KEY (realm_id, value);


--
-- Name: realm_events_listeners constr_realm_events_listeners; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.realm_events_listeners
    ADD CONSTRAINT constr_realm_events_listeners PRIMARY KEY (realm_id, value);


--
-- Name: realm_supported_locales constr_realm_supported_locales; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.realm_supported_locales
    ADD CONSTRAINT constr_realm_supported_locales PRIMARY KEY (realm_id, value);


--
-- Name: identity_provider constraint_2b; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.identity_provider
    ADD CONSTRAINT constraint_2b PRIMARY KEY (internal_id);


--
-- Name: client_attributes constraint_3c; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_attributes
    ADD CONSTRAINT constraint_3c PRIMARY KEY (client_id, name);


--
-- Name: event_entity constraint_4; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.event_entity
    ADD CONSTRAINT constraint_4 PRIMARY KEY (id);


--
-- Name: federated_identity constraint_40; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.federated_identity
    ADD CONSTRAINT constraint_40 PRIMARY KEY (identity_provider, user_id);


--
-- Name: realm constraint_4a; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.realm
    ADD CONSTRAINT constraint_4a PRIMARY KEY (id);


--
-- Name: client_session_role constraint_5; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_session_role
    ADD CONSTRAINT constraint_5 PRIMARY KEY (client_session, role_id);


--
-- Name: user_session constraint_57; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_session
    ADD CONSTRAINT constraint_57 PRIMARY KEY (id);


--
-- Name: user_federation_provider constraint_5c; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_federation_provider
    ADD CONSTRAINT constraint_5c PRIMARY KEY (id);


--
-- Name: client_session_note constraint_5e; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_session_note
    ADD CONSTRAINT constraint_5e PRIMARY KEY (client_session, name);


--
-- Name: client constraint_7; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client
    ADD CONSTRAINT constraint_7 PRIMARY KEY (id);


--
-- Name: client_session constraint_8; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_session
    ADD CONSTRAINT constraint_8 PRIMARY KEY (id);


--
-- Name: scope_mapping constraint_81; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.scope_mapping
    ADD CONSTRAINT constraint_81 PRIMARY KEY (client_id, role_id);


--
-- Name: client_node_registrations constraint_84; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_node_registrations
    ADD CONSTRAINT constraint_84 PRIMARY KEY (client_id, name);


--
-- Name: realm_attribute constraint_9; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.realm_attribute
    ADD CONSTRAINT constraint_9 PRIMARY KEY (name, realm_id);


--
-- Name: realm_required_credential constraint_92; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.realm_required_credential
    ADD CONSTRAINT constraint_92 PRIMARY KEY (realm_id, type);


--
-- Name: keycloak_role constraint_a; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.keycloak_role
    ADD CONSTRAINT constraint_a PRIMARY KEY (id);


--
-- Name: admin_event_entity constraint_admin_event_entity; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.admin_event_entity
    ADD CONSTRAINT constraint_admin_event_entity PRIMARY KEY (id);


--
-- Name: authenticator_config_entry constraint_auth_cfg_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.authenticator_config_entry
    ADD CONSTRAINT constraint_auth_cfg_pk PRIMARY KEY (authenticator_id, name);


--
-- Name: authentication_execution constraint_auth_exec_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.authentication_execution
    ADD CONSTRAINT constraint_auth_exec_pk PRIMARY KEY (id);


--
-- Name: authentication_flow constraint_auth_flow_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.authentication_flow
    ADD CONSTRAINT constraint_auth_flow_pk PRIMARY KEY (id);


--
-- Name: authenticator_config constraint_auth_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.authenticator_config
    ADD CONSTRAINT constraint_auth_pk PRIMARY KEY (id);


--
-- Name: client_session_auth_status constraint_auth_status_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_session_auth_status
    ADD CONSTRAINT constraint_auth_status_pk PRIMARY KEY (client_session, authenticator);


--
-- Name: user_role_mapping constraint_c; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_role_mapping
    ADD CONSTRAINT constraint_c PRIMARY KEY (role_id, user_id);


--
-- Name: composite_role constraint_composite_role; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.composite_role
    ADD CONSTRAINT constraint_composite_role PRIMARY KEY (composite, child_role);


--
-- Name: client_session_prot_mapper constraint_cs_pmp_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_session_prot_mapper
    ADD CONSTRAINT constraint_cs_pmp_pk PRIMARY KEY (client_session, protocol_mapper_id);


--
-- Name: identity_provider_config constraint_d; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.identity_provider_config
    ADD CONSTRAINT constraint_d PRIMARY KEY (identity_provider_id, name);


--
-- Name: policy_config constraint_dpc; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.policy_config
    ADD CONSTRAINT constraint_dpc PRIMARY KEY (policy_id, name);


--
-- Name: realm_smtp_config constraint_e; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.realm_smtp_config
    ADD CONSTRAINT constraint_e PRIMARY KEY (realm_id, name);


--
-- Name: credential constraint_f; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.credential
    ADD CONSTRAINT constraint_f PRIMARY KEY (id);


--
-- Name: user_federation_config constraint_f9; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_federation_config
    ADD CONSTRAINT constraint_f9 PRIMARY KEY (user_federation_provider_id, name);


--
-- Name: resource_server_perm_ticket constraint_fapmt; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_server_perm_ticket
    ADD CONSTRAINT constraint_fapmt PRIMARY KEY (id);


--
-- Name: resource_server_resource constraint_farsr; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_server_resource
    ADD CONSTRAINT constraint_farsr PRIMARY KEY (id);


--
-- Name: resource_server_policy constraint_farsrp; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_server_policy
    ADD CONSTRAINT constraint_farsrp PRIMARY KEY (id);


--
-- Name: associated_policy constraint_farsrpap; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.associated_policy
    ADD CONSTRAINT constraint_farsrpap PRIMARY KEY (policy_id, associated_policy_id);


--
-- Name: resource_policy constraint_farsrpp; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_policy
    ADD CONSTRAINT constraint_farsrpp PRIMARY KEY (resource_id, policy_id);


--
-- Name: resource_server_scope constraint_farsrs; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_server_scope
    ADD CONSTRAINT constraint_farsrs PRIMARY KEY (id);


--
-- Name: resource_scope constraint_farsrsp; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_scope
    ADD CONSTRAINT constraint_farsrsp PRIMARY KEY (resource_id, scope_id);


--
-- Name: scope_policy constraint_farsrsps; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.scope_policy
    ADD CONSTRAINT constraint_farsrsps PRIMARY KEY (scope_id, policy_id);


--
-- Name: user_entity constraint_fb; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_entity
    ADD CONSTRAINT constraint_fb PRIMARY KEY (id);


--
-- Name: user_federation_mapper_config constraint_fedmapper_cfg_pm; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_federation_mapper_config
    ADD CONSTRAINT constraint_fedmapper_cfg_pm PRIMARY KEY (user_federation_mapper_id, name);


--
-- Name: user_federation_mapper constraint_fedmapperpm; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_federation_mapper
    ADD CONSTRAINT constraint_fedmapperpm PRIMARY KEY (id);


--
-- Name: fed_user_consent_cl_scope constraint_fgrntcsnt_clsc_pm; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.fed_user_consent_cl_scope
    ADD CONSTRAINT constraint_fgrntcsnt_clsc_pm PRIMARY KEY (user_consent_id, scope_id);


--
-- Name: user_consent_client_scope constraint_grntcsnt_clsc_pm; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_consent_client_scope
    ADD CONSTRAINT constraint_grntcsnt_clsc_pm PRIMARY KEY (user_consent_id, scope_id);


--
-- Name: user_consent constraint_grntcsnt_pm; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_consent
    ADD CONSTRAINT constraint_grntcsnt_pm PRIMARY KEY (id);


--
-- Name: keycloak_group constraint_group; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.keycloak_group
    ADD CONSTRAINT constraint_group PRIMARY KEY (id);


--
-- Name: group_attribute constraint_group_attribute_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.group_attribute
    ADD CONSTRAINT constraint_group_attribute_pk PRIMARY KEY (id);


--
-- Name: group_role_mapping constraint_group_role; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.group_role_mapping
    ADD CONSTRAINT constraint_group_role PRIMARY KEY (role_id, group_id);


--
-- Name: identity_provider_mapper constraint_idpm; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.identity_provider_mapper
    ADD CONSTRAINT constraint_idpm PRIMARY KEY (id);


--
-- Name: idp_mapper_config constraint_idpmconfig; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.idp_mapper_config
    ADD CONSTRAINT constraint_idpmconfig PRIMARY KEY (idp_mapper_id, name);


--
-- Name: migration_model constraint_migmod; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.migration_model
    ADD CONSTRAINT constraint_migmod PRIMARY KEY (id);


--
-- Name: offline_client_session constraint_offl_cl_ses_pk3; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.offline_client_session
    ADD CONSTRAINT constraint_offl_cl_ses_pk3 PRIMARY KEY (user_session_id, client_id, client_storage_provider, external_client_id, offline_flag);


--
-- Name: offline_user_session constraint_offl_us_ses_pk2; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.offline_user_session
    ADD CONSTRAINT constraint_offl_us_ses_pk2 PRIMARY KEY (user_session_id, offline_flag);


--
-- Name: protocol_mapper constraint_pcm; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.protocol_mapper
    ADD CONSTRAINT constraint_pcm PRIMARY KEY (id);


--
-- Name: protocol_mapper_config constraint_pmconfig; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.protocol_mapper_config
    ADD CONSTRAINT constraint_pmconfig PRIMARY KEY (protocol_mapper_id, name);


--
-- Name: redirect_uris constraint_redirect_uris; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.redirect_uris
    ADD CONSTRAINT constraint_redirect_uris PRIMARY KEY (client_id, value);


--
-- Name: required_action_config constraint_req_act_cfg_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.required_action_config
    ADD CONSTRAINT constraint_req_act_cfg_pk PRIMARY KEY (required_action_id, name);


--
-- Name: required_action_provider constraint_req_act_prv_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.required_action_provider
    ADD CONSTRAINT constraint_req_act_prv_pk PRIMARY KEY (id);


--
-- Name: user_required_action constraint_required_action; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_required_action
    ADD CONSTRAINT constraint_required_action PRIMARY KEY (required_action, user_id);


--
-- Name: resource_uris constraint_resour_uris_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_uris
    ADD CONSTRAINT constraint_resour_uris_pk PRIMARY KEY (resource_id, value);


--
-- Name: role_attribute constraint_role_attribute_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.role_attribute
    ADD CONSTRAINT constraint_role_attribute_pk PRIMARY KEY (id);


--
-- Name: user_attribute constraint_user_attribute_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_attribute
    ADD CONSTRAINT constraint_user_attribute_pk PRIMARY KEY (id);


--
-- Name: user_group_membership constraint_user_group; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_group_membership
    ADD CONSTRAINT constraint_user_group PRIMARY KEY (group_id, user_id);


--
-- Name: user_session_note constraint_usn_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_session_note
    ADD CONSTRAINT constraint_usn_pk PRIMARY KEY (user_session, name);


--
-- Name: web_origins constraint_web_origins; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.web_origins
    ADD CONSTRAINT constraint_web_origins PRIMARY KEY (client_id, value);


--
-- Name: databasechangeloglock databasechangeloglock_pkey; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.databasechangeloglock
    ADD CONSTRAINT databasechangeloglock_pkey PRIMARY KEY (id);


--
-- Name: client_scope_attributes pk_cl_tmpl_attr; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_scope_attributes
    ADD CONSTRAINT pk_cl_tmpl_attr PRIMARY KEY (scope_id, name);


--
-- Name: client_scope pk_cli_template; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_scope
    ADD CONSTRAINT pk_cli_template PRIMARY KEY (id);


--
-- Name: resource_server pk_resource_server; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_server
    ADD CONSTRAINT pk_resource_server PRIMARY KEY (id);


--
-- Name: client_scope_role_mapping pk_template_scope; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_scope_role_mapping
    ADD CONSTRAINT pk_template_scope PRIMARY KEY (scope_id, role_id);


--
-- Name: default_client_scope r_def_cli_scope_bind; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.default_client_scope
    ADD CONSTRAINT r_def_cli_scope_bind PRIMARY KEY (realm_id, scope_id);


--
-- Name: realm_localizations realm_localizations_pkey; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.realm_localizations
    ADD CONSTRAINT realm_localizations_pkey PRIMARY KEY (realm_id, locale);


--
-- Name: resource_attribute res_attr_pk; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_attribute
    ADD CONSTRAINT res_attr_pk PRIMARY KEY (id);


--
-- Name: keycloak_group sibling_names; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.keycloak_group
    ADD CONSTRAINT sibling_names UNIQUE (realm_id, parent_group, name);


--
-- Name: identity_provider uk_2daelwnibji49avxsrtuf6xj33; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.identity_provider
    ADD CONSTRAINT uk_2daelwnibji49avxsrtuf6xj33 UNIQUE (provider_alias, realm_id);


--
-- Name: client uk_b71cjlbenv945rb6gcon438at; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client
    ADD CONSTRAINT uk_b71cjlbenv945rb6gcon438at UNIQUE (realm_id, client_id);


--
-- Name: client_scope uk_cli_scope; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_scope
    ADD CONSTRAINT uk_cli_scope UNIQUE (realm_id, name);


--
-- Name: user_entity uk_dykn684sl8up1crfei6eckhd7; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_entity
    ADD CONSTRAINT uk_dykn684sl8up1crfei6eckhd7 UNIQUE (realm_id, email_constraint);


--
-- Name: user_consent uk_external_consent; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_consent
    ADD CONSTRAINT uk_external_consent UNIQUE (client_storage_provider, external_client_id, user_id);


--
-- Name: resource_server_resource uk_frsr6t700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_server_resource
    ADD CONSTRAINT uk_frsr6t700s9v50bu18ws5ha6 UNIQUE (name, owner, resource_server_id);


--
-- Name: resource_server_perm_ticket uk_frsr6t700s9v50bu18ws5pmt; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_server_perm_ticket
    ADD CONSTRAINT uk_frsr6t700s9v50bu18ws5pmt UNIQUE (owner, requester, resource_server_id, resource_id, scope_id);


--
-- Name: resource_server_policy uk_frsrpt700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_server_policy
    ADD CONSTRAINT uk_frsrpt700s9v50bu18ws5ha6 UNIQUE (name, resource_server_id);


--
-- Name: resource_server_scope uk_frsrst700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_server_scope
    ADD CONSTRAINT uk_frsrst700s9v50bu18ws5ha6 UNIQUE (name, resource_server_id);


--
-- Name: user_consent uk_local_consent; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_consent
    ADD CONSTRAINT uk_local_consent UNIQUE (client_id, user_id);


--
-- Name: org uk_org_group; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.org
    ADD CONSTRAINT uk_org_group UNIQUE (group_id);


--
-- Name: org uk_org_name; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.org
    ADD CONSTRAINT uk_org_name UNIQUE (realm_id, name);


--
-- Name: realm uk_orvsdmla56612eaefiq6wl5oi; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.realm
    ADD CONSTRAINT uk_orvsdmla56612eaefiq6wl5oi UNIQUE (name);


--
-- Name: user_entity uk_ru8tt6t700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_entity
    ADD CONSTRAINT uk_ru8tt6t700s9v50bu18ws5ha6 UNIQUE (realm_id, username);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (user_id);


--
-- Name: cedar_chunks cedar_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cedar_chunks
    ADD CONSTRAINT cedar_chunks_pkey PRIMARY KEY (id);


--
-- Name: cedar_document_metadata cedar_document_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cedar_document_metadata
    ADD CONSTRAINT cedar_document_metadata_pkey PRIMARY KEY (id);


--
-- Name: cedar_documents cedar_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cedar_documents
    ADD CONSTRAINT cedar_documents_pkey PRIMARY KEY (id);


--
-- Name: cedar_runs cedar_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cedar_runs
    ADD CONSTRAINT cedar_runs_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: cropwizard-papers cropwizard-papers_doi_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."cropwizard-papers"
    ADD CONSTRAINT "cropwizard-papers_doi_key" UNIQUE (doi);


--
-- Name: cropwizard-papers cropwizard-papers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."cropwizard-papers"
    ADD CONSTRAINT "cropwizard-papers_pkey" PRIMARY KEY (id);


--
-- Name: doc_groups doc_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doc_groups
    ADD CONSTRAINT doc_groups_pkey PRIMARY KEY (id);


--
-- Name: doc_groups_sharing doc_groups_sharing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doc_groups_sharing
    ADD CONSTRAINT doc_groups_sharing_pkey PRIMARY KEY (id);


--
-- Name: llm-guided-docs docs-llm-guided_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."llm-guided-docs"
    ADD CONSTRAINT "docs-llm-guided_pkey" PRIMARY KEY (id);


--
-- Name: documents_doc_groups documents_doc_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_doc_groups
    ADD CONSTRAINT documents_doc_groups_pkey PRIMARY KEY (document_id, doc_group_id);


--
-- Name: documents_failed documents_failed_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_failed
    ADD CONSTRAINT documents_failed_pkey PRIMARY KEY (id);


--
-- Name: documents_in_progress documents_in_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_in_progress
    ADD CONSTRAINT documents_in_progress_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: email-newsletter email-newsletter_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."email-newsletter"
    ADD CONSTRAINT "email-newsletter_email_key" UNIQUE (email);


--
-- Name: email-newsletter email-newsletter_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."email-newsletter"
    ADD CONSTRAINT "email-newsletter_pkey" PRIMARY KEY (id);


--
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);


--
-- Name: llm-convo-monitor llm-convo-monitor_convo_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."llm-convo-monitor"
    ADD CONSTRAINT "llm-convo-monitor_convo_id_key" UNIQUE (convo_id);


--
-- Name: llm-convo-monitor llm-convo-monitor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."llm-convo-monitor"
    ADD CONSTRAINT "llm-convo-monitor_pkey" PRIMARY KEY (id);


--
-- Name: llm-guided-contexts llm-guided-contexts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."llm-guided-contexts"
    ADD CONSTRAINT "llm-guided-contexts_pkey" PRIMARY KEY (id);


--
-- Name: llm-guided-docs llm-guided-docs_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."llm-guided-docs"
    ADD CONSTRAINT "llm-guided-docs_id_key" UNIQUE (id);


--
-- Name: llm-guided-sections llm-guided-sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."llm-guided-sections"
    ADD CONSTRAINT "llm-guided-sections_pkey" PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: n8n_workflows n8n_api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.n8n_workflows
    ADD CONSTRAINT n8n_api_keys_pkey PRIMARY KEY (latest_workflow_id);


--
-- Name: nal_publications nal_publications_doi_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nal_publications
    ADD CONSTRAINT nal_publications_doi_key UNIQUE (doi);


--
-- Name: nal_publications nal_publications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nal_publications
    ADD CONSTRAINT nal_publications_pkey PRIMARY KEY (id);


--
-- Name: pre_authorized_api_keys pre-authorized-api-keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_authorized_api_keys
    ADD CONSTRAINT "pre-authorized-api-keys_pkey" PRIMARY KEY (id);


--
-- Name: project_stats project_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_stats
    ADD CONSTRAINT project_stats_pkey PRIMARY KEY (id);


--
-- Name: project_stats project_stats_project_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_stats
    ADD CONSTRAINT project_stats_project_name_key UNIQUE (project_name);


--
-- Name: projects projects_course_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_course_name_key UNIQUE (course_name);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: publications publications_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publications
    ADD CONSTRAINT publications_id_key UNIQUE (id);


--
-- Name: publications publications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publications
    ADD CONSTRAINT publications_pkey PRIMARY KEY (pmid);


--
-- Name: pubmed_daily_update pubmed_daily_update_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pubmed_daily_update
    ADD CONSTRAINT pubmed_daily_update_pkey PRIMARY KEY (id);


--
-- Name: depricated_uiuc_chatbot uiuc-chatbot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.depricated_uiuc_chatbot
    ADD CONSTRAINT "uiuc-chatbot_pkey" PRIMARY KEY (id);


--
-- Name: uiuc-course-table uiuc-course-table_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."uiuc-course-table"
    ADD CONSTRAINT "uiuc-course-table_pkey" PRIMARY KEY (id);


--
-- Name: doc_groups unique_name_course_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doc_groups
    ADD CONSTRAINT unique_name_course_name UNIQUE (name, course_name);


--
-- Name: usage_metrics usage_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_metrics
    ADD CONSTRAINT usage_metrics_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: postgres
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: fed_user_attr_long_values; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX fed_user_attr_long_values ON keycloak.fed_user_attribute USING btree (long_value_hash, name);


--
-- Name: fed_user_attr_long_values_lower_case; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX fed_user_attr_long_values_lower_case ON keycloak.fed_user_attribute USING btree (long_value_hash_lower_case, name);


--
-- Name: idx_admin_event_time; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_admin_event_time ON keycloak.admin_event_entity USING btree (realm_id, admin_event_time);


--
-- Name: idx_assoc_pol_assoc_pol_id; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_assoc_pol_assoc_pol_id ON keycloak.associated_policy USING btree (associated_policy_id);


--
-- Name: idx_auth_config_realm; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_auth_config_realm ON keycloak.authenticator_config USING btree (realm_id);


--
-- Name: idx_auth_exec_flow; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_auth_exec_flow ON keycloak.authentication_execution USING btree (flow_id);


--
-- Name: idx_auth_exec_realm_flow; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_auth_exec_realm_flow ON keycloak.authentication_execution USING btree (realm_id, flow_id);


--
-- Name: idx_auth_flow_realm; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_auth_flow_realm ON keycloak.authentication_flow USING btree (realm_id);


--
-- Name: idx_cl_clscope; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_cl_clscope ON keycloak.client_scope_client USING btree (scope_id);


--
-- Name: idx_client_att_by_name_value; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_client_att_by_name_value ON keycloak.client_attributes USING btree (name, substr(value, 1, 255));


--
-- Name: idx_client_id; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_client_id ON keycloak.client USING btree (client_id);


--
-- Name: idx_client_init_acc_realm; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_client_init_acc_realm ON keycloak.client_initial_access USING btree (realm_id);


--
-- Name: idx_client_session_session; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_client_session_session ON keycloak.client_session USING btree (session_id);


--
-- Name: idx_clscope_attrs; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_clscope_attrs ON keycloak.client_scope_attributes USING btree (scope_id);


--
-- Name: idx_clscope_cl; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_clscope_cl ON keycloak.client_scope_client USING btree (client_id);


--
-- Name: idx_clscope_protmap; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_clscope_protmap ON keycloak.protocol_mapper USING btree (client_scope_id);


--
-- Name: idx_clscope_role; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_clscope_role ON keycloak.client_scope_role_mapping USING btree (scope_id);


--
-- Name: idx_compo_config_compo; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_compo_config_compo ON keycloak.component_config USING btree (component_id);


--
-- Name: idx_component_provider_type; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_component_provider_type ON keycloak.component USING btree (provider_type);


--
-- Name: idx_component_realm; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_component_realm ON keycloak.component USING btree (realm_id);


--
-- Name: idx_composite; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_composite ON keycloak.composite_role USING btree (composite);


--
-- Name: idx_composite_child; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_composite_child ON keycloak.composite_role USING btree (child_role);


--
-- Name: idx_defcls_realm; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_defcls_realm ON keycloak.default_client_scope USING btree (realm_id);


--
-- Name: idx_defcls_scope; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_defcls_scope ON keycloak.default_client_scope USING btree (scope_id);


--
-- Name: idx_event_time; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_event_time ON keycloak.event_entity USING btree (realm_id, event_time);


--
-- Name: idx_fedidentity_feduser; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_fedidentity_feduser ON keycloak.federated_identity USING btree (federated_user_id);


--
-- Name: idx_fedidentity_user; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_fedidentity_user ON keycloak.federated_identity USING btree (user_id);


--
-- Name: idx_fu_attribute; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_fu_attribute ON keycloak.fed_user_attribute USING btree (user_id, realm_id, name);


--
-- Name: idx_fu_cnsnt_ext; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_fu_cnsnt_ext ON keycloak.fed_user_consent USING btree (user_id, client_storage_provider, external_client_id);


--
-- Name: idx_fu_consent; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_fu_consent ON keycloak.fed_user_consent USING btree (user_id, client_id);


--
-- Name: idx_fu_consent_ru; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_fu_consent_ru ON keycloak.fed_user_consent USING btree (realm_id, user_id);


--
-- Name: idx_fu_credential; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_fu_credential ON keycloak.fed_user_credential USING btree (user_id, type);


--
-- Name: idx_fu_credential_ru; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_fu_credential_ru ON keycloak.fed_user_credential USING btree (realm_id, user_id);


--
-- Name: idx_fu_group_membership; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_fu_group_membership ON keycloak.fed_user_group_membership USING btree (user_id, group_id);


--
-- Name: idx_fu_group_membership_ru; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_fu_group_membership_ru ON keycloak.fed_user_group_membership USING btree (realm_id, user_id);


--
-- Name: idx_fu_required_action; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_fu_required_action ON keycloak.fed_user_required_action USING btree (user_id, required_action);


--
-- Name: idx_fu_required_action_ru; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_fu_required_action_ru ON keycloak.fed_user_required_action USING btree (realm_id, user_id);


--
-- Name: idx_fu_role_mapping; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_fu_role_mapping ON keycloak.fed_user_role_mapping USING btree (user_id, role_id);


--
-- Name: idx_fu_role_mapping_ru; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_fu_role_mapping_ru ON keycloak.fed_user_role_mapping USING btree (realm_id, user_id);


--
-- Name: idx_group_att_by_name_value; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_group_att_by_name_value ON keycloak.group_attribute USING btree (name, ((value)::character varying(250)));


--
-- Name: idx_group_attr_group; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_group_attr_group ON keycloak.group_attribute USING btree (group_id);


--
-- Name: idx_group_role_mapp_group; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_group_role_mapp_group ON keycloak.group_role_mapping USING btree (group_id);


--
-- Name: idx_id_prov_mapp_realm; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_id_prov_mapp_realm ON keycloak.identity_provider_mapper USING btree (realm_id);


--
-- Name: idx_ident_prov_realm; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_ident_prov_realm ON keycloak.identity_provider USING btree (realm_id);


--
-- Name: idx_keycloak_role_client; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_keycloak_role_client ON keycloak.keycloak_role USING btree (client);


--
-- Name: idx_keycloak_role_realm; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_keycloak_role_realm ON keycloak.keycloak_role USING btree (realm);


--
-- Name: idx_offline_uss_by_broker_session_id; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_offline_uss_by_broker_session_id ON keycloak.offline_user_session USING btree (broker_session_id, realm_id);


--
-- Name: idx_offline_uss_by_last_session_refresh; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_offline_uss_by_last_session_refresh ON keycloak.offline_user_session USING btree (realm_id, offline_flag, last_session_refresh);


--
-- Name: idx_offline_uss_by_user; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_offline_uss_by_user ON keycloak.offline_user_session USING btree (user_id, realm_id, offline_flag);


--
-- Name: idx_perm_ticket_owner; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_perm_ticket_owner ON keycloak.resource_server_perm_ticket USING btree (owner);


--
-- Name: idx_perm_ticket_requester; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_perm_ticket_requester ON keycloak.resource_server_perm_ticket USING btree (requester);


--
-- Name: idx_protocol_mapper_client; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_protocol_mapper_client ON keycloak.protocol_mapper USING btree (client_id);


--
-- Name: idx_realm_attr_realm; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_realm_attr_realm ON keycloak.realm_attribute USING btree (realm_id);


--
-- Name: idx_realm_clscope; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_realm_clscope ON keycloak.client_scope USING btree (realm_id);


--
-- Name: idx_realm_def_grp_realm; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_realm_def_grp_realm ON keycloak.realm_default_groups USING btree (realm_id);


--
-- Name: idx_realm_evt_list_realm; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_realm_evt_list_realm ON keycloak.realm_events_listeners USING btree (realm_id);


--
-- Name: idx_realm_evt_types_realm; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_realm_evt_types_realm ON keycloak.realm_enabled_event_types USING btree (realm_id);


--
-- Name: idx_realm_master_adm_cli; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_realm_master_adm_cli ON keycloak.realm USING btree (master_admin_client);


--
-- Name: idx_realm_supp_local_realm; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_realm_supp_local_realm ON keycloak.realm_supported_locales USING btree (realm_id);


--
-- Name: idx_redir_uri_client; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_redir_uri_client ON keycloak.redirect_uris USING btree (client_id);


--
-- Name: idx_req_act_prov_realm; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_req_act_prov_realm ON keycloak.required_action_provider USING btree (realm_id);


--
-- Name: idx_res_policy_policy; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_res_policy_policy ON keycloak.resource_policy USING btree (policy_id);


--
-- Name: idx_res_scope_scope; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_res_scope_scope ON keycloak.resource_scope USING btree (scope_id);


--
-- Name: idx_res_serv_pol_res_serv; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_res_serv_pol_res_serv ON keycloak.resource_server_policy USING btree (resource_server_id);


--
-- Name: idx_res_srv_res_res_srv; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_res_srv_res_res_srv ON keycloak.resource_server_resource USING btree (resource_server_id);


--
-- Name: idx_res_srv_scope_res_srv; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_res_srv_scope_res_srv ON keycloak.resource_server_scope USING btree (resource_server_id);


--
-- Name: idx_role_attribute; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_role_attribute ON keycloak.role_attribute USING btree (role_id);


--
-- Name: idx_role_clscope; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_role_clscope ON keycloak.client_scope_role_mapping USING btree (role_id);


--
-- Name: idx_scope_mapping_role; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_scope_mapping_role ON keycloak.scope_mapping USING btree (role_id);


--
-- Name: idx_scope_policy_policy; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_scope_policy_policy ON keycloak.scope_policy USING btree (policy_id);


--
-- Name: idx_update_time; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_update_time ON keycloak.migration_model USING btree (update_time);


--
-- Name: idx_us_sess_id_on_cl_sess; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_us_sess_id_on_cl_sess ON keycloak.offline_client_session USING btree (user_session_id);


--
-- Name: idx_usconsent_clscope; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_usconsent_clscope ON keycloak.user_consent_client_scope USING btree (user_consent_id);


--
-- Name: idx_usconsent_scope_id; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_usconsent_scope_id ON keycloak.user_consent_client_scope USING btree (scope_id);


--
-- Name: idx_user_attribute; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_user_attribute ON keycloak.user_attribute USING btree (user_id);


--
-- Name: idx_user_attribute_name; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_user_attribute_name ON keycloak.user_attribute USING btree (name, value);


--
-- Name: idx_user_consent; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_user_consent ON keycloak.user_consent USING btree (user_id);


--
-- Name: idx_user_credential; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_user_credential ON keycloak.credential USING btree (user_id);


--
-- Name: idx_user_email; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_user_email ON keycloak.user_entity USING btree (email);


--
-- Name: idx_user_group_mapping; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_user_group_mapping ON keycloak.user_group_membership USING btree (user_id);


--
-- Name: idx_user_reqactions; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_user_reqactions ON keycloak.user_required_action USING btree (user_id);


--
-- Name: idx_user_role_mapping; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_user_role_mapping ON keycloak.user_role_mapping USING btree (user_id);


--
-- Name: idx_user_service_account; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_user_service_account ON keycloak.user_entity USING btree (realm_id, service_account_client_link);


--
-- Name: idx_usr_fed_map_fed_prv; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_usr_fed_map_fed_prv ON keycloak.user_federation_mapper USING btree (federation_provider_id);


--
-- Name: idx_usr_fed_map_realm; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_usr_fed_map_realm ON keycloak.user_federation_mapper USING btree (realm_id);


--
-- Name: idx_usr_fed_prv_realm; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_usr_fed_prv_realm ON keycloak.user_federation_provider USING btree (realm_id);


--
-- Name: idx_web_orig_client; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX idx_web_orig_client ON keycloak.web_origins USING btree (client_id);


--
-- Name: user_attr_long_values; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX user_attr_long_values ON keycloak.user_attribute USING btree (long_value_hash, name);


--
-- Name: user_attr_long_values_lower_case; Type: INDEX; Schema: keycloak; Owner: postgres
--

CREATE INDEX user_attr_long_values_lower_case ON keycloak.user_attribute USING btree (long_value_hash_lower_case, name);


--
-- Name: doc_groups_enabled_course_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX doc_groups_enabled_course_name_idx ON public.doc_groups USING btree (enabled, course_name);


--
-- Name: documents_course_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_course_name_idx ON public.documents USING btree (course_name);


--
-- Name: documents_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_created_at_idx ON public.documents USING btree (created_at);


--
-- Name: documents_doc_groups_doc_group_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_doc_groups_doc_group_id_idx ON public.documents_doc_groups USING btree (doc_group_id);


--
-- Name: documents_doc_groups_document_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_doc_groups_document_id_idx ON public.documents_doc_groups USING btree (document_id);


--
-- Name: documents_in_progress_course_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_in_progress_course_name_idx ON public.documents_in_progress USING btree (course_name);


--
-- Name: documents_in_progress_url_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_in_progress_url_idx ON public.documents_in_progress USING btree (url);


--
-- Name: documents_url_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_url_idx ON public.documents USING hash (url);


--
-- Name: idx_conversation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversation_id ON public.messages USING btree (conversation_id);


--
-- Name: idx_user_email_folders; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_email_folders ON public.folders USING btree (user_email);


--
-- Name: idx_user_email_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_email_updated_at ON public.conversations USING btree (user_email, updated_at DESC);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: projects after_project_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER after_project_insert AFTER INSERT ON public.projects FOR EACH ROW EXECUTE FUNCTION public.initialize_project_stats();


--
-- Name: llm-convo-monitor project_stats_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER project_stats_trigger AFTER INSERT OR DELETE OR UPDATE ON public."llm-convo-monitor" FOR EACH ROW EXECUTE FUNCTION public.update_project_stats();


--
-- Name: documents_doc_groups trg_update_doc_count_after_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_doc_count_after_insert AFTER INSERT OR DELETE ON public.documents_doc_groups FOR EACH ROW EXECUTE FUNCTION public.update_doc_count();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: client_session_auth_status auth_status_constraint; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_session_auth_status
    ADD CONSTRAINT auth_status_constraint FOREIGN KEY (client_session) REFERENCES keycloak.client_session(id);


--
-- Name: identity_provider fk2b4ebc52ae5c3b34; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.identity_provider
    ADD CONSTRAINT fk2b4ebc52ae5c3b34 FOREIGN KEY (realm_id) REFERENCES keycloak.realm(id);


--
-- Name: client_attributes fk3c47c64beacca966; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_attributes
    ADD CONSTRAINT fk3c47c64beacca966 FOREIGN KEY (client_id) REFERENCES keycloak.client(id);


--
-- Name: federated_identity fk404288b92ef007a6; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.federated_identity
    ADD CONSTRAINT fk404288b92ef007a6 FOREIGN KEY (user_id) REFERENCES keycloak.user_entity(id);


--
-- Name: client_node_registrations fk4129723ba992f594; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_node_registrations
    ADD CONSTRAINT fk4129723ba992f594 FOREIGN KEY (client_id) REFERENCES keycloak.client(id);


--
-- Name: client_session_note fk5edfb00ff51c2736; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_session_note
    ADD CONSTRAINT fk5edfb00ff51c2736 FOREIGN KEY (client_session) REFERENCES keycloak.client_session(id);


--
-- Name: user_session_note fk5edfb00ff51d3472; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_session_note
    ADD CONSTRAINT fk5edfb00ff51d3472 FOREIGN KEY (user_session) REFERENCES keycloak.user_session(id);


--
-- Name: client_session_role fk_11b7sgqw18i532811v7o2dv76; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_session_role
    ADD CONSTRAINT fk_11b7sgqw18i532811v7o2dv76 FOREIGN KEY (client_session) REFERENCES keycloak.client_session(id);


--
-- Name: redirect_uris fk_1burs8pb4ouj97h5wuppahv9f; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.redirect_uris
    ADD CONSTRAINT fk_1burs8pb4ouj97h5wuppahv9f FOREIGN KEY (client_id) REFERENCES keycloak.client(id);


--
-- Name: user_federation_provider fk_1fj32f6ptolw2qy60cd8n01e8; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_federation_provider
    ADD CONSTRAINT fk_1fj32f6ptolw2qy60cd8n01e8 FOREIGN KEY (realm_id) REFERENCES keycloak.realm(id);


--
-- Name: client_session_prot_mapper fk_33a8sgqw18i532811v7o2dk89; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_session_prot_mapper
    ADD CONSTRAINT fk_33a8sgqw18i532811v7o2dk89 FOREIGN KEY (client_session) REFERENCES keycloak.client_session(id);


--
-- Name: realm_required_credential fk_5hg65lybevavkqfki3kponh9v; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.realm_required_credential
    ADD CONSTRAINT fk_5hg65lybevavkqfki3kponh9v FOREIGN KEY (realm_id) REFERENCES keycloak.realm(id);


--
-- Name: resource_attribute fk_5hrm2vlf9ql5fu022kqepovbr; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_attribute
    ADD CONSTRAINT fk_5hrm2vlf9ql5fu022kqepovbr FOREIGN KEY (resource_id) REFERENCES keycloak.resource_server_resource(id);


--
-- Name: user_attribute fk_5hrm2vlf9ql5fu043kqepovbr; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_attribute
    ADD CONSTRAINT fk_5hrm2vlf9ql5fu043kqepovbr FOREIGN KEY (user_id) REFERENCES keycloak.user_entity(id);


--
-- Name: user_required_action fk_6qj3w1jw9cvafhe19bwsiuvmd; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_required_action
    ADD CONSTRAINT fk_6qj3w1jw9cvafhe19bwsiuvmd FOREIGN KEY (user_id) REFERENCES keycloak.user_entity(id);


--
-- Name: keycloak_role fk_6vyqfe4cn4wlq8r6kt5vdsj5c; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.keycloak_role
    ADD CONSTRAINT fk_6vyqfe4cn4wlq8r6kt5vdsj5c FOREIGN KEY (realm) REFERENCES keycloak.realm(id);


--
-- Name: realm_smtp_config fk_70ej8xdxgxd0b9hh6180irr0o; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.realm_smtp_config
    ADD CONSTRAINT fk_70ej8xdxgxd0b9hh6180irr0o FOREIGN KEY (realm_id) REFERENCES keycloak.realm(id);


--
-- Name: realm_attribute fk_8shxd6l3e9atqukacxgpffptw; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.realm_attribute
    ADD CONSTRAINT fk_8shxd6l3e9atqukacxgpffptw FOREIGN KEY (realm_id) REFERENCES keycloak.realm(id);


--
-- Name: composite_role fk_a63wvekftu8jo1pnj81e7mce2; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.composite_role
    ADD CONSTRAINT fk_a63wvekftu8jo1pnj81e7mce2 FOREIGN KEY (composite) REFERENCES keycloak.keycloak_role(id);


--
-- Name: authentication_execution fk_auth_exec_flow; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.authentication_execution
    ADD CONSTRAINT fk_auth_exec_flow FOREIGN KEY (flow_id) REFERENCES keycloak.authentication_flow(id);


--
-- Name: authentication_execution fk_auth_exec_realm; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.authentication_execution
    ADD CONSTRAINT fk_auth_exec_realm FOREIGN KEY (realm_id) REFERENCES keycloak.realm(id);


--
-- Name: authentication_flow fk_auth_flow_realm; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.authentication_flow
    ADD CONSTRAINT fk_auth_flow_realm FOREIGN KEY (realm_id) REFERENCES keycloak.realm(id);


--
-- Name: authenticator_config fk_auth_realm; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.authenticator_config
    ADD CONSTRAINT fk_auth_realm FOREIGN KEY (realm_id) REFERENCES keycloak.realm(id);


--
-- Name: client_session fk_b4ao2vcvat6ukau74wbwtfqo1; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_session
    ADD CONSTRAINT fk_b4ao2vcvat6ukau74wbwtfqo1 FOREIGN KEY (session_id) REFERENCES keycloak.user_session(id);


--
-- Name: user_role_mapping fk_c4fqv34p1mbylloxang7b1q3l; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_role_mapping
    ADD CONSTRAINT fk_c4fqv34p1mbylloxang7b1q3l FOREIGN KEY (user_id) REFERENCES keycloak.user_entity(id);


--
-- Name: client_scope_attributes fk_cl_scope_attr_scope; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_scope_attributes
    ADD CONSTRAINT fk_cl_scope_attr_scope FOREIGN KEY (scope_id) REFERENCES keycloak.client_scope(id);


--
-- Name: client_scope_role_mapping fk_cl_scope_rm_scope; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_scope_role_mapping
    ADD CONSTRAINT fk_cl_scope_rm_scope FOREIGN KEY (scope_id) REFERENCES keycloak.client_scope(id);


--
-- Name: client_user_session_note fk_cl_usr_ses_note; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_user_session_note
    ADD CONSTRAINT fk_cl_usr_ses_note FOREIGN KEY (client_session) REFERENCES keycloak.client_session(id);


--
-- Name: protocol_mapper fk_cli_scope_mapper; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.protocol_mapper
    ADD CONSTRAINT fk_cli_scope_mapper FOREIGN KEY (client_scope_id) REFERENCES keycloak.client_scope(id);


--
-- Name: client_initial_access fk_client_init_acc_realm; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.client_initial_access
    ADD CONSTRAINT fk_client_init_acc_realm FOREIGN KEY (realm_id) REFERENCES keycloak.realm(id);


--
-- Name: component_config fk_component_config; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.component_config
    ADD CONSTRAINT fk_component_config FOREIGN KEY (component_id) REFERENCES keycloak.component(id);


--
-- Name: component fk_component_realm; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.component
    ADD CONSTRAINT fk_component_realm FOREIGN KEY (realm_id) REFERENCES keycloak.realm(id);


--
-- Name: realm_default_groups fk_def_groups_realm; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.realm_default_groups
    ADD CONSTRAINT fk_def_groups_realm FOREIGN KEY (realm_id) REFERENCES keycloak.realm(id);


--
-- Name: user_federation_mapper_config fk_fedmapper_cfg; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_federation_mapper_config
    ADD CONSTRAINT fk_fedmapper_cfg FOREIGN KEY (user_federation_mapper_id) REFERENCES keycloak.user_federation_mapper(id);


--
-- Name: user_federation_mapper fk_fedmapperpm_fedprv; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_federation_mapper
    ADD CONSTRAINT fk_fedmapperpm_fedprv FOREIGN KEY (federation_provider_id) REFERENCES keycloak.user_federation_provider(id);


--
-- Name: user_federation_mapper fk_fedmapperpm_realm; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_federation_mapper
    ADD CONSTRAINT fk_fedmapperpm_realm FOREIGN KEY (realm_id) REFERENCES keycloak.realm(id);


--
-- Name: associated_policy fk_frsr5s213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.associated_policy
    ADD CONSTRAINT fk_frsr5s213xcx4wnkog82ssrfy FOREIGN KEY (associated_policy_id) REFERENCES keycloak.resource_server_policy(id);


--
-- Name: scope_policy fk_frsrasp13xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.scope_policy
    ADD CONSTRAINT fk_frsrasp13xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES keycloak.resource_server_policy(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog82sspmt; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog82sspmt FOREIGN KEY (resource_server_id) REFERENCES keycloak.resource_server(id);


--
-- Name: resource_server_resource fk_frsrho213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_server_resource
    ADD CONSTRAINT fk_frsrho213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES keycloak.resource_server(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog83sspmt; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog83sspmt FOREIGN KEY (resource_id) REFERENCES keycloak.resource_server_resource(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog84sspmt; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog84sspmt FOREIGN KEY (scope_id) REFERENCES keycloak.resource_server_scope(id);


--
-- Name: associated_policy fk_frsrpas14xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.associated_policy
    ADD CONSTRAINT fk_frsrpas14xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES keycloak.resource_server_policy(id);


--
-- Name: scope_policy fk_frsrpass3xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.scope_policy
    ADD CONSTRAINT fk_frsrpass3xcx4wnkog82ssrfy FOREIGN KEY (scope_id) REFERENCES keycloak.resource_server_scope(id);


--
-- Name: resource_server_perm_ticket fk_frsrpo2128cx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrpo2128cx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES keycloak.resource_server_policy(id);


--
-- Name: resource_server_policy fk_frsrpo213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_server_policy
    ADD CONSTRAINT fk_frsrpo213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES keycloak.resource_server(id);


--
-- Name: resource_scope fk_frsrpos13xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_scope
    ADD CONSTRAINT fk_frsrpos13xcx4wnkog82ssrfy FOREIGN KEY (resource_id) REFERENCES keycloak.resource_server_resource(id);


--
-- Name: resource_policy fk_frsrpos53xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_policy
    ADD CONSTRAINT fk_frsrpos53xcx4wnkog82ssrfy FOREIGN KEY (resource_id) REFERENCES keycloak.resource_server_resource(id);


--
-- Name: resource_policy fk_frsrpp213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_policy
    ADD CONSTRAINT fk_frsrpp213xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES keycloak.resource_server_policy(id);


--
-- Name: resource_scope fk_frsrps213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_scope
    ADD CONSTRAINT fk_frsrps213xcx4wnkog82ssrfy FOREIGN KEY (scope_id) REFERENCES keycloak.resource_server_scope(id);


--
-- Name: resource_server_scope fk_frsrso213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_server_scope
    ADD CONSTRAINT fk_frsrso213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES keycloak.resource_server(id);


--
-- Name: composite_role fk_gr7thllb9lu8q4vqa4524jjy8; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.composite_role
    ADD CONSTRAINT fk_gr7thllb9lu8q4vqa4524jjy8 FOREIGN KEY (child_role) REFERENCES keycloak.keycloak_role(id);


--
-- Name: user_consent_client_scope fk_grntcsnt_clsc_usc; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_consent_client_scope
    ADD CONSTRAINT fk_grntcsnt_clsc_usc FOREIGN KEY (user_consent_id) REFERENCES keycloak.user_consent(id);


--
-- Name: user_consent fk_grntcsnt_user; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_consent
    ADD CONSTRAINT fk_grntcsnt_user FOREIGN KEY (user_id) REFERENCES keycloak.user_entity(id);


--
-- Name: group_attribute fk_group_attribute_group; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.group_attribute
    ADD CONSTRAINT fk_group_attribute_group FOREIGN KEY (group_id) REFERENCES keycloak.keycloak_group(id);


--
-- Name: group_role_mapping fk_group_role_group; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.group_role_mapping
    ADD CONSTRAINT fk_group_role_group FOREIGN KEY (group_id) REFERENCES keycloak.keycloak_group(id);


--
-- Name: realm_enabled_event_types fk_h846o4h0w8epx5nwedrf5y69j; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.realm_enabled_event_types
    ADD CONSTRAINT fk_h846o4h0w8epx5nwedrf5y69j FOREIGN KEY (realm_id) REFERENCES keycloak.realm(id);


--
-- Name: realm_events_listeners fk_h846o4h0w8epx5nxev9f5y69j; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.realm_events_listeners
    ADD CONSTRAINT fk_h846o4h0w8epx5nxev9f5y69j FOREIGN KEY (realm_id) REFERENCES keycloak.realm(id);


--
-- Name: identity_provider_mapper fk_idpm_realm; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.identity_provider_mapper
    ADD CONSTRAINT fk_idpm_realm FOREIGN KEY (realm_id) REFERENCES keycloak.realm(id);


--
-- Name: idp_mapper_config fk_idpmconfig; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.idp_mapper_config
    ADD CONSTRAINT fk_idpmconfig FOREIGN KEY (idp_mapper_id) REFERENCES keycloak.identity_provider_mapper(id);


--
-- Name: web_origins fk_lojpho213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.web_origins
    ADD CONSTRAINT fk_lojpho213xcx4wnkog82ssrfy FOREIGN KEY (client_id) REFERENCES keycloak.client(id);


--
-- Name: scope_mapping fk_ouse064plmlr732lxjcn1q5f1; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.scope_mapping
    ADD CONSTRAINT fk_ouse064plmlr732lxjcn1q5f1 FOREIGN KEY (client_id) REFERENCES keycloak.client(id);


--
-- Name: protocol_mapper fk_pcm_realm; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.protocol_mapper
    ADD CONSTRAINT fk_pcm_realm FOREIGN KEY (client_id) REFERENCES keycloak.client(id);


--
-- Name: credential fk_pfyr0glasqyl0dei3kl69r6v0; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.credential
    ADD CONSTRAINT fk_pfyr0glasqyl0dei3kl69r6v0 FOREIGN KEY (user_id) REFERENCES keycloak.user_entity(id);


--
-- Name: protocol_mapper_config fk_pmconfig; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.protocol_mapper_config
    ADD CONSTRAINT fk_pmconfig FOREIGN KEY (protocol_mapper_id) REFERENCES keycloak.protocol_mapper(id);


--
-- Name: default_client_scope fk_r_def_cli_scope_realm; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.default_client_scope
    ADD CONSTRAINT fk_r_def_cli_scope_realm FOREIGN KEY (realm_id) REFERENCES keycloak.realm(id);


--
-- Name: required_action_provider fk_req_act_realm; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.required_action_provider
    ADD CONSTRAINT fk_req_act_realm FOREIGN KEY (realm_id) REFERENCES keycloak.realm(id);


--
-- Name: resource_uris fk_resource_server_uris; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.resource_uris
    ADD CONSTRAINT fk_resource_server_uris FOREIGN KEY (resource_id) REFERENCES keycloak.resource_server_resource(id);


--
-- Name: role_attribute fk_role_attribute_id; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.role_attribute
    ADD CONSTRAINT fk_role_attribute_id FOREIGN KEY (role_id) REFERENCES keycloak.keycloak_role(id);


--
-- Name: realm_supported_locales fk_supported_locales_realm; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.realm_supported_locales
    ADD CONSTRAINT fk_supported_locales_realm FOREIGN KEY (realm_id) REFERENCES keycloak.realm(id);


--
-- Name: user_federation_config fk_t13hpu1j94r2ebpekr39x5eu5; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_federation_config
    ADD CONSTRAINT fk_t13hpu1j94r2ebpekr39x5eu5 FOREIGN KEY (user_federation_provider_id) REFERENCES keycloak.user_federation_provider(id);


--
-- Name: user_group_membership fk_user_group_user; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.user_group_membership
    ADD CONSTRAINT fk_user_group_user FOREIGN KEY (user_id) REFERENCES keycloak.user_entity(id);


--
-- Name: policy_config fkdc34197cf864c4e43; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.policy_config
    ADD CONSTRAINT fkdc34197cf864c4e43 FOREIGN KEY (policy_id) REFERENCES keycloak.resource_server_policy(id);


--
-- Name: identity_provider_config fkdc4897cf864c4e43; Type: FK CONSTRAINT; Schema: keycloak; Owner: postgres
--

ALTER TABLE ONLY keycloak.identity_provider_config
    ADD CONSTRAINT fkdc4897cf864c4e43 FOREIGN KEY (identity_provider_id) REFERENCES keycloak.identity_provider(internal_id);


--
-- Name: cedar_chunks cedar_chunks_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cedar_chunks
    ADD CONSTRAINT cedar_chunks_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.cedar_documents(id);


--
-- Name: cedar_document_metadata cedar_document_metadata_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cedar_document_metadata
    ADD CONSTRAINT cedar_document_metadata_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.cedar_documents(id) ON DELETE CASCADE;


--
-- Name: cedar_runs cedar_runs_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cedar_runs
    ADD CONSTRAINT cedar_runs_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.cedar_documents(id);


--
-- Name: conversations conversations_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE SET NULL;


--
-- Name: doc_groups_sharing doc_groups_sharing_destination_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doc_groups_sharing
    ADD CONSTRAINT doc_groups_sharing_destination_project_id_fkey FOREIGN KEY (destination_project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: doc_groups_sharing doc_groups_sharing_destination_project_name_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doc_groups_sharing
    ADD CONSTRAINT doc_groups_sharing_destination_project_name_fkey FOREIGN KEY (destination_project_name) REFERENCES public.projects(course_name) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: doc_groups_sharing doc_groups_sharing_doc_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doc_groups_sharing
    ADD CONSTRAINT doc_groups_sharing_doc_group_id_fkey FOREIGN KEY (doc_group_id) REFERENCES public.doc_groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: llm-guided-contexts llm-guided-contexts_doc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."llm-guided-contexts"
    ADD CONSTRAINT "llm-guided-contexts_doc_id_fkey" FOREIGN KEY (doc_id) REFERENCES public."llm-guided-docs"(id) ON DELETE CASCADE;


--
-- Name: llm-guided-contexts llm-guided-contexts_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."llm-guided-contexts"
    ADD CONSTRAINT "llm-guided-contexts_section_id_fkey" FOREIGN KEY (section_id) REFERENCES public."llm-guided-sections"(id) ON DELETE CASCADE;


--
-- Name: llm-guided-sections llm-guided-sections_doc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."llm-guided-sections"
    ADD CONSTRAINT "llm-guided-sections_doc_id_fkey" FOREIGN KEY (doc_id) REFERENCES public."llm-guided-docs"(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: projects projects_subscribed_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_subscribed_fkey FOREIGN KEY (subscribed) REFERENCES public.doc_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents_doc_groups public_documents_doc_groups_doc_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_doc_groups
    ADD CONSTRAINT public_documents_doc_groups_doc_group_id_fkey FOREIGN KEY (doc_group_id) REFERENCES public.doc_groups(id) ON DELETE CASCADE;


--
-- Name: documents_doc_groups public_documents_doc_groups_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_doc_groups
    ADD CONSTRAINT public_documents_doc_groups_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: api_keys Enable execute for anon/service_role users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable execute for anon/service_role users only" ON public.api_keys TO anon, service_role;


--
-- Name: api_keys; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: cedar_runs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cedar_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: cropwizard-papers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."cropwizard-papers" ENABLE ROW LEVEL SECURITY;

--
-- Name: depricated_uiuc_chatbot; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.depricated_uiuc_chatbot ENABLE ROW LEVEL SECURITY;

--
-- Name: doc_groups; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.doc_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: doc_groups_sharing; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.doc_groups_sharing ENABLE ROW LEVEL SECURITY;

--
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: documents_doc_groups; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.documents_doc_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: documents_failed; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.documents_failed ENABLE ROW LEVEL SECURITY;

--
-- Name: documents_in_progress; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.documents_in_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: email-newsletter; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."email-newsletter" ENABLE ROW LEVEL SECURITY;

--
-- Name: folders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

--
-- Name: llm-convo-monitor; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."llm-convo-monitor" ENABLE ROW LEVEL SECURITY;

--
-- Name: llm-guided-contexts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."llm-guided-contexts" ENABLE ROW LEVEL SECURITY;

--
-- Name: llm-guided-docs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."llm-guided-docs" ENABLE ROW LEVEL SECURITY;

--
-- Name: llm-guided-sections; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."llm-guided-sections" ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: n8n_workflows; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.n8n_workflows ENABLE ROW LEVEL SECURITY;

--
-- Name: nal_publications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.nal_publications ENABLE ROW LEVEL SECURITY;

--
-- Name: pre_authorized_api_keys; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pre_authorized_api_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: project_stats; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.project_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: publications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

--
-- Name: pubmed_daily_update; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pubmed_daily_update ENABLE ROW LEVEL SECURITY;

--
-- Name: uiuc-course-table; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public."uiuc-course-table" ENABLE ROW LEVEL SECURITY;

--
-- Name: usage_metrics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: supabase_realtime project_stats; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.project_stats;


--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT ALL ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA graphql_public; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA graphql_public TO anon;
GRANT USAGE ON SCHEMA graphql_public TO authenticated;
GRANT USAGE ON SCHEMA graphql_public TO service_role;
GRANT USAGE ON SCHEMA graphql_public TO postgres;


--
-- Name: SCHEMA keycloak; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA keycloak TO anon;
GRANT USAGE ON SCHEMA keycloak TO authenticated;
GRANT USAGE ON SCHEMA keycloak TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;
GRANT USAGE ON SCHEMA realtime TO postgres;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO dashboard_user;
GRANT ALL ON SCHEMA storage TO postgres;


--
-- Name: FUNCTION gtrgm_in(cstring); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO service_role;
GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO postgres;


--
-- Name: FUNCTION gtrgm_out(public.gtrgm); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO service_role;
GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO postgres;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;
GRANT ALL ON FUNCTION auth.email() TO postgres;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;
GRANT ALL ON FUNCTION auth.jwt() TO postgres;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;
GRANT ALL ON FUNCTION auth.role() TO postgres;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;
GRANT ALL ON FUNCTION auth.uid() TO postgres;


--
-- Name: FUNCTION algorithm_sign(signables text, secret text, algorithm text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.algorithm_sign(signables text, secret text, algorithm text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.algorithm_sign(signables text, secret text, algorithm text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION bytea_to_text(data bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.bytea_to_text(data bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM postgres;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM postgres;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION http(request extensions.http_request); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.http(request extensions.http_request) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION http_delete(uri character varying); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.http_delete(uri character varying) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION http_delete(uri character varying, content character varying, content_type character varying); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.http_delete(uri character varying, content character varying, content_type character varying) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION http_get(uri character varying); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.http_get(uri character varying) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION http_get(uri character varying, data jsonb); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.http_get(uri character varying, data jsonb) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION http_head(uri character varying); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.http_head(uri character varying) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION http_header(field character varying, value character varying); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.http_header(field character varying, value character varying) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION http_list_curlopt(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.http_list_curlopt() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION http_patch(uri character varying, content character varying, content_type character varying); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.http_patch(uri character varying, content character varying, content_type character varying) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION http_post(uri character varying, data jsonb); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.http_post(uri character varying, data jsonb) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION http_post(uri character varying, content character varying, content_type character varying); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.http_post(uri character varying, content character varying, content_type character varying) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION http_put(uri character varying, content character varying, content_type character varying); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.http_put(uri character varying, content character varying, content_type character varying) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION http_reset_curlopt(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.http_reset_curlopt() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION http_set_curlopt(curlopt character varying, value character varying); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.http_set_curlopt(curlopt character varying, value character varying) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION index_advisor(query text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.index_advisor(query text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sign(payload json, secret text, algorithm text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sign(payload json, secret text, algorithm text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.sign(payload json, secret text, algorithm text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION text_to_bytea(data text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.text_to_bytea(data text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION try_cast_double(inp text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.try_cast_double(inp text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.try_cast_double(inp text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION url_decode(data text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.url_decode(data text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.url_decode(data text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION url_encode(data bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.url_encode(data bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.url_encode(data bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION urlencode(string bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.urlencode(string bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION urlencode(data jsonb); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.urlencode(data jsonb) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION urlencode(string character varying); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.urlencode(string character varying) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION verify(token text, secret text, algorithm text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.verify(token text, secret text, algorithm text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.verify(token text, secret text, algorithm text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: postgres
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: FUNCTION crypto_aead_det_decrypt(message bytea, additional bytea, key_uuid uuid, nonce bytea); Type: ACL; Schema: pgsodium; Owner: pgsodium_keymaker
--

GRANT ALL ON FUNCTION pgsodium.crypto_aead_det_decrypt(message bytea, additional bytea, key_uuid uuid, nonce bytea) TO service_role;


--
-- Name: FUNCTION crypto_aead_det_encrypt(message bytea, additional bytea, key_uuid uuid, nonce bytea); Type: ACL; Schema: pgsodium; Owner: pgsodium_keymaker
--

GRANT ALL ON FUNCTION pgsodium.crypto_aead_det_encrypt(message bytea, additional bytea, key_uuid uuid, nonce bytea) TO service_role;


--
-- Name: FUNCTION crypto_aead_det_keygen(); Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pgsodium.crypto_aead_det_keygen() TO service_role;


--
-- Name: FUNCTION add_document_to_group(p_course_name text, p_s3_path text, p_url text, p_readable_filename text, p_doc_groups text[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.add_document_to_group(p_course_name text, p_s3_path text, p_url text, p_readable_filename text, p_doc_groups text[]) TO anon;
GRANT ALL ON FUNCTION public.add_document_to_group(p_course_name text, p_s3_path text, p_url text, p_readable_filename text, p_doc_groups text[]) TO authenticated;
GRANT ALL ON FUNCTION public.add_document_to_group(p_course_name text, p_s3_path text, p_url text, p_readable_filename text, p_doc_groups text[]) TO service_role;


--
-- Name: FUNCTION add_document_to_group_url(p_course_name text, p_s3_path text, p_url text, p_readable_filename text, p_doc_groups text[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.add_document_to_group_url(p_course_name text, p_s3_path text, p_url text, p_readable_filename text, p_doc_groups text[]) TO anon;
GRANT ALL ON FUNCTION public.add_document_to_group_url(p_course_name text, p_s3_path text, p_url text, p_readable_filename text, p_doc_groups text[]) TO authenticated;
GRANT ALL ON FUNCTION public.add_document_to_group_url(p_course_name text, p_s3_path text, p_url text, p_readable_filename text, p_doc_groups text[]) TO service_role;


--
-- Name: FUNCTION c(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.c() TO anon;
GRANT ALL ON FUNCTION public.c() TO authenticated;
GRANT ALL ON FUNCTION public.c() TO service_role;


--
-- Name: FUNCTION calculate_weekly_trends(course_name_input text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.calculate_weekly_trends(course_name_input text) TO anon;
GRANT ALL ON FUNCTION public.calculate_weekly_trends(course_name_input text) TO authenticated;
GRANT ALL ON FUNCTION public.calculate_weekly_trends(course_name_input text) TO service_role;


--
-- Name: FUNCTION check_and_lock_flows_v2(id integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.check_and_lock_flows_v2(id integer) TO anon;
GRANT ALL ON FUNCTION public.check_and_lock_flows_v2(id integer) TO authenticated;
GRANT ALL ON FUNCTION public.check_and_lock_flows_v2(id integer) TO service_role;


--
-- Name: FUNCTION cn(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cn() TO anon;
GRANT ALL ON FUNCTION public.cn() TO authenticated;
GRANT ALL ON FUNCTION public.cn() TO service_role;


--
-- Name: FUNCTION count_models_by_project(project_name_input text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.count_models_by_project(project_name_input text) TO anon;
GRANT ALL ON FUNCTION public.count_models_by_project(project_name_input text) TO authenticated;
GRANT ALL ON FUNCTION public.count_models_by_project(project_name_input text) TO service_role;


--
-- Name: FUNCTION count_models_by_project_v2(project_name_input text, start_date timestamp without time zone, end_date timestamp without time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.count_models_by_project_v2(project_name_input text, start_date timestamp without time zone, end_date timestamp without time zone) TO anon;
GRANT ALL ON FUNCTION public.count_models_by_project_v2(project_name_input text, start_date timestamp without time zone, end_date timestamp without time zone) TO authenticated;
GRANT ALL ON FUNCTION public.count_models_by_project_v2(project_name_input text, start_date timestamp without time zone, end_date timestamp without time zone) TO service_role;


--
-- Name: FUNCTION get_base_url_with_doc_groups(p_course_name text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_base_url_with_doc_groups(p_course_name text) TO anon;
GRANT ALL ON FUNCTION public.get_base_url_with_doc_groups(p_course_name text) TO authenticated;
GRANT ALL ON FUNCTION public.get_base_url_with_doc_groups(p_course_name text) TO service_role;


--
-- Name: FUNCTION get_convo_maps(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_convo_maps() TO anon;
GRANT ALL ON FUNCTION public.get_convo_maps() TO authenticated;
GRANT ALL ON FUNCTION public.get_convo_maps() TO service_role;


--
-- Name: FUNCTION get_course_details(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_course_details() TO anon;
GRANT ALL ON FUNCTION public.get_course_details() TO authenticated;
GRANT ALL ON FUNCTION public.get_course_details() TO service_role;


--
-- Name: FUNCTION get_course_names(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_course_names() TO anon;
GRANT ALL ON FUNCTION public.get_course_names() TO authenticated;
GRANT ALL ON FUNCTION public.get_course_names() TO service_role;


--
-- Name: FUNCTION get_distinct_base_urls(p_course_name text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_distinct_base_urls(p_course_name text) TO anon;
GRANT ALL ON FUNCTION public.get_distinct_base_urls(p_course_name text) TO authenticated;
GRANT ALL ON FUNCTION public.get_distinct_base_urls(p_course_name text) TO service_role;


--
-- Name: FUNCTION get_distinct_course_names(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_distinct_course_names() TO anon;
GRANT ALL ON FUNCTION public.get_distinct_course_names() TO authenticated;
GRANT ALL ON FUNCTION public.get_distinct_course_names() TO service_role;


--
-- Name: FUNCTION get_doc_map_details(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_doc_map_details() TO anon;
GRANT ALL ON FUNCTION public.get_doc_map_details() TO authenticated;
GRANT ALL ON FUNCTION public.get_doc_map_details() TO service_role;


--
-- Name: FUNCTION get_latest_workflow_id(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_latest_workflow_id() TO anon;
GRANT ALL ON FUNCTION public.get_latest_workflow_id() TO authenticated;
GRANT ALL ON FUNCTION public.get_latest_workflow_id() TO service_role;


--
-- Name: FUNCTION get_run_data(p_run_ids text, p_limit integer, p_offset integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_run_data(p_run_ids text, p_limit integer, p_offset integer) TO anon;
GRANT ALL ON FUNCTION public.get_run_data(p_run_ids text, p_limit integer, p_offset integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_run_data(p_run_ids text, p_limit integer, p_offset integer) TO service_role;


--
-- Name: FUNCTION gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO service_role;
GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO postgres;


--
-- Name: FUNCTION gin_extract_value_trgm(text, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO service_role;
GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO postgres;


--
-- Name: FUNCTION gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO service_role;
GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO postgres;


--
-- Name: FUNCTION gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO service_role;
GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO postgres;


--
-- Name: FUNCTION gtrgm_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO service_role;
GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO postgres;


--
-- Name: FUNCTION gtrgm_consistent(internal, text, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO service_role;
GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO postgres;


--
-- Name: FUNCTION gtrgm_decompress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO service_role;
GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO postgres;


--
-- Name: FUNCTION gtrgm_distance(internal, text, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO service_role;
GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO postgres;


--
-- Name: FUNCTION gtrgm_options(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO service_role;
GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO postgres;


--
-- Name: FUNCTION gtrgm_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO service_role;
GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO postgres;


--
-- Name: FUNCTION gtrgm_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO service_role;
GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO postgres;


--
-- Name: FUNCTION gtrgm_same(public.gtrgm, public.gtrgm, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO service_role;
GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO postgres;


--
-- Name: FUNCTION gtrgm_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO service_role;
GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO postgres;


--
-- Name: FUNCTION hello(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hello() TO anon;
GRANT ALL ON FUNCTION public.hello() TO authenticated;
GRANT ALL ON FUNCTION public.hello() TO service_role;


--
-- Name: FUNCTION hypopg(OUT indexname text, OUT indexrelid oid, OUT indrelid oid, OUT innatts integer, OUT indisunique boolean, OUT indkey int2vector, OUT indcollation oidvector, OUT indclass oidvector, OUT indoption oidvector, OUT indexprs pg_node_tree, OUT indpred pg_node_tree, OUT amid oid); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hypopg(OUT indexname text, OUT indexrelid oid, OUT indrelid oid, OUT innatts integer, OUT indisunique boolean, OUT indkey int2vector, OUT indcollation oidvector, OUT indclass oidvector, OUT indoption oidvector, OUT indexprs pg_node_tree, OUT indpred pg_node_tree, OUT amid oid) TO anon;
GRANT ALL ON FUNCTION public.hypopg(OUT indexname text, OUT indexrelid oid, OUT indrelid oid, OUT innatts integer, OUT indisunique boolean, OUT indkey int2vector, OUT indcollation oidvector, OUT indclass oidvector, OUT indoption oidvector, OUT indexprs pg_node_tree, OUT indpred pg_node_tree, OUT amid oid) TO authenticated;
GRANT ALL ON FUNCTION public.hypopg(OUT indexname text, OUT indexrelid oid, OUT indrelid oid, OUT innatts integer, OUT indisunique boolean, OUT indkey int2vector, OUT indcollation oidvector, OUT indclass oidvector, OUT indoption oidvector, OUT indexprs pg_node_tree, OUT indpred pg_node_tree, OUT amid oid) TO service_role;
GRANT ALL ON FUNCTION public.hypopg(OUT indexname text, OUT indexrelid oid, OUT indrelid oid, OUT innatts integer, OUT indisunique boolean, OUT indkey int2vector, OUT indcollation oidvector, OUT indclass oidvector, OUT indoption oidvector, OUT indexprs pg_node_tree, OUT indpred pg_node_tree, OUT amid oid) TO postgres;


--
-- Name: FUNCTION hypopg_create_index(sql_order text, OUT indexrelid oid, OUT indexname text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hypopg_create_index(sql_order text, OUT indexrelid oid, OUT indexname text) TO anon;
GRANT ALL ON FUNCTION public.hypopg_create_index(sql_order text, OUT indexrelid oid, OUT indexname text) TO authenticated;
GRANT ALL ON FUNCTION public.hypopg_create_index(sql_order text, OUT indexrelid oid, OUT indexname text) TO service_role;
GRANT ALL ON FUNCTION public.hypopg_create_index(sql_order text, OUT indexrelid oid, OUT indexname text) TO postgres;


--
-- Name: FUNCTION hypopg_drop_index(indexid oid); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hypopg_drop_index(indexid oid) TO anon;
GRANT ALL ON FUNCTION public.hypopg_drop_index(indexid oid) TO authenticated;
GRANT ALL ON FUNCTION public.hypopg_drop_index(indexid oid) TO service_role;
GRANT ALL ON FUNCTION public.hypopg_drop_index(indexid oid) TO postgres;


--
-- Name: FUNCTION hypopg_get_indexdef(indexid oid); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hypopg_get_indexdef(indexid oid) TO anon;
GRANT ALL ON FUNCTION public.hypopg_get_indexdef(indexid oid) TO authenticated;
GRANT ALL ON FUNCTION public.hypopg_get_indexdef(indexid oid) TO service_role;
GRANT ALL ON FUNCTION public.hypopg_get_indexdef(indexid oid) TO postgres;


--
-- Name: FUNCTION hypopg_hidden_indexes(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hypopg_hidden_indexes() TO postgres;
GRANT ALL ON FUNCTION public.hypopg_hidden_indexes() TO anon;
GRANT ALL ON FUNCTION public.hypopg_hidden_indexes() TO authenticated;
GRANT ALL ON FUNCTION public.hypopg_hidden_indexes() TO service_role;


--
-- Name: FUNCTION hypopg_hide_index(indexid oid); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hypopg_hide_index(indexid oid) TO postgres;
GRANT ALL ON FUNCTION public.hypopg_hide_index(indexid oid) TO anon;
GRANT ALL ON FUNCTION public.hypopg_hide_index(indexid oid) TO authenticated;
GRANT ALL ON FUNCTION public.hypopg_hide_index(indexid oid) TO service_role;


--
-- Name: FUNCTION hypopg_relation_size(indexid oid); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hypopg_relation_size(indexid oid) TO anon;
GRANT ALL ON FUNCTION public.hypopg_relation_size(indexid oid) TO authenticated;
GRANT ALL ON FUNCTION public.hypopg_relation_size(indexid oid) TO service_role;
GRANT ALL ON FUNCTION public.hypopg_relation_size(indexid oid) TO postgres;


--
-- Name: FUNCTION hypopg_reset(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hypopg_reset() TO anon;
GRANT ALL ON FUNCTION public.hypopg_reset() TO authenticated;
GRANT ALL ON FUNCTION public.hypopg_reset() TO service_role;
GRANT ALL ON FUNCTION public.hypopg_reset() TO postgres;


--
-- Name: FUNCTION hypopg_reset_index(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hypopg_reset_index() TO anon;
GRANT ALL ON FUNCTION public.hypopg_reset_index() TO authenticated;
GRANT ALL ON FUNCTION public.hypopg_reset_index() TO service_role;
GRANT ALL ON FUNCTION public.hypopg_reset_index() TO postgres;


--
-- Name: FUNCTION hypopg_unhide_all_indexes(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hypopg_unhide_all_indexes() TO postgres;
GRANT ALL ON FUNCTION public.hypopg_unhide_all_indexes() TO anon;
GRANT ALL ON FUNCTION public.hypopg_unhide_all_indexes() TO authenticated;
GRANT ALL ON FUNCTION public.hypopg_unhide_all_indexes() TO service_role;


--
-- Name: FUNCTION hypopg_unhide_index(indexid oid); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hypopg_unhide_index(indexid oid) TO postgres;
GRANT ALL ON FUNCTION public.hypopg_unhide_index(indexid oid) TO anon;
GRANT ALL ON FUNCTION public.hypopg_unhide_index(indexid oid) TO authenticated;
GRANT ALL ON FUNCTION public.hypopg_unhide_index(indexid oid) TO service_role;


--
-- Name: FUNCTION increment(usage integer, apikey text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment(usage integer, apikey text) TO anon;
GRANT ALL ON FUNCTION public.increment(usage integer, apikey text) TO authenticated;
GRANT ALL ON FUNCTION public.increment(usage integer, apikey text) TO service_role;


--
-- Name: FUNCTION increment_api_usage(usage integer, apikey text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_api_usage(usage integer, apikey text) TO anon;
GRANT ALL ON FUNCTION public.increment_api_usage(usage integer, apikey text) TO authenticated;
GRANT ALL ON FUNCTION public.increment_api_usage(usage integer, apikey text) TO service_role;


--
-- Name: FUNCTION increment_api_usage_count(usage integer, apikey text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_api_usage_count(usage integer, apikey text) TO anon;
GRANT ALL ON FUNCTION public.increment_api_usage_count(usage integer, apikey text) TO authenticated;
GRANT ALL ON FUNCTION public.increment_api_usage_count(usage integer, apikey text) TO service_role;


--
-- Name: FUNCTION increment_workflows(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_workflows() TO anon;
GRANT ALL ON FUNCTION public.increment_workflows() TO authenticated;
GRANT ALL ON FUNCTION public.increment_workflows() TO service_role;


--
-- Name: FUNCTION index_advisor(query text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.index_advisor(query text) TO anon;
GRANT ALL ON FUNCTION public.index_advisor(query text) TO authenticated;
GRANT ALL ON FUNCTION public.index_advisor(query text) TO service_role;


--
-- Name: FUNCTION initialize_project_stats(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.initialize_project_stats() TO anon;
GRANT ALL ON FUNCTION public.initialize_project_stats() TO authenticated;
GRANT ALL ON FUNCTION public.initialize_project_stats() TO service_role;


--
-- Name: FUNCTION myfunc(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.myfunc() TO anon;
GRANT ALL ON FUNCTION public.myfunc() TO authenticated;
GRANT ALL ON FUNCTION public.myfunc() TO service_role;


--
-- Name: FUNCTION remove_document_from_group(p_course_name text, p_s3_path text, p_url text, p_doc_group text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.remove_document_from_group(p_course_name text, p_s3_path text, p_url text, p_doc_group text) TO anon;
GRANT ALL ON FUNCTION public.remove_document_from_group(p_course_name text, p_s3_path text, p_url text, p_doc_group text) TO authenticated;
GRANT ALL ON FUNCTION public.remove_document_from_group(p_course_name text, p_s3_path text, p_url text, p_doc_group text) TO service_role;


--
-- Name: FUNCTION search_conversations(p_user_email text, p_project_name text, p_search_term text, p_limit integer, p_offset integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.search_conversations(p_user_email text, p_project_name text, p_search_term text, p_limit integer, p_offset integer) TO anon;
GRANT ALL ON FUNCTION public.search_conversations(p_user_email text, p_project_name text, p_search_term text, p_limit integer, p_offset integer) TO authenticated;
GRANT ALL ON FUNCTION public.search_conversations(p_user_email text, p_project_name text, p_search_term text, p_limit integer, p_offset integer) TO service_role;


--
-- Name: FUNCTION search_conversations_v2(p_user_email text, p_project_name text, p_search_term text, p_limit integer, p_offset integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.search_conversations_v2(p_user_email text, p_project_name text, p_search_term text, p_limit integer, p_offset integer) TO anon;
GRANT ALL ON FUNCTION public.search_conversations_v2(p_user_email text, p_project_name text, p_search_term text, p_limit integer, p_offset integer) TO authenticated;
GRANT ALL ON FUNCTION public.search_conversations_v2(p_user_email text, p_project_name text, p_search_term text, p_limit integer, p_offset integer) TO service_role;


--
-- Name: FUNCTION search_conversations_v3(p_user_email text, p_project_name text, p_search_term text, p_limit integer, p_offset integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.search_conversations_v3(p_user_email text, p_project_name text, p_search_term text, p_limit integer, p_offset integer) TO anon;
GRANT ALL ON FUNCTION public.search_conversations_v3(p_user_email text, p_project_name text, p_search_term text, p_limit integer, p_offset integer) TO authenticated;
GRANT ALL ON FUNCTION public.search_conversations_v3(p_user_email text, p_project_name text, p_search_term text, p_limit integer, p_offset integer) TO service_role;


--
-- Name: FUNCTION set_limit(real); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.set_limit(real) TO anon;
GRANT ALL ON FUNCTION public.set_limit(real) TO authenticated;
GRANT ALL ON FUNCTION public.set_limit(real) TO service_role;
GRANT ALL ON FUNCTION public.set_limit(real) TO postgres;


--
-- Name: FUNCTION show_limit(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.show_limit() TO anon;
GRANT ALL ON FUNCTION public.show_limit() TO authenticated;
GRANT ALL ON FUNCTION public.show_limit() TO service_role;
GRANT ALL ON FUNCTION public.show_limit() TO postgres;


--
-- Name: FUNCTION show_trgm(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.show_trgm(text) TO anon;
GRANT ALL ON FUNCTION public.show_trgm(text) TO authenticated;
GRANT ALL ON FUNCTION public.show_trgm(text) TO service_role;
GRANT ALL ON FUNCTION public.show_trgm(text) TO postgres;


--
-- Name: FUNCTION similarity(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.similarity(text, text) TO anon;
GRANT ALL ON FUNCTION public.similarity(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.similarity(text, text) TO service_role;
GRANT ALL ON FUNCTION public.similarity(text, text) TO postgres;


--
-- Name: FUNCTION similarity_dist(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO anon;
GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO service_role;
GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO postgres;


--
-- Name: FUNCTION similarity_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.similarity_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.similarity_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.similarity_op(text, text) TO service_role;
GRANT ALL ON FUNCTION public.similarity_op(text, text) TO postgres;


--
-- Name: FUNCTION strict_word_similarity(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO service_role;
GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO postgres;


--
-- Name: FUNCTION strict_word_similarity_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO service_role;
GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO postgres;


--
-- Name: FUNCTION strict_word_similarity_dist_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO service_role;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO postgres;


--
-- Name: FUNCTION strict_word_similarity_dist_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO service_role;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO postgres;


--
-- Name: FUNCTION strict_word_similarity_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO service_role;
GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO postgres;


--
-- Name: FUNCTION test_function(id integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.test_function(id integer) TO anon;
GRANT ALL ON FUNCTION public.test_function(id integer) TO authenticated;
GRANT ALL ON FUNCTION public.test_function(id integer) TO service_role;


--
-- Name: FUNCTION update_doc_count(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_doc_count() TO anon;
GRANT ALL ON FUNCTION public.update_doc_count() TO authenticated;
GRANT ALL ON FUNCTION public.update_doc_count() TO service_role;


--
-- Name: FUNCTION update_project_stats(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_project_stats() TO anon;
GRANT ALL ON FUNCTION public.update_project_stats() TO authenticated;
GRANT ALL ON FUNCTION public.update_project_stats() TO service_role;


--
-- Name: FUNCTION update_total_messages_by_id_range(start_id integer, end_id integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_total_messages_by_id_range(start_id integer, end_id integer) TO anon;
GRANT ALL ON FUNCTION public.update_total_messages_by_id_range(start_id integer, end_id integer) TO authenticated;
GRANT ALL ON FUNCTION public.update_total_messages_by_id_range(start_id integer, end_id integer) TO service_role;


--
-- Name: FUNCTION word_similarity(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity(text, text) TO service_role;
GRANT ALL ON FUNCTION public.word_similarity(text, text) TO postgres;


--
-- Name: FUNCTION word_similarity_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO service_role;
GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO postgres;


--
-- Name: FUNCTION word_similarity_dist_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO service_role;
GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO postgres;


--
-- Name: FUNCTION word_similarity_dist_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO service_role;
GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO postgres;


--
-- Name: FUNCTION word_similarity_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO service_role;
GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO postgres;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO supabase_realtime_admin;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.topic() TO postgres;


--
-- Name: FUNCTION can_insert_object(bucketid text, name text, owner uuid, metadata jsonb); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) TO postgres;


--
-- Name: FUNCTION extension(name text); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.extension(name text) TO anon;
GRANT ALL ON FUNCTION storage.extension(name text) TO authenticated;
GRANT ALL ON FUNCTION storage.extension(name text) TO service_role;
GRANT ALL ON FUNCTION storage.extension(name text) TO dashboard_user;
GRANT ALL ON FUNCTION storage.extension(name text) TO postgres;


--
-- Name: FUNCTION filename(name text); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.filename(name text) TO anon;
GRANT ALL ON FUNCTION storage.filename(name text) TO authenticated;
GRANT ALL ON FUNCTION storage.filename(name text) TO service_role;
GRANT ALL ON FUNCTION storage.filename(name text) TO dashboard_user;
GRANT ALL ON FUNCTION storage.filename(name text) TO postgres;


--
-- Name: FUNCTION foldername(name text); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.foldername(name text) TO anon;
GRANT ALL ON FUNCTION storage.foldername(name text) TO authenticated;
GRANT ALL ON FUNCTION storage.foldername(name text) TO service_role;
GRANT ALL ON FUNCTION storage.foldername(name text) TO dashboard_user;
GRANT ALL ON FUNCTION storage.foldername(name text) TO postgres;


--
-- Name: FUNCTION get_size_by_bucket(); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.get_size_by_bucket() TO postgres;


--
-- Name: FUNCTION search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) TO postgres;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.update_updated_at_column() TO postgres;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.flow_state TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.identities TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.schema_migrations TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.schema_migrations TO postgres;
GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.sessions TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;


--
-- Name: TABLE admin_event_entity; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.admin_event_entity TO anon;
GRANT ALL ON TABLE keycloak.admin_event_entity TO authenticated;
GRANT ALL ON TABLE keycloak.admin_event_entity TO service_role;


--
-- Name: TABLE associated_policy; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.associated_policy TO anon;
GRANT ALL ON TABLE keycloak.associated_policy TO authenticated;
GRANT ALL ON TABLE keycloak.associated_policy TO service_role;


--
-- Name: TABLE authentication_execution; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.authentication_execution TO anon;
GRANT ALL ON TABLE keycloak.authentication_execution TO authenticated;
GRANT ALL ON TABLE keycloak.authentication_execution TO service_role;


--
-- Name: TABLE authentication_flow; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.authentication_flow TO anon;
GRANT ALL ON TABLE keycloak.authentication_flow TO authenticated;
GRANT ALL ON TABLE keycloak.authentication_flow TO service_role;


--
-- Name: TABLE authenticator_config; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.authenticator_config TO anon;
GRANT ALL ON TABLE keycloak.authenticator_config TO authenticated;
GRANT ALL ON TABLE keycloak.authenticator_config TO service_role;


--
-- Name: TABLE authenticator_config_entry; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.authenticator_config_entry TO anon;
GRANT ALL ON TABLE keycloak.authenticator_config_entry TO authenticated;
GRANT ALL ON TABLE keycloak.authenticator_config_entry TO service_role;


--
-- Name: TABLE broker_link; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.broker_link TO anon;
GRANT ALL ON TABLE keycloak.broker_link TO authenticated;
GRANT ALL ON TABLE keycloak.broker_link TO service_role;


--
-- Name: TABLE client; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.client TO anon;
GRANT ALL ON TABLE keycloak.client TO authenticated;
GRANT ALL ON TABLE keycloak.client TO service_role;


--
-- Name: TABLE client_attributes; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.client_attributes TO anon;
GRANT ALL ON TABLE keycloak.client_attributes TO authenticated;
GRANT ALL ON TABLE keycloak.client_attributes TO service_role;


--
-- Name: TABLE client_auth_flow_bindings; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.client_auth_flow_bindings TO anon;
GRANT ALL ON TABLE keycloak.client_auth_flow_bindings TO authenticated;
GRANT ALL ON TABLE keycloak.client_auth_flow_bindings TO service_role;


--
-- Name: TABLE client_initial_access; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.client_initial_access TO anon;
GRANT ALL ON TABLE keycloak.client_initial_access TO authenticated;
GRANT ALL ON TABLE keycloak.client_initial_access TO service_role;


--
-- Name: TABLE client_node_registrations; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.client_node_registrations TO anon;
GRANT ALL ON TABLE keycloak.client_node_registrations TO authenticated;
GRANT ALL ON TABLE keycloak.client_node_registrations TO service_role;


--
-- Name: TABLE client_scope; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.client_scope TO anon;
GRANT ALL ON TABLE keycloak.client_scope TO authenticated;
GRANT ALL ON TABLE keycloak.client_scope TO service_role;


--
-- Name: TABLE client_scope_attributes; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.client_scope_attributes TO anon;
GRANT ALL ON TABLE keycloak.client_scope_attributes TO authenticated;
GRANT ALL ON TABLE keycloak.client_scope_attributes TO service_role;


--
-- Name: TABLE client_scope_client; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.client_scope_client TO anon;
GRANT ALL ON TABLE keycloak.client_scope_client TO authenticated;
GRANT ALL ON TABLE keycloak.client_scope_client TO service_role;


--
-- Name: TABLE client_scope_role_mapping; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.client_scope_role_mapping TO anon;
GRANT ALL ON TABLE keycloak.client_scope_role_mapping TO authenticated;
GRANT ALL ON TABLE keycloak.client_scope_role_mapping TO service_role;


--
-- Name: TABLE client_session; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.client_session TO anon;
GRANT ALL ON TABLE keycloak.client_session TO authenticated;
GRANT ALL ON TABLE keycloak.client_session TO service_role;


--
-- Name: TABLE client_session_auth_status; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.client_session_auth_status TO anon;
GRANT ALL ON TABLE keycloak.client_session_auth_status TO authenticated;
GRANT ALL ON TABLE keycloak.client_session_auth_status TO service_role;


--
-- Name: TABLE client_session_note; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.client_session_note TO anon;
GRANT ALL ON TABLE keycloak.client_session_note TO authenticated;
GRANT ALL ON TABLE keycloak.client_session_note TO service_role;


--
-- Name: TABLE client_session_prot_mapper; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.client_session_prot_mapper TO anon;
GRANT ALL ON TABLE keycloak.client_session_prot_mapper TO authenticated;
GRANT ALL ON TABLE keycloak.client_session_prot_mapper TO service_role;


--
-- Name: TABLE client_session_role; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.client_session_role TO anon;
GRANT ALL ON TABLE keycloak.client_session_role TO authenticated;
GRANT ALL ON TABLE keycloak.client_session_role TO service_role;


--
-- Name: TABLE client_user_session_note; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.client_user_session_note TO anon;
GRANT ALL ON TABLE keycloak.client_user_session_note TO authenticated;
GRANT ALL ON TABLE keycloak.client_user_session_note TO service_role;


--
-- Name: TABLE component; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.component TO anon;
GRANT ALL ON TABLE keycloak.component TO authenticated;
GRANT ALL ON TABLE keycloak.component TO service_role;


--
-- Name: TABLE component_config; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.component_config TO anon;
GRANT ALL ON TABLE keycloak.component_config TO authenticated;
GRANT ALL ON TABLE keycloak.component_config TO service_role;


--
-- Name: TABLE composite_role; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.composite_role TO anon;
GRANT ALL ON TABLE keycloak.composite_role TO authenticated;
GRANT ALL ON TABLE keycloak.composite_role TO service_role;


--
-- Name: TABLE credential; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.credential TO anon;
GRANT ALL ON TABLE keycloak.credential TO authenticated;
GRANT ALL ON TABLE keycloak.credential TO service_role;


--
-- Name: TABLE databasechangelog; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.databasechangelog TO anon;
GRANT ALL ON TABLE keycloak.databasechangelog TO authenticated;
GRANT ALL ON TABLE keycloak.databasechangelog TO service_role;


--
-- Name: TABLE databasechangeloglock; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.databasechangeloglock TO anon;
GRANT ALL ON TABLE keycloak.databasechangeloglock TO authenticated;
GRANT ALL ON TABLE keycloak.databasechangeloglock TO service_role;


--
-- Name: TABLE default_client_scope; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.default_client_scope TO anon;
GRANT ALL ON TABLE keycloak.default_client_scope TO authenticated;
GRANT ALL ON TABLE keycloak.default_client_scope TO service_role;


--
-- Name: TABLE event_entity; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.event_entity TO anon;
GRANT ALL ON TABLE keycloak.event_entity TO authenticated;
GRANT ALL ON TABLE keycloak.event_entity TO service_role;


--
-- Name: TABLE fed_user_attribute; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.fed_user_attribute TO anon;
GRANT ALL ON TABLE keycloak.fed_user_attribute TO authenticated;
GRANT ALL ON TABLE keycloak.fed_user_attribute TO service_role;


--
-- Name: TABLE fed_user_consent; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.fed_user_consent TO anon;
GRANT ALL ON TABLE keycloak.fed_user_consent TO authenticated;
GRANT ALL ON TABLE keycloak.fed_user_consent TO service_role;


--
-- Name: TABLE fed_user_consent_cl_scope; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.fed_user_consent_cl_scope TO anon;
GRANT ALL ON TABLE keycloak.fed_user_consent_cl_scope TO authenticated;
GRANT ALL ON TABLE keycloak.fed_user_consent_cl_scope TO service_role;


--
-- Name: TABLE fed_user_credential; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.fed_user_credential TO anon;
GRANT ALL ON TABLE keycloak.fed_user_credential TO authenticated;
GRANT ALL ON TABLE keycloak.fed_user_credential TO service_role;


--
-- Name: TABLE fed_user_group_membership; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.fed_user_group_membership TO anon;
GRANT ALL ON TABLE keycloak.fed_user_group_membership TO authenticated;
GRANT ALL ON TABLE keycloak.fed_user_group_membership TO service_role;


--
-- Name: TABLE fed_user_required_action; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.fed_user_required_action TO anon;
GRANT ALL ON TABLE keycloak.fed_user_required_action TO authenticated;
GRANT ALL ON TABLE keycloak.fed_user_required_action TO service_role;


--
-- Name: TABLE fed_user_role_mapping; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.fed_user_role_mapping TO anon;
GRANT ALL ON TABLE keycloak.fed_user_role_mapping TO authenticated;
GRANT ALL ON TABLE keycloak.fed_user_role_mapping TO service_role;


--
-- Name: TABLE federated_identity; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.federated_identity TO anon;
GRANT ALL ON TABLE keycloak.federated_identity TO authenticated;
GRANT ALL ON TABLE keycloak.federated_identity TO service_role;


--
-- Name: TABLE federated_user; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.federated_user TO anon;
GRANT ALL ON TABLE keycloak.federated_user TO authenticated;
GRANT ALL ON TABLE keycloak.federated_user TO service_role;


--
-- Name: TABLE group_attribute; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.group_attribute TO anon;
GRANT ALL ON TABLE keycloak.group_attribute TO authenticated;
GRANT ALL ON TABLE keycloak.group_attribute TO service_role;


--
-- Name: TABLE group_role_mapping; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.group_role_mapping TO anon;
GRANT ALL ON TABLE keycloak.group_role_mapping TO authenticated;
GRANT ALL ON TABLE keycloak.group_role_mapping TO service_role;


--
-- Name: TABLE identity_provider; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.identity_provider TO anon;
GRANT ALL ON TABLE keycloak.identity_provider TO authenticated;
GRANT ALL ON TABLE keycloak.identity_provider TO service_role;


--
-- Name: TABLE identity_provider_config; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.identity_provider_config TO anon;
GRANT ALL ON TABLE keycloak.identity_provider_config TO authenticated;
GRANT ALL ON TABLE keycloak.identity_provider_config TO service_role;


--
-- Name: TABLE identity_provider_mapper; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.identity_provider_mapper TO anon;
GRANT ALL ON TABLE keycloak.identity_provider_mapper TO authenticated;
GRANT ALL ON TABLE keycloak.identity_provider_mapper TO service_role;


--
-- Name: TABLE idp_mapper_config; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.idp_mapper_config TO anon;
GRANT ALL ON TABLE keycloak.idp_mapper_config TO authenticated;
GRANT ALL ON TABLE keycloak.idp_mapper_config TO service_role;


--
-- Name: TABLE keycloak_group; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.keycloak_group TO anon;
GRANT ALL ON TABLE keycloak.keycloak_group TO authenticated;
GRANT ALL ON TABLE keycloak.keycloak_group TO service_role;


--
-- Name: TABLE keycloak_role; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.keycloak_role TO anon;
GRANT ALL ON TABLE keycloak.keycloak_role TO authenticated;
GRANT ALL ON TABLE keycloak.keycloak_role TO service_role;


--
-- Name: TABLE migration_model; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.migration_model TO anon;
GRANT ALL ON TABLE keycloak.migration_model TO authenticated;
GRANT ALL ON TABLE keycloak.migration_model TO service_role;


--
-- Name: TABLE offline_client_session; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.offline_client_session TO anon;
GRANT ALL ON TABLE keycloak.offline_client_session TO authenticated;
GRANT ALL ON TABLE keycloak.offline_client_session TO service_role;


--
-- Name: TABLE offline_user_session; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.offline_user_session TO anon;
GRANT ALL ON TABLE keycloak.offline_user_session TO authenticated;
GRANT ALL ON TABLE keycloak.offline_user_session TO service_role;


--
-- Name: TABLE org; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.org TO anon;
GRANT ALL ON TABLE keycloak.org TO authenticated;
GRANT ALL ON TABLE keycloak.org TO service_role;


--
-- Name: TABLE org_domain; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.org_domain TO anon;
GRANT ALL ON TABLE keycloak.org_domain TO authenticated;
GRANT ALL ON TABLE keycloak.org_domain TO service_role;


--
-- Name: TABLE policy_config; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.policy_config TO anon;
GRANT ALL ON TABLE keycloak.policy_config TO authenticated;
GRANT ALL ON TABLE keycloak.policy_config TO service_role;


--
-- Name: TABLE protocol_mapper; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.protocol_mapper TO anon;
GRANT ALL ON TABLE keycloak.protocol_mapper TO authenticated;
GRANT ALL ON TABLE keycloak.protocol_mapper TO service_role;


--
-- Name: TABLE protocol_mapper_config; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.protocol_mapper_config TO anon;
GRANT ALL ON TABLE keycloak.protocol_mapper_config TO authenticated;
GRANT ALL ON TABLE keycloak.protocol_mapper_config TO service_role;


--
-- Name: TABLE realm; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.realm TO anon;
GRANT ALL ON TABLE keycloak.realm TO authenticated;
GRANT ALL ON TABLE keycloak.realm TO service_role;


--
-- Name: TABLE realm_attribute; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.realm_attribute TO anon;
GRANT ALL ON TABLE keycloak.realm_attribute TO authenticated;
GRANT ALL ON TABLE keycloak.realm_attribute TO service_role;


--
-- Name: TABLE realm_default_groups; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.realm_default_groups TO anon;
GRANT ALL ON TABLE keycloak.realm_default_groups TO authenticated;
GRANT ALL ON TABLE keycloak.realm_default_groups TO service_role;


--
-- Name: TABLE realm_enabled_event_types; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.realm_enabled_event_types TO anon;
GRANT ALL ON TABLE keycloak.realm_enabled_event_types TO authenticated;
GRANT ALL ON TABLE keycloak.realm_enabled_event_types TO service_role;


--
-- Name: TABLE realm_events_listeners; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.realm_events_listeners TO anon;
GRANT ALL ON TABLE keycloak.realm_events_listeners TO authenticated;
GRANT ALL ON TABLE keycloak.realm_events_listeners TO service_role;


--
-- Name: TABLE realm_localizations; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.realm_localizations TO anon;
GRANT ALL ON TABLE keycloak.realm_localizations TO authenticated;
GRANT ALL ON TABLE keycloak.realm_localizations TO service_role;


--
-- Name: TABLE realm_required_credential; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.realm_required_credential TO anon;
GRANT ALL ON TABLE keycloak.realm_required_credential TO authenticated;
GRANT ALL ON TABLE keycloak.realm_required_credential TO service_role;


--
-- Name: TABLE realm_smtp_config; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.realm_smtp_config TO anon;
GRANT ALL ON TABLE keycloak.realm_smtp_config TO authenticated;
GRANT ALL ON TABLE keycloak.realm_smtp_config TO service_role;


--
-- Name: TABLE realm_supported_locales; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.realm_supported_locales TO anon;
GRANT ALL ON TABLE keycloak.realm_supported_locales TO authenticated;
GRANT ALL ON TABLE keycloak.realm_supported_locales TO service_role;


--
-- Name: TABLE redirect_uris; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.redirect_uris TO anon;
GRANT ALL ON TABLE keycloak.redirect_uris TO authenticated;
GRANT ALL ON TABLE keycloak.redirect_uris TO service_role;


--
-- Name: TABLE required_action_config; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.required_action_config TO anon;
GRANT ALL ON TABLE keycloak.required_action_config TO authenticated;
GRANT ALL ON TABLE keycloak.required_action_config TO service_role;


--
-- Name: TABLE required_action_provider; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.required_action_provider TO anon;
GRANT ALL ON TABLE keycloak.required_action_provider TO authenticated;
GRANT ALL ON TABLE keycloak.required_action_provider TO service_role;


--
-- Name: TABLE resource_attribute; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.resource_attribute TO anon;
GRANT ALL ON TABLE keycloak.resource_attribute TO authenticated;
GRANT ALL ON TABLE keycloak.resource_attribute TO service_role;


--
-- Name: TABLE resource_policy; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.resource_policy TO anon;
GRANT ALL ON TABLE keycloak.resource_policy TO authenticated;
GRANT ALL ON TABLE keycloak.resource_policy TO service_role;


--
-- Name: TABLE resource_scope; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.resource_scope TO anon;
GRANT ALL ON TABLE keycloak.resource_scope TO authenticated;
GRANT ALL ON TABLE keycloak.resource_scope TO service_role;


--
-- Name: TABLE resource_server; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.resource_server TO anon;
GRANT ALL ON TABLE keycloak.resource_server TO authenticated;
GRANT ALL ON TABLE keycloak.resource_server TO service_role;


--
-- Name: TABLE resource_server_perm_ticket; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.resource_server_perm_ticket TO anon;
GRANT ALL ON TABLE keycloak.resource_server_perm_ticket TO authenticated;
GRANT ALL ON TABLE keycloak.resource_server_perm_ticket TO service_role;


--
-- Name: TABLE resource_server_policy; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.resource_server_policy TO anon;
GRANT ALL ON TABLE keycloak.resource_server_policy TO authenticated;
GRANT ALL ON TABLE keycloak.resource_server_policy TO service_role;


--
-- Name: TABLE resource_server_resource; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.resource_server_resource TO anon;
GRANT ALL ON TABLE keycloak.resource_server_resource TO authenticated;
GRANT ALL ON TABLE keycloak.resource_server_resource TO service_role;


--
-- Name: TABLE resource_server_scope; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.resource_server_scope TO anon;
GRANT ALL ON TABLE keycloak.resource_server_scope TO authenticated;
GRANT ALL ON TABLE keycloak.resource_server_scope TO service_role;


--
-- Name: TABLE resource_uris; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.resource_uris TO anon;
GRANT ALL ON TABLE keycloak.resource_uris TO authenticated;
GRANT ALL ON TABLE keycloak.resource_uris TO service_role;


--
-- Name: TABLE role_attribute; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.role_attribute TO anon;
GRANT ALL ON TABLE keycloak.role_attribute TO authenticated;
GRANT ALL ON TABLE keycloak.role_attribute TO service_role;


--
-- Name: TABLE scope_mapping; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.scope_mapping TO anon;
GRANT ALL ON TABLE keycloak.scope_mapping TO authenticated;
GRANT ALL ON TABLE keycloak.scope_mapping TO service_role;


--
-- Name: TABLE scope_policy; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.scope_policy TO anon;
GRANT ALL ON TABLE keycloak.scope_policy TO authenticated;
GRANT ALL ON TABLE keycloak.scope_policy TO service_role;


--
-- Name: TABLE user_attribute; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.user_attribute TO anon;
GRANT ALL ON TABLE keycloak.user_attribute TO authenticated;
GRANT ALL ON TABLE keycloak.user_attribute TO service_role;


--
-- Name: TABLE user_consent; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.user_consent TO anon;
GRANT ALL ON TABLE keycloak.user_consent TO authenticated;
GRANT ALL ON TABLE keycloak.user_consent TO service_role;


--
-- Name: TABLE user_consent_client_scope; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.user_consent_client_scope TO anon;
GRANT ALL ON TABLE keycloak.user_consent_client_scope TO authenticated;
GRANT ALL ON TABLE keycloak.user_consent_client_scope TO service_role;


--
-- Name: TABLE user_entity; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.user_entity TO anon;
GRANT ALL ON TABLE keycloak.user_entity TO authenticated;
GRANT ALL ON TABLE keycloak.user_entity TO service_role;


--
-- Name: TABLE user_federation_config; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.user_federation_config TO anon;
GRANT ALL ON TABLE keycloak.user_federation_config TO authenticated;
GRANT ALL ON TABLE keycloak.user_federation_config TO service_role;


--
-- Name: TABLE user_federation_mapper; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.user_federation_mapper TO anon;
GRANT ALL ON TABLE keycloak.user_federation_mapper TO authenticated;
GRANT ALL ON TABLE keycloak.user_federation_mapper TO service_role;


--
-- Name: TABLE user_federation_mapper_config; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.user_federation_mapper_config TO anon;
GRANT ALL ON TABLE keycloak.user_federation_mapper_config TO authenticated;
GRANT ALL ON TABLE keycloak.user_federation_mapper_config TO service_role;


--
-- Name: TABLE user_federation_provider; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.user_federation_provider TO anon;
GRANT ALL ON TABLE keycloak.user_federation_provider TO authenticated;
GRANT ALL ON TABLE keycloak.user_federation_provider TO service_role;


--
-- Name: TABLE user_group_membership; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.user_group_membership TO anon;
GRANT ALL ON TABLE keycloak.user_group_membership TO authenticated;
GRANT ALL ON TABLE keycloak.user_group_membership TO service_role;


--
-- Name: TABLE user_required_action; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.user_required_action TO anon;
GRANT ALL ON TABLE keycloak.user_required_action TO authenticated;
GRANT ALL ON TABLE keycloak.user_required_action TO service_role;


--
-- Name: TABLE user_role_mapping; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.user_role_mapping TO anon;
GRANT ALL ON TABLE keycloak.user_role_mapping TO authenticated;
GRANT ALL ON TABLE keycloak.user_role_mapping TO service_role;


--
-- Name: TABLE user_session; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.user_session TO anon;
GRANT ALL ON TABLE keycloak.user_session TO authenticated;
GRANT ALL ON TABLE keycloak.user_session TO service_role;


--
-- Name: TABLE user_session_note; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.user_session_note TO anon;
GRANT ALL ON TABLE keycloak.user_session_note TO authenticated;
GRANT ALL ON TABLE keycloak.user_session_note TO service_role;


--
-- Name: TABLE username_login_failure; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.username_login_failure TO anon;
GRANT ALL ON TABLE keycloak.username_login_failure TO authenticated;
GRANT ALL ON TABLE keycloak.username_login_failure TO service_role;


--
-- Name: TABLE web_origins; Type: ACL; Schema: keycloak; Owner: postgres
--

GRANT ALL ON TABLE keycloak.web_origins TO anon;
GRANT ALL ON TABLE keycloak.web_origins TO authenticated;
GRANT ALL ON TABLE keycloak.web_origins TO service_role;


--
-- Name: TABLE decrypted_key; Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON TABLE pgsodium.decrypted_key TO pgsodium_keyholder;


--
-- Name: TABLE masking_rule; Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON TABLE pgsodium.masking_rule TO pgsodium_keyholder;


--
-- Name: TABLE mask_columns; Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON TABLE pgsodium.mask_columns TO pgsodium_keyholder;


--
-- Name: TABLE api_keys; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.api_keys TO anon;
GRANT ALL ON TABLE public.api_keys TO authenticated;
GRANT ALL ON TABLE public.api_keys TO service_role;


--
-- Name: TABLE cedar_chunks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.cedar_chunks TO anon;
GRANT ALL ON TABLE public.cedar_chunks TO authenticated;
GRANT ALL ON TABLE public.cedar_chunks TO service_role;


--
-- Name: SEQUENCE cedar_chunks_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.cedar_chunks_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cedar_chunks_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cedar_chunks_id_seq TO service_role;


--
-- Name: TABLE cedar_document_metadata; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.cedar_document_metadata TO anon;
GRANT ALL ON TABLE public.cedar_document_metadata TO authenticated;
GRANT ALL ON TABLE public.cedar_document_metadata TO service_role;


--
-- Name: SEQUENCE cedar_document_metadata_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.cedar_document_metadata_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cedar_document_metadata_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cedar_document_metadata_id_seq TO service_role;


--
-- Name: TABLE cedar_documents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.cedar_documents TO anon;
GRANT ALL ON TABLE public.cedar_documents TO authenticated;
GRANT ALL ON TABLE public.cedar_documents TO service_role;


--
-- Name: SEQUENCE cedar_documents_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.cedar_documents_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cedar_documents_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cedar_documents_id_seq TO service_role;


--
-- Name: SEQUENCE cedar_documents_id_seq1; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.cedar_documents_id_seq1 TO anon;
GRANT ALL ON SEQUENCE public.cedar_documents_id_seq1 TO authenticated;
GRANT ALL ON SEQUENCE public.cedar_documents_id_seq1 TO service_role;


--
-- Name: TABLE cedar_runs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.cedar_runs TO anon;
GRANT ALL ON TABLE public.cedar_runs TO authenticated;
GRANT ALL ON TABLE public.cedar_runs TO service_role;


--
-- Name: SEQUENCE cedar_runs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.cedar_runs_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cedar_runs_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cedar_runs_id_seq TO service_role;


--
-- Name: TABLE conversations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.conversations TO anon;
GRANT ALL ON TABLE public.conversations TO authenticated;
GRANT ALL ON TABLE public.conversations TO service_role;


--
-- Name: TABLE course_names; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.course_names TO anon;
GRANT ALL ON TABLE public.course_names TO authenticated;
GRANT ALL ON TABLE public.course_names TO service_role;


--
-- Name: TABLE "cropwizard-papers"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."cropwizard-papers" TO anon;
GRANT ALL ON TABLE public."cropwizard-papers" TO authenticated;
GRANT ALL ON TABLE public."cropwizard-papers" TO service_role;


--
-- Name: SEQUENCE "cropwizard-papers_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."cropwizard-papers_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."cropwizard-papers_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."cropwizard-papers_id_seq" TO service_role;


--
-- Name: TABLE depricated_uiuc_chatbot; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.depricated_uiuc_chatbot TO anon;
GRANT ALL ON TABLE public.depricated_uiuc_chatbot TO authenticated;
GRANT ALL ON TABLE public.depricated_uiuc_chatbot TO service_role;


--
-- Name: TABLE documents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.documents TO anon;
GRANT ALL ON TABLE public.documents TO authenticated;
GRANT ALL ON TABLE public.documents TO service_role;


--
-- Name: TABLE distinct_course_names; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.distinct_course_names TO anon;
GRANT ALL ON TABLE public.distinct_course_names TO authenticated;
GRANT ALL ON TABLE public.distinct_course_names TO service_role;


--
-- Name: TABLE doc_groups; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.doc_groups TO anon;
GRANT ALL ON TABLE public.doc_groups TO authenticated;
GRANT ALL ON TABLE public.doc_groups TO service_role;


--
-- Name: SEQUENCE doc_groups_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.doc_groups_id_seq TO anon;
GRANT ALL ON SEQUENCE public.doc_groups_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.doc_groups_id_seq TO service_role;


--
-- Name: TABLE doc_groups_sharing; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.doc_groups_sharing TO anon;
GRANT ALL ON TABLE public.doc_groups_sharing TO authenticated;
GRANT ALL ON TABLE public.doc_groups_sharing TO service_role;


--
-- Name: SEQUENCE doc_groups_sharing_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.doc_groups_sharing_id_seq TO anon;
GRANT ALL ON SEQUENCE public.doc_groups_sharing_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.doc_groups_sharing_id_seq TO service_role;


--
-- Name: TABLE documents_doc_groups; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.documents_doc_groups TO anon;
GRANT ALL ON TABLE public.documents_doc_groups TO authenticated;
GRANT ALL ON TABLE public.documents_doc_groups TO service_role;


--
-- Name: SEQUENCE documents_doc_groups_document_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.documents_doc_groups_document_id_seq TO anon;
GRANT ALL ON SEQUENCE public.documents_doc_groups_document_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.documents_doc_groups_document_id_seq TO service_role;


--
-- Name: TABLE documents_failed; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.documents_failed TO anon;
GRANT ALL ON TABLE public.documents_failed TO authenticated;
GRANT ALL ON TABLE public.documents_failed TO service_role;


--
-- Name: SEQUENCE documents_failed_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.documents_failed_id_seq TO anon;
GRANT ALL ON SEQUENCE public.documents_failed_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.documents_failed_id_seq TO service_role;


--
-- Name: SEQUENCE documents_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.documents_id_seq TO anon;
GRANT ALL ON SEQUENCE public.documents_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.documents_id_seq TO service_role;


--
-- Name: TABLE documents_in_progress; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.documents_in_progress TO anon;
GRANT ALL ON TABLE public.documents_in_progress TO authenticated;
GRANT ALL ON TABLE public.documents_in_progress TO service_role;


--
-- Name: SEQUENCE documents_in_progress_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.documents_in_progress_id_seq TO anon;
GRANT ALL ON SEQUENCE public.documents_in_progress_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.documents_in_progress_id_seq TO service_role;


--
-- Name: TABLE "email-newsletter"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."email-newsletter" TO anon;
GRANT ALL ON TABLE public."email-newsletter" TO authenticated;
GRANT ALL ON TABLE public."email-newsletter" TO service_role;


--
-- Name: TABLE folders; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.folders TO anon;
GRANT ALL ON TABLE public.folders TO authenticated;
GRANT ALL ON TABLE public.folders TO service_role;


--
-- Name: TABLE hypopg_list_indexes; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.hypopg_list_indexes TO anon;
GRANT ALL ON TABLE public.hypopg_list_indexes TO authenticated;
GRANT ALL ON TABLE public.hypopg_list_indexes TO service_role;
GRANT ALL ON TABLE public.hypopg_list_indexes TO postgres;


--
-- Name: TABLE hypopg_hidden_indexes; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.hypopg_hidden_indexes TO postgres;
GRANT ALL ON TABLE public.hypopg_hidden_indexes TO anon;
GRANT ALL ON TABLE public.hypopg_hidden_indexes TO authenticated;
GRANT ALL ON TABLE public.hypopg_hidden_indexes TO service_role;


--
-- Name: TABLE "llm-convo-monitor"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."llm-convo-monitor" TO anon;
GRANT ALL ON TABLE public."llm-convo-monitor" TO authenticated;
GRANT ALL ON TABLE public."llm-convo-monitor" TO service_role;


--
-- Name: SEQUENCE "llm-convo-monitor_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."llm-convo-monitor_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."llm-convo-monitor_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."llm-convo-monitor_id_seq" TO service_role;


--
-- Name: TABLE "llm-guided-contexts"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."llm-guided-contexts" TO anon;
GRANT ALL ON TABLE public."llm-guided-contexts" TO authenticated;
GRANT ALL ON TABLE public."llm-guided-contexts" TO service_role;


--
-- Name: TABLE "llm-guided-docs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."llm-guided-docs" TO anon;
GRANT ALL ON TABLE public."llm-guided-docs" TO authenticated;
GRANT ALL ON TABLE public."llm-guided-docs" TO service_role;


--
-- Name: TABLE "llm-guided-sections"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."llm-guided-sections" TO anon;
GRANT ALL ON TABLE public."llm-guided-sections" TO authenticated;
GRANT ALL ON TABLE public."llm-guided-sections" TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.messages TO anon;
GRANT ALL ON TABLE public.messages TO authenticated;
GRANT ALL ON TABLE public.messages TO service_role;


--
-- Name: TABLE n8n_workflows; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.n8n_workflows TO anon;
GRANT ALL ON TABLE public.n8n_workflows TO authenticated;
GRANT ALL ON TABLE public.n8n_workflows TO service_role;


--
-- Name: SEQUENCE n8n_api_keys_in_progress_workflow_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.n8n_api_keys_in_progress_workflow_id_seq TO anon;
GRANT ALL ON SEQUENCE public.n8n_api_keys_in_progress_workflow_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.n8n_api_keys_in_progress_workflow_id_seq TO service_role;


--
-- Name: TABLE nal_publications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.nal_publications TO anon;
GRANT ALL ON TABLE public.nal_publications TO authenticated;
GRANT ALL ON TABLE public.nal_publications TO service_role;


--
-- Name: SEQUENCE nal_publications_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.nal_publications_id_seq TO anon;
GRANT ALL ON SEQUENCE public.nal_publications_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.nal_publications_id_seq TO service_role;


--
-- Name: TABLE pre_authorized_api_keys; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pre_authorized_api_keys TO anon;
GRANT ALL ON TABLE public.pre_authorized_api_keys TO authenticated;
GRANT ALL ON TABLE public.pre_authorized_api_keys TO service_role;


--
-- Name: SEQUENCE "pre-authorized-api-keys_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."pre-authorized-api-keys_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."pre-authorized-api-keys_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."pre-authorized-api-keys_id_seq" TO service_role;


--
-- Name: TABLE project_stats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.project_stats TO anon;
GRANT ALL ON TABLE public.project_stats TO authenticated;
GRANT ALL ON TABLE public.project_stats TO service_role;


--
-- Name: SEQUENCE project_stats_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.project_stats_id_seq TO anon;
GRANT ALL ON SEQUENCE public.project_stats_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.project_stats_id_seq TO service_role;


--
-- Name: TABLE projects; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.projects TO anon;
GRANT ALL ON TABLE public.projects TO authenticated;
GRANT ALL ON TABLE public.projects TO service_role;


--
-- Name: SEQUENCE projects_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.projects_id_seq TO anon;
GRANT ALL ON SEQUENCE public.projects_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.projects_id_seq TO service_role;


--
-- Name: TABLE publications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.publications TO anon;
GRANT ALL ON TABLE public.publications TO authenticated;
GRANT ALL ON TABLE public.publications TO service_role;


--
-- Name: SEQUENCE publications_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.publications_id_seq TO anon;
GRANT ALL ON SEQUENCE public.publications_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.publications_id_seq TO service_role;


--
-- Name: TABLE pubmed_daily_update; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pubmed_daily_update TO anon;
GRANT ALL ON TABLE public.pubmed_daily_update TO authenticated;
GRANT ALL ON TABLE public.pubmed_daily_update TO service_role;


--
-- Name: SEQUENCE pubmed_daily_update_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.pubmed_daily_update_id_seq TO anon;
GRANT ALL ON SEQUENCE public.pubmed_daily_update_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.pubmed_daily_update_id_seq TO service_role;


--
-- Name: SEQUENCE "uiuc-chatbot_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."uiuc-chatbot_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."uiuc-chatbot_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."uiuc-chatbot_id_seq" TO service_role;


--
-- Name: TABLE "uiuc-course-table"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."uiuc-course-table" TO anon;
GRANT ALL ON TABLE public."uiuc-course-table" TO authenticated;
GRANT ALL ON TABLE public."uiuc-course-table" TO service_role;


--
-- Name: SEQUENCE "uiuc-course-table_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public."uiuc-course-table_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."uiuc-course-table_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."uiuc-course-table_id_seq" TO service_role;


--
-- Name: TABLE usage_metrics; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.usage_metrics TO anon;
GRANT ALL ON TABLE public.usage_metrics TO authenticated;
GRANT ALL ON TABLE public.usage_metrics TO service_role;


--
-- Name: SEQUENCE usage_metrics_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.usage_metrics_id_seq TO anon;
GRANT ALL ON SEQUENCE public.usage_metrics_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.usage_metrics_id_seq TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;
GRANT ALL ON TABLE realtime.messages TO postgres;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;
GRANT ALL ON TABLE realtime.schema_migrations TO postgres;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;
GRANT ALL ON TABLE realtime.subscription TO postgres;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO postgres;


--
-- Name: TABLE migrations; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.migrations TO anon;
GRANT ALL ON TABLE storage.migrations TO authenticated;
GRANT ALL ON TABLE storage.migrations TO service_role;
GRANT ALL ON TABLE storage.migrations TO postgres;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO postgres;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON TABLE vault.decrypted_secrets TO pgsodium_keyiduser;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES  TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS  TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES  TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: keycloak; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA keycloak GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA keycloak GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA keycloak GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: keycloak; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA keycloak GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA keycloak GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA keycloak GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: keycloak; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA keycloak GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA keycloak GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA keycloak GRANT ALL ON TABLES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: pgsodium; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA pgsodium GRANT ALL ON SEQUENCES  TO pgsodium_keyholder;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: pgsodium; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA pgsodium GRANT ALL ON TABLES  TO pgsodium_keyholder;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: pgsodium_masks; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA pgsodium_masks GRANT ALL ON SEQUENCES  TO pgsodium_keyiduser;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: pgsodium_masks; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA pgsodium_masks GRANT ALL ON FUNCTIONS  TO pgsodium_keyiduser;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: pgsodium_masks; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA pgsodium_masks GRANT ALL ON TABLES  TO pgsodium_keyiduser;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO service_role;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--


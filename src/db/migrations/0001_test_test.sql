---
--- Postgres functions : these functions are copy-pasted from the pg_dump of the production database
--- This cannot be migrated to postgres db using drizzle-orm, so we need to manually migrate them.
---

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

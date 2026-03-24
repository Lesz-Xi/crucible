-- Token-based anonymous session adoption without service-role API key
-- Allows authenticated users to adopt only their own browser-linked legacy sessions.

CREATE OR REPLACE FUNCTION public.adopt_legacy_chat_sessions(p_legacy_client_token TEXT)
RETURNS TABLE(adopted_sessions INT, adopted_messages INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_session_ids UUID[];
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_legacy_client_token IS NULL OR btrim(p_legacy_client_token) = '' THEN
    RETURN QUERY SELECT 0::INT, 0::INT;
    RETURN;
  END IF;

  SELECT COALESCE(array_agg(id), ARRAY[]::UUID[])
  INTO v_session_ids
  FROM causal_chat_sessions
  WHERE user_id IS NULL
    AND legacy_client_token = p_legacy_client_token;

  IF COALESCE(array_length(v_session_ids, 1), 0) = 0 THEN
    RETURN QUERY SELECT 0::INT, 0::INT;
    RETURN;
  END IF;

  UPDATE causal_chat_sessions
  SET user_id = v_user_id,
      updated_at = NOW()
  WHERE id = ANY(v_session_ids)
    AND user_id IS NULL
    AND legacy_client_token = p_legacy_client_token;

  RETURN QUERY
  SELECT
    COALESCE(array_length(v_session_ids, 1), 0)::INT,
    (
      SELECT COUNT(*)::INT
      FROM causal_chat_messages
      WHERE session_id = ANY(v_session_ids)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.adopt_legacy_chat_sessions(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adopt_legacy_chat_sessions(TEXT) TO authenticated;

-- Sentinel Audit Log
-- Stores every InferenceSentinel decision (input + output inspections) with full provenance.
-- Designed for M6.2 compliance: immutable audit trail, RLS-protected, indexed for forensics.

CREATE TABLE IF NOT EXISTS sentinel_audit_log (
    id                UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trace_id          TEXT         NOT NULL,
    inspection_type   TEXT         NOT NULL CHECK (inspection_type IN ('input', 'output')),
    verdict           TEXT         NOT NULL CHECK (verdict IN ('pass', 'warn', 'block', 'degraded')),
    risk_score        DECIMAL(5,4) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 1),
    checks            JSONB        NOT NULL DEFAULT '[]',
    blocked_reason    TEXT,
    warnings          TEXT[]       NOT NULL DEFAULT '{}',
    latency_ms        INTEGER,
    method_version    TEXT         NOT NULL,
    -- Request context
    session_id        TEXT,
    user_id           UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
    source            TEXT,        -- 'openclaw' | 'bridge' | 'epistemic' | 'lab'
    -- Provenance (M6.2)
    input_hash        TEXT,        -- SHA-256 of inspected content (raw content never stored)
    compute_run_id    UUID,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT sentinel_audit_log_trace_id_key UNIQUE (trace_id)
);

-- RLS: service_role writes, authenticated users can read their own rows
ALTER TABLE sentinel_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sentinel_audit_log_select"
    ON sentinel_audit_log FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "sentinel_audit_log_service_insert"
    ON sentinel_audit_log FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Forensics indexes
CREATE INDEX IF NOT EXISTS sentinel_audit_log_verdict_idx    ON sentinel_audit_log (verdict);
CREATE INDEX IF NOT EXISTS sentinel_audit_log_source_idx     ON sentinel_audit_log (source);
CREATE INDEX IF NOT EXISTS sentinel_audit_log_created_at_idx ON sentinel_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS sentinel_audit_log_user_id_idx    ON sentinel_audit_log (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS sentinel_audit_log_session_id_idx ON sentinel_audit_log (session_id) WHERE session_id IS NOT NULL;

/**
 * InferenceSentinelService
 *
 * Bidirectional trust boundary for all inference traffic.
 * Synthesizes AISLE-pattern security into the Synthesis Engine by composing
 * existing causal reasoning primitives with injection, PII, and leakage detection.
 *
 * Architecture contracts (Demis Workflow):
 *   - Service Boundary:   pure service, no route logic
 *   - Deterministic:      regex/heuristic checks only in critical path — no LLM calls
 *   - Graceful Degradation: internal errors yield 'degraded' verdict, never block inference
 *   - Provenance:         every decision audited with trace_id, input_hash, method_version
 */

import { v7 as uuidv7 } from 'uuid';
import { CausalIntegrityService } from '@/lib/ai/causal-integrity-service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SentinelCheckType =
    // Input gate
    | 'injection_scan'
    | 'pii_scan'
    | 'causal_density'
    // Output gate
    | 'oracle_risk'
    | 'causal_grounding'
    | 'data_leakage';

export type SentinelVerdict = 'pass' | 'warn' | 'block' | 'degraded';

export interface CheckResult {
    check: SentinelCheckType;
    verdict: 'pass' | 'warn' | 'block';
    risk_score: number;        // 0–1
    reason?: string;
    metadata?: Record<string, unknown>;
}

export interface SentinelDecision {
    verdict: SentinelVerdict;
    trace_id: string;
    checks: CheckResult[];
    risk_score: number;        // composite 0–1: max of all check scores
    blocked_reason?: string;
    warnings: string[];
    latency_ms: number;
    method_version: string;
}

/**
 * Caller-provided context. Injected from the route layer so the service
 * stays free of HTTP/session concerns.
 */
export interface SentinelContext {
    session_id?: string;
    user_id?: string;
    source: 'openclaw' | 'bridge' | 'epistemic' | 'lab';
    compute_run_id?: string;
    /**
     * Current P(Oracle) from OracleModeService.getState().probability.
     * Pass this in from the calling route if a session context is available.
     * Omit for routes that don't maintain oracle state.
     */
    oracle_probability?: number;
}

export interface SentinelPolicy {
    input: {
        injection: {
            enabled: boolean;
            /**
             * 'permissive' — only high-severity patterns trigger block
             * 'moderate'   — high + medium patterns trigger block
             * 'strict'     — all patterns trigger block
             */
            blockThreshold: 'strict' | 'moderate' | 'permissive';
        };
        pii: {
            enabled: boolean;
            action: 'block' | 'warn';
        };
        causalDensity: {
            enabled: boolean;
            minLevel: 1 | 2 | 3;
        };
    };
    output: {
        oracleRisk: {
            enabled: boolean;
            warnThreshold: number;   // P(Oracle) ≥ this → 'warn'
            blockThreshold: number;  // P(Oracle) ≥ this → 'block'
        };
        causalGrounding: {
            enabled: boolean;
            /**
             * How many causal levels above the input evidence the output
             * is allowed to claim before triggering a warning.
             * Default 1: output may claim L2 when input is L1, but not L3.
             */
            maxLevelEscalation: number;
        };
        dataLeakage: {
            enabled: boolean;
            action: 'block' | 'warn';
        };
    };
    audit: { enabled: boolean };
}

export const DEFAULT_POLICY: SentinelPolicy = {
    input: {
        injection:     { enabled: true,  blockThreshold: 'moderate' },
        pii:           { enabled: true,  action: 'warn' },
        causalDensity: { enabled: false, minLevel: 1 },
    },
    output: {
        oracleRisk:      { enabled: true, warnThreshold: 0.80, blockThreshold: 0.97 },
        causalGrounding: { enabled: true, maxLevelEscalation: 1 },
        dataLeakage:     { enabled: true, action: 'block' },
    },
    audit: { enabled: true },
};

// ─── Detection Patterns ───────────────────────────────────────────────────────

const THRESHOLD_ORDER = { permissive: 0, moderate: 1, strict: 2 } as const;

/**
 * Prompt injection signatures.
 * Each entry declares the minimum blockThreshold level at which it fires.
 * 'permissive' = fires at all threshold levels (always active).
 */
const INJECTION_PATTERNS: Array<{
    pattern: RegExp;
    severity: 'high' | 'medium';
    threshold: 'strict' | 'moderate' | 'permissive';
}> = [
    // Direct override
    { pattern: /ignore\s+(all\s+)?previous\s+instructions?/i,                              severity: 'high',   threshold: 'permissive' },
    { pattern: /disregard\s+(your\s+)?(system\s+|previous\s+)?instructions?/i,             severity: 'high',   threshold: 'permissive' },
    { pattern: /forget\s+(everything|all|your\s+instructions?)/i,                          severity: 'high',   threshold: 'permissive' },
    { pattern: /you\s+are\s+now\s+[a-z]/i,                                                  severity: 'high',   threshold: 'permissive' },
    { pattern: /pretend\s+(you\s+(are|have)|there\s+are)\s+no\s+(guidelines|restrictions|rules)/i, severity: 'high', threshold: 'permissive' },
    { pattern: /\bdan\s+mode\b/i,                                                            severity: 'high',   threshold: 'permissive' },
    { pattern: /\bsystem\s+prompt\b.{0,50}\bignore\b/i,                                    severity: 'high',   threshold: 'permissive' },
    // Role escalation
    { pattern: /act\s+as\s+(an?\s+)?(admin|root|superuser|developer|anthropic)/i,          severity: 'high',   threshold: 'moderate'   },
    // Medium-severity signals
    { pattern: /jailbreak/i,                                                                 severity: 'medium', threshold: 'moderate'   },
    { pattern: /\[system\]/i,                                                                severity: 'medium', threshold: 'strict'     },
    { pattern: /base64[_\s]*decode/i,                                                        severity: 'medium', threshold: 'strict'     },
    // Unicode direction-override characters (invisible injection)
    { pattern: /[\u202A-\u202E\u2066-\u2069]/,                                              severity: 'medium', threshold: 'moderate'   },
];

const PII_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
    { name: 'ssn',         pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/                    },
    { name: 'credit_card', pattern: /\b(?:\d{4}[\s\-]?){3}\d{4}\b/                        },
    { name: 'api_key',     pattern: /\b(sk-[a-zA-Z0-9]{32,}|api[_\-]?key[_\-]?[:=\s]+[a-zA-Z0-9]{16,})\b/i },
];

const LEAKAGE_PATTERNS: Array<{ name: string; pattern: RegExp; severity: 'high' | 'medium' }> = [
    { name: 'api_key_output',  pattern: /\b(sk-[a-zA-Z0-9]{32,}|bearer\s+[a-zA-Z0-9\-_.]{20,})\b/i, severity: 'high'   },
    { name: 'private_path',    pattern: /\/Users\/[a-zA-Z0-9_\-]+\/.{5,}/i,                          severity: 'medium' },
    { name: 'system_prompt_echo', pattern: /my\s+(instructions?|system\s+prompt|guidelines)\s+(are|say|state)/i, severity: 'medium' },
];

// ─── Service ──────────────────────────────────────────────────────────────────

const METHOD_VERSION = '1.0.0';

export class InferenceSentinelService {
    private causal: CausalIntegrityService;

    constructor() {
        this.causal = new CausalIntegrityService();
    }

    /**
     * Inspect content before it reaches the inference layer (input gate).
     * Runs: injection_scan, pii_scan, causal_density (if enabled).
     *
     * Never throws — returns 'degraded' verdict on internal failure.
     */
    async inspectInput(
        content: string,
        context: SentinelContext,
        policy: SentinelPolicy = DEFAULT_POLICY
    ): Promise<SentinelDecision> {
        return this.withDegradation(async () => {
            const start = Date.now();
            const trace_id = uuidv7();

            const results = await Promise.allSettled([
                policy.input.injection.enabled
                    ? this.checkInjection(content, policy.input.injection.blockThreshold)
                    : null,
                policy.input.pii.enabled
                    ? this.checkPII(content, policy.input.pii.action)
                    : null,
                policy.input.causalDensity.enabled
                    ? this.checkCausalDensity(content, policy.input.causalDensity.minLevel)
                    : null,
            ]);

            const checks = this.collectChecks(results);
            const decision = this.buildDecision(trace_id, checks, Date.now() - start);

            if (policy.audit.enabled) {
                void this.audit(decision, 'input', context, content);
            }

            return decision;
        });
    }

    /**
     * Inspect content after inference, before returning to the caller (output gate).
     * Runs: oracle_risk, causal_grounding, data_leakage.
     *
     * @param inputDecision — the SentinelDecision from inspectInput for the same request,
     *                        used to detect causal level escalation in the output.
     *                        Pass null if no input inspection was performed.
     */
    async inspectOutput(
        content: string,
        inputDecision: SentinelDecision | null,
        context: SentinelContext,
        policy: SentinelPolicy = DEFAULT_POLICY
    ): Promise<SentinelDecision> {
        return this.withDegradation(async () => {
            const start = Date.now();
            const trace_id = uuidv7();

            const results = await Promise.allSettled([
                policy.output.dataLeakage.enabled
                    ? this.checkDataLeakage(content, policy.output.dataLeakage.action)
                    : null,
                policy.output.causalGrounding.enabled
                    ? this.checkCausalGrounding(content, inputDecision, policy.output.causalGrounding.maxLevelEscalation)
                    : null,
                policy.output.oracleRisk.enabled
                    ? this.checkOracleRisk(
                          context.oracle_probability,
                          policy.output.oracleRisk.warnThreshold,
                          policy.output.oracleRisk.blockThreshold
                      )
                    : null,
            ]);

            const checks = this.collectChecks(results);
            const decision = this.buildDecision(trace_id, checks, Date.now() - start);

            if (policy.audit.enabled) {
                void this.audit(decision, 'output', context, content);
            }

            return decision;
        });
    }

    // ─── Input Checks ─────────────────────────────────────────────────────────

    private checkInjection(
        content: string,
        blockThreshold: 'strict' | 'moderate' | 'permissive'
    ): CheckResult {
        const configuredLevel = THRESHOLD_ORDER[blockThreshold];
        const matched: string[] = [];
        let maxSeverity: 'high' | 'medium' | null = null;

        for (const { pattern, severity, threshold } of INJECTION_PATTERNS) {
            if (THRESHOLD_ORDER[threshold] >= configuredLevel && pattern.test(content)) {
                matched.push(pattern.source.substring(0, 50));
                if (severity === 'high') maxSeverity = 'high';
                else if (maxSeverity !== 'high') maxSeverity = 'medium';
            }
        }

        if (!maxSeverity) {
            return { check: 'injection_scan', verdict: 'pass', risk_score: 0 };
        }

        return {
            check: 'injection_scan',
            verdict:    maxSeverity === 'high' ? 'block' : 'warn',
            risk_score: maxSeverity === 'high' ? 0.95 : 0.60,
            reason:     `${matched.length} injection pattern(s) detected (max severity: ${maxSeverity})`,
            metadata:   { matched_count: matched.length, max_severity: maxSeverity },
        };
    }

    private checkPII(content: string, action: 'block' | 'warn'): CheckResult {
        const found = PII_PATTERNS
            .filter(({ pattern }) => pattern.test(content))
            .map(({ name }) => name);

        if (found.length === 0) {
            return { check: 'pii_scan', verdict: 'pass', risk_score: 0 };
        }

        return {
            check:      'pii_scan',
            verdict:    action,
            risk_score: action === 'block' ? 0.90 : 0.50,
            reason:     `PII type(s) detected: ${found.join(', ')}`,
            metadata:   { detected_types: found },
        };
    }

    private checkCausalDensity(content: string, minLevel: 1 | 2 | 3): CheckResult {
        const result = this.causal.evaluate(content);
        if (result.score >= minLevel) {
            return { check: 'causal_density', verdict: 'pass', risk_score: 0 };
        }
        return {
            check:      'causal_density',
            verdict:    'warn',
            risk_score: 0.30,
            reason:     `Causal density L${result.score} (${result.label}) below minimum L${minLevel}`,
            metadata:   { actual_level: result.score, required_level: minLevel, label: result.label },
        };
    }

    // ─── Output Checks ────────────────────────────────────────────────────────

    private checkDataLeakage(content: string, action: 'block' | 'warn'): CheckResult {
        const found = LEAKAGE_PATTERNS
            .filter(({ pattern }) => pattern.test(content))
            .map(({ name, severity }) => ({ name, severity }));

        if (found.length === 0) {
            return { check: 'data_leakage', verdict: 'pass', risk_score: 0 };
        }

        const hasHigh = found.some(f => f.severity === 'high');
        const verdict = hasHigh ? 'block' : action;

        return {
            check:      'data_leakage',
            verdict,
            risk_score: hasHigh ? 0.95 : 0.55,
            reason:     `Leakage pattern(s): ${found.map(f => f.name).join(', ')}`,
            metadata:   { detected: found.map(f => f.name) },
        };
    }

    private checkCausalGrounding(
        outputContent: string,
        inputDecision: SentinelDecision | null,
        maxLevelEscalation: number
    ): CheckResult {
        const outputDensity = this.causal.evaluate(outputContent);

        // Without an input decision we can't measure escalation — pass
        if (!inputDecision) {
            return { check: 'causal_grounding', verdict: 'pass', risk_score: 0 };
        }

        const inputDensityCheck = inputDecision.checks.find(c => c.check === 'causal_density');
        const inputLevel = (inputDensityCheck?.metadata?.actual_level as number) ?? 1;
        const escalation = outputDensity.score - inputLevel;

        if (escalation <= maxLevelEscalation) {
            return { check: 'causal_grounding', verdict: 'pass', risk_score: 0 };
        }

        return {
            check:      'causal_grounding',
            verdict:    'warn',
            risk_score: Math.min(0.50 + escalation * 0.15, 0.90),
            reason:     `Output claims L${outputDensity.score} causal strength; input evidence supports only L${inputLevel}`,
            metadata:   { input_level: inputLevel, output_level: outputDensity.score, escalation },
        };
    }

    /**
     * Oracle risk uses P(Oracle) from OracleModeService, injected via context.
     * When oracle_probability is absent (no session state), the check passes.
     */
    private checkOracleRisk(
        oracleProbability: number | undefined,
        warnThreshold: number,
        blockThreshold: number
    ): CheckResult {
        if (oracleProbability === undefined) {
            return { check: 'oracle_risk', verdict: 'pass', risk_score: 0 };
        }

        const p = oracleProbability;

        if (p < warnThreshold) {
            return { check: 'oracle_risk', verdict: 'pass', risk_score: p * 0.30 };
        }

        const verdict = p >= blockThreshold ? 'block' : 'warn';
        return {
            check:      'oracle_risk',
            verdict,
            risk_score: p,
            reason:     `Oracle P=${p.toFixed(3)} exceeds ${verdict} threshold (warn=${warnThreshold}, block=${blockThreshold})`,
            metadata:   { p_oracle: p, warn_threshold: warnThreshold, block_threshold: blockThreshold },
        };
    }

    // ─── Decision Assembly ────────────────────────────────────────────────────

    private buildDecision(
        trace_id: string,
        checks: CheckResult[],
        latency_ms: number
    ): SentinelDecision {
        const risk_score = checks.length > 0
            ? Math.max(...checks.map(c => c.risk_score))
            : 0;

        const blocked  = checks.find(c => c.verdict === 'block');
        const warnings = checks
            .filter(c => c.verdict === 'warn')
            .map(c => c.reason ?? c.check);

        const verdict: SentinelVerdict = blocked
            ? 'block'
            : warnings.length > 0 ? 'warn' : 'pass';

        return {
            verdict,
            trace_id,
            checks,
            risk_score,
            blocked_reason: blocked?.reason,
            warnings,
            latency_ms,
            method_version: METHOD_VERSION,
        };
    }

    /** Flatten allSettled results, skipping nulls and rejected checks. */
    private collectChecks(
        results: PromiseSettledResult<CheckResult | null>[]
    ): CheckResult[] {
        return results.flatMap(r => {
            if (r.status === 'fulfilled' && r.value !== null) return [r.value];
            if (r.status === 'rejected') {
                console.warn('[InferenceSentinel] Check failed (non-fatal):', r.reason);
            }
            return [];
        });
    }

    // ─── Audit ────────────────────────────────────────────────────────────────

    /**
     * Fire-and-forget audit write. Never throws — audit failure is non-fatal
     * per Demis Workflow Contract 4 (graceful degradation).
     */
    private async audit(
        decision: SentinelDecision,
        inspection_type: 'input' | 'output',
        context: SentinelContext,
        content: string
    ): Promise<void> {
        try {
            const { createServerSupabaseAdminClient } = await import('@/lib/supabase/server-admin');
            const supabase = createServerSupabaseAdminClient();
            const input_hash = await this.sha256(content);

            await supabase.from('sentinel_audit_log').insert({
                trace_id:        decision.trace_id,
                inspection_type,
                verdict:         decision.verdict,
                risk_score:      decision.risk_score,
                checks:          decision.checks,
                blocked_reason:  decision.blocked_reason ?? null,
                warnings:        decision.warnings,
                latency_ms:      decision.latency_ms,
                method_version:  decision.method_version,
                session_id:      context.session_id ?? null,
                user_id:         context.user_id ?? null,
                source:          context.source,
                input_hash,
                compute_run_id:  context.compute_run_id ?? null,
            });
        } catch {
            console.warn('[InferenceSentinel] Audit write failed (non-fatal)');
        }
    }

    private async sha256(content: string): Promise<string> {
        const data = new TextEncoder().encode(content);
        const buf  = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(buf))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // ─── Graceful Degradation Wrapper ─────────────────────────────────────────

    private async withDegradation(
        fn: () => Promise<SentinelDecision>
    ): Promise<SentinelDecision> {
        try {
            return await fn();
        } catch (err) {
            console.error('[InferenceSentinel] Internal error — returning degraded verdict:', err);
            return {
                verdict:        'degraded',
                trace_id:       uuidv7(),
                checks:         [],
                risk_score:     0,
                warnings:       ['sentinel_internal_error'],
                latency_ms:     0,
                method_version: METHOD_VERSION,
            };
        }
    }
}

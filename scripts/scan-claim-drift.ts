import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const EXIT_OK = 0;
const EXIT_BLOCKING = 2;
const EXIT_SCHEMA = 3;
const EXIT_RUNTIME = 4;

type Severity = "critical" | "high" | "medium" | "low";
type DeclaredStatus = "implemented" | "partial" | "planned" | "deprecated";
type DriftState = "ok" | "partial" | "missing" | "contradicted";
type MatcherType =
  | "ast_export"
  | "ast_function_call"
  | "ast_route_handler"
  | "ast_workflow_step"
  | "regex"
  | "marker_tag";

type Mode = "report" | "enforce";

interface ContradictionSpec {
  matcher_type: MatcherType;
  matcher: string;
  reason: string;
}

interface EvidenceSpec {
  path: string;
  matcher_type: MatcherType;
  matcher: string;
  required: boolean;
  contradiction?: ContradictionSpec[];
}

interface ClaimRecord {
  claim_id: string;
  source_doc: string;
  claim_text: string;
  declared_status: DeclaredStatus;
  severity: Severity;
  owner?: string;
  evidence: EvidenceSpec[];
  tags?: string[];
}

interface ClaimLedger {
  schema_version: string;
  generated_at: string;
  claims: ClaimRecord[];
}

interface OverrideRecord {
  claim_id: string;
  ticket: string;
  reason: string;
  approved_by: string;
  expires_at: string;
}

interface OverrideFile {
  schema_version: string;
  overrides: OverrideRecord[];
}

interface MatcherResult {
  matched: boolean;
  details: string;
}

interface EvidenceResult {
  path: string;
  matcher_type: MatcherType;
  matcher: string;
  required: boolean;
  matched: boolean;
  contradictionMatched: boolean;
  contradictionReasons: string[];
  details: string;
}

interface ClaimResult {
  claim_id: string;
  severity: Severity;
  owner: string;
  state: DriftState;
  declared_status: DeclaredStatus;
  blocking: boolean;
  override_applied: boolean;
  override_reason?: string;
  evidence: EvidenceResult[];
}

interface DriftReport {
  generated_at: string;
  mode: Mode;
  strict: Severity;
  ledger_path: string;
  duration_ms: number;
  performance_budget_ms: number;
  performance_within_budget: boolean;
  summary: {
    total_claims: number;
    by_state: Record<DriftState, number>;
    blocking_claims: number;
    overrides_applied: number;
  };
  results: ClaimResult[];
}

interface CliArgs {
  ledgerPath: string;
  outputDir: string;
  mode: Mode;
  strict: Severity;
  formats: Set<"json" | "md">;
  overridesPath: string;
  rootPath: string;
}

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const DEFAULT_LEDGER = "docs/governance/claim-ledger.json";
const DEFAULT_OVERRIDES = "docs/governance/claim-overrides.json";
const DEFAULT_OUTPUT_DIR = "artifacts";
const PERFORMANCE_BUDGET_MS = 30_000;

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    ledgerPath: DEFAULT_LEDGER,
    outputDir: DEFAULT_OUTPUT_DIR,
    mode: "report",
    strict: "critical",
    formats: new Set(["json", "md"]),
    overridesPath: DEFAULT_OVERRIDES,
    rootPath: process.cwd(),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--ledger") args.ledgerPath = argv[++i];
    else if (token === "--output-dir") args.outputDir = argv[++i];
    else if (token === "--mode") args.mode = (argv[++i] as Mode) ?? "report";
    else if (token === "--strict") args.strict = (argv[++i] as Severity) ?? "critical";
    else if (token === "--format") {
      const values = (argv[++i] ?? "json,md").split(",").map((v) => v.trim()).filter(Boolean);
      args.formats = new Set(values as Array<"json" | "md">);
    } else if (token === "--overrides") args.overridesPath = argv[++i];
    else if (token === "--root") args.rootPath = argv[++i];
  }

  return args;
}

function isValidSeverity(input: string): input is Severity {
  return ["critical", "high", "medium", "low"].includes(input);
}

function isValidMode(input: string): input is Mode {
  return ["report", "enforce"].includes(input);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function resolvePath(rawPath: string, repoRoot: string): string {
  if (!rawPath) return rawPath;
  if (path.isAbsolute(rawPath) && fs.existsSync(rawPath)) return rawPath;

  const normalized = rawPath.replace(/\\/g, "/");
  const marker = "/synthesis-engine/";
  const markerIdx = normalized.lastIndexOf(marker);
  if (markerIdx >= 0) {
    const suffix = normalized.slice(markerIdx + marker.length);
    const candidate = path.join(repoRoot, suffix);
    if (fs.existsSync(candidate)) return candidate;
  }

  const relativeCandidate = path.resolve(repoRoot, rawPath);
  if (fs.existsSync(relativeCandidate)) return relativeCandidate;

  return relativeCandidate;
}

function parseRegex(input: string): RegExp {
  if (input.startsWith("/") && input.lastIndexOf("/") > 0) {
    const lastSlash = input.lastIndexOf("/");
    const body = input.slice(1, lastSlash);
    const flags = input.slice(lastSlash + 1);
    return new RegExp(body, flags || "m");
  }
  return new RegExp(input, "m");
}

function normalizeOverrideDate(input: string): number {
  const ts = Date.parse(input);
  return Number.isFinite(ts) ? ts : Number.NaN;
}

function loadJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function validateLedger(ledger: ClaimLedger): void {
  assert(typeof ledger.schema_version === "string", "ledger.schema_version must be a string");
  assert(typeof ledger.generated_at === "string", "ledger.generated_at must be a string");
  assert(Array.isArray(ledger.claims), "ledger.claims must be an array");

  const ids = new Set<string>();
  for (const claim of ledger.claims) {
    assert(typeof claim.claim_id === "string" && claim.claim_id.length > 0, "claim_id is required");
    assert(!ids.has(claim.claim_id), `duplicate claim_id: ${claim.claim_id}`);
    ids.add(claim.claim_id);
    assert(isValidSeverity(claim.severity), `invalid severity on ${claim.claim_id}`);
    assert(Array.isArray(claim.evidence) && claim.evidence.length > 0, `claim ${claim.claim_id} must have evidence`);
    if (claim.severity === "critical") {
      assert(typeof claim.owner === "string" && claim.owner.trim().length > 0, `critical claim ${claim.claim_id} must have owner`);
      const hasAstRequired = claim.evidence.some(
        (e) => e.required && e.matcher_type.startsWith("ast_")
      );
      assert(hasAstRequired, `critical claim ${claim.claim_id} must have at least one required ast_* evidence matcher`);
    }
  }
}

function sourceFileFor(filePath: string, sourceCache: Map<string, ts.SourceFile>): ts.SourceFile {
  const cached = sourceCache.get(filePath);
  if (cached) return cached;
  const content = fs.readFileSync(filePath, "utf8");
  const sf = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  sourceCache.set(filePath, sf);
  return sf;
}

function fileContentFor(filePath: string, contentCache: Map<string, string>): string {
  const cached = contentCache.get(filePath);
  if (cached !== undefined) return cached;
  const content = fs.readFileSync(filePath, "utf8");
  contentCache.set(filePath, content);
  return content;
}

function hasExportedIdentifier(sf: ts.SourceFile, identifier: string): boolean {
  let found = false;

  const visit = (node: ts.Node): void => {
    if (found) return;

    if (
      (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node)) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
      node.name?.getText(sf) === identifier
    ) {
      found = true;
      return;
    }

    if (ts.isVariableStatement(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === identifier) {
          found = true;
          return;
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sf);
  return found;
}

function hasFunctionCall(sf: ts.SourceFile, matcher: string): boolean {
  const target = matcher.trim();
  let found = false;

  const visit = (node: ts.Node): void => {
    if (found) return;
    if (ts.isCallExpression(node)) {
      const text = node.expression.getText(sf);
      if (text === target || text.endsWith(`.${target}`)) {
        found = true;
        return;
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sf);
  return found;
}

function hasRouteHandlerExport(sf: ts.SourceFile, method: string): boolean {
  const expected = method.toUpperCase().trim();
  if (!expected) return false;
  return hasExportedIdentifier(sf, expected);
}

function evaluateMatcher(
  claimId: string,
  filePath: string,
  matcherType: MatcherType,
  matcher: string,
  sourceCache: Map<string, ts.SourceFile>,
  contentCache: Map<string, string>
): MatcherResult {
  if (!fs.existsSync(filePath)) {
    return { matched: false, details: "file_not_found" };
  }

  const text = fileContentFor(filePath, contentCache);

  if (matcherType === "regex") {
    const re = parseRegex(matcher);
    return { matched: re.test(text), details: `regex:${re}` };
  }

  if (matcherType === "marker_tag") {
    const tag = matcher?.trim() || `@claim-evidence:${claimId}`;
    return { matched: text.includes(tag), details: `marker:${tag}` };
  }

  if (matcherType === "ast_workflow_step") {
    const stepPattern = new RegExp(`^\\s*-\\s*name:\\s*${matcher.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\s*$`, "m");
    return { matched: stepPattern.test(text), details: `workflow_step:${matcher}` };
  }

  const sf = sourceFileFor(filePath, sourceCache);

  if (matcherType === "ast_export") {
    return { matched: hasExportedIdentifier(sf, matcher), details: `ast_export:${matcher}` };
  }

  if (matcherType === "ast_function_call") {
    return { matched: hasFunctionCall(sf, matcher), details: `ast_function_call:${matcher}` };
  }

  if (matcherType === "ast_route_handler") {
    return { matched: hasRouteHandlerExport(sf, matcher), details: `ast_route_handler:${matcher}` };
  }

  return { matched: false, details: `unsupported_matcher:${matcherType}` };
}

function severityAtOrAbove(claimSeverity: Severity, strict: Severity): boolean {
  return SEVERITY_RANK[claimSeverity] >= SEVERITY_RANK[strict];
}

function readOverrides(filePath: string): OverrideFile {
  if (!fs.existsSync(filePath)) {
    return { schema_version: "1.0.0", overrides: [] };
  }

  const payload = loadJson<OverrideFile>(filePath);
  if (!Array.isArray(payload.overrides)) {
    return { schema_version: payload.schema_version ?? "1.0.0", overrides: [] };
  }
  return payload;
}

function findValidOverride(claimId: string, overrides: OverrideFile): OverrideRecord | null {
  const now = Date.now();
  for (const ov of overrides.overrides) {
    if (ov.claim_id !== claimId) continue;
    if (!ov.ticket || !ov.reason || !ov.approved_by) continue;
    const expiresTs = normalizeOverrideDate(ov.expires_at);
    if (!Number.isFinite(expiresTs)) continue;
    if (expiresTs < now) continue;
    return ov;
  }
  return null;
}

function toMarkdown(report: DriftReport): string {
  const lines: string[] = [];
  lines.push("# Claim Drift Report");
  lines.push("");
  lines.push(`- Generated at: ${report.generated_at}`);
  lines.push(`- Mode: ${report.mode}`);
  lines.push(`- Strict level: ${report.strict}`);
  lines.push(`- Duration (ms): ${report.duration_ms}`);
  lines.push(`- Performance budget (ms): ${report.performance_budget_ms}`);
  lines.push(`- Within performance budget: ${report.performance_within_budget}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total claims: ${report.summary.total_claims}`);
  lines.push(`- Blocking claims: ${report.summary.blocking_claims}`);
  lines.push(`- Overrides applied: ${report.summary.overrides_applied}`);
  lines.push(`- States: ok=${report.summary.by_state.ok}, partial=${report.summary.by_state.partial}, missing=${report.summary.by_state.missing}, contradicted=${report.summary.by_state.contradicted}`);
  lines.push("");
  lines.push("## Claim Results");
  lines.push("");
  lines.push("| Claim | Severity | State | Blocking | Override | Owner |");
  lines.push("|---|---|---|---:|---:|---|");
  for (const row of report.results) {
    lines.push(`| ${row.claim_id} | ${row.severity} | ${row.state} | ${row.blocking} | ${row.override_applied} | ${row.owner} |`);
  }
  lines.push("");
  lines.push("## Evidence Details");
  lines.push("");
  for (const row of report.results) {
    lines.push(`### ${row.claim_id}`);
    lines.push(`- State: ${row.state}`);
    if (row.override_applied) {
      lines.push(`- Override: ${row.override_reason ?? "applied"}`);
    }
    for (const ev of row.evidence) {
      lines.push(`- [${ev.matched ? "x" : " "}] ${ev.required ? "required" : "optional"} ${ev.matcher_type} :: ${ev.matcher} (${ev.path})`);
      if (ev.contradictionMatched) {
        lines.push(`  - contradiction: ${ev.contradictionReasons.join("; ")}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

function main(): number {
  const startedAt = Date.now();
  try {
    const args = parseArgs(process.argv.slice(2));

    if (!isValidMode(args.mode)) throw new Error(`invalid --mode '${args.mode}'`);
    if (!isValidSeverity(args.strict)) throw new Error(`invalid --strict '${args.strict}'`);

    const ledgerPath = resolvePath(args.ledgerPath, args.rootPath);
    const overridesPath = resolvePath(args.overridesPath, args.rootPath);

    if (!fs.existsSync(ledgerPath)) {
      throw new Error(`ledger not found at ${ledgerPath}`);
    }

    const ledger = loadJson<ClaimLedger>(ledgerPath);
    validateLedger(ledger);
    const overrides = readOverrides(overridesPath);

    const sourceCache = new Map<string, ts.SourceFile>();
    const contentCache = new Map<string, string>();

    const results: ClaimResult[] = [];

    for (const claim of ledger.claims) {
      const evidenceResults: EvidenceResult[] = [];
      let requiredTotal = 0;
      let requiredMatched = 0;
      let contradicted = false;
      const contradictionReasons: string[] = [];

      for (const evidence of claim.evidence) {
        if (evidence.required) requiredTotal += 1;

        const resolvedPath = resolvePath(evidence.path, args.rootPath);
        const match = evaluateMatcher(
          claim.claim_id,
          resolvedPath,
          evidence.matcher_type,
          evidence.matcher,
          sourceCache,
          contentCache
        );

        if (evidence.required && match.matched) requiredMatched += 1;

        const contradictionReasonsForEvidence: string[] = [];
        let contradictionMatched = false;

        for (const rule of evidence.contradiction ?? []) {
          const contradictionMatch = evaluateMatcher(
            claim.claim_id,
            resolvedPath,
            rule.matcher_type,
            rule.matcher,
            sourceCache,
            contentCache
          );
          if (contradictionMatch.matched) {
            contradicted = true;
            contradictionMatched = true;
            contradictionReasonsForEvidence.push(rule.reason);
            contradictionReasons.push(rule.reason);
          }
        }

        evidenceResults.push({
          path: resolvedPath,
          matcher_type: evidence.matcher_type,
          matcher: evidence.matcher,
          required: evidence.required,
          matched: match.matched,
          contradictionMatched,
          contradictionReasons: contradictionReasonsForEvidence,
          details: match.details,
        });
      }

      let state: DriftState;
      if (contradicted) state = "contradicted";
      else if (requiredMatched === 0) state = "missing";
      else if (requiredMatched < requiredTotal) state = "partial";
      else state = "ok";

      const override = findValidOverride(claim.claim_id, overrides);
      const blockingCandidate = state === "missing" || state === "contradicted";
      const severityInScope = severityAtOrAbove(claim.severity, args.strict);
      const blocking = args.mode === "enforce" && blockingCandidate && severityInScope && !override;

      results.push({
        claim_id: claim.claim_id,
        severity: claim.severity,
        owner: claim.owner ?? "unassigned",
        state,
        declared_status: claim.declared_status,
        blocking,
        override_applied: Boolean(override),
        override_reason: override
          ? `${override.ticket} by ${override.approved_by} until ${override.expires_at}: ${override.reason}`
          : undefined,
        evidence: evidenceResults,
      });
    }

    const byState: Record<DriftState, number> = {
      ok: 0,
      partial: 0,
      missing: 0,
      contradicted: 0,
    };

    let blockingClaims = 0;
    let overridesApplied = 0;

    for (const row of results) {
      byState[row.state] += 1;
      if (row.blocking) blockingClaims += 1;
      if (row.override_applied) overridesApplied += 1;
    }

    const report: DriftReport = {
      generated_at: new Date().toISOString(),
      mode: args.mode,
      strict: args.strict,
      ledger_path: ledgerPath,
      duration_ms: Date.now() - startedAt,
      performance_budget_ms: PERFORMANCE_BUDGET_MS,
      performance_within_budget: Date.now() - startedAt <= PERFORMANCE_BUDGET_MS,
      summary: {
        total_claims: results.length,
        by_state: byState,
        blocking_claims: blockingClaims,
        overrides_applied: overridesApplied,
      },
      results,
    };

    const outDir = resolvePath(args.outputDir, args.rootPath);
    fs.mkdirSync(outDir, { recursive: true });

    if (args.formats.has("json")) {
      fs.writeFileSync(path.join(outDir, "claim-drift-report.json"), JSON.stringify(report, null, 2), "utf8");
    }

    if (args.formats.has("md")) {
      fs.writeFileSync(path.join(outDir, "claim-drift-report.md"), toMarkdown(report), "utf8");
    }

    console.log(`Claim drift scan complete. claims=${results.length} blocking=${blockingClaims} mode=${args.mode}`);

    if (args.mode === "enforce" && blockingClaims > 0) {
      return EXIT_BLOCKING;
    }

    return EXIT_OK;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const schemaHint =
      msg.includes("schema") ||
      msg.includes("claim_id") ||
      msg.includes("severity") ||
      msg.includes("evidence") ||
      msg.includes("ledger");
    console.error(`[scan-claim-drift] ${msg}`);
    return schemaHint ? EXIT_SCHEMA : EXIT_RUNTIME;
  }
}

process.exit(main());

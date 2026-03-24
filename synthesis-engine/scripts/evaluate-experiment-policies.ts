/**
 * evaluate-experiment-policies.ts — CLI wrapper for the policy evaluation stream.
 *
 * Thin wrapper that:
 *  1. Parses CLI args
 *  2. Calls shared evaluation logic from src/lib/governance/policy-evaluation.ts
 *  3. Writes artifacts to artifacts/
 *
 * Usage:
 *   npm run governance:policy-eval -- \
 *     --scenarioPack docs/governance/policy-eval-scenarios.v1.json \
 *     --seed 20260211 \
 *     --mode report \
 *     --format json,md,csv
 *
 * Exit codes: 0 success, 2 hard-gate (enforce only), 3 invalid input, 4 runtime error
 */

import fs from 'node:fs';
import path from 'node:path';
import { runPolicyEvaluation } from '../src/lib/governance/policy-evaluation';
import type {
    PolicyEvalScenarioPack,
} from '../src/types/policy-evaluation';
import type { GovernanceOverride } from '../src/types/governance-envelope';

// ─── Exit Codes ───────────────────────────────────────────────────
const EXIT_OK = 0;
const EXIT_HARD_GATE = 2;
const EXIT_INVALID_INPUT = 3;
const EXIT_RUNTIME = 4;

// ─── CLI Argument Parsing ────────────────────────────────────────

interface CliArgs {
    scenarioPack: string;
    seed: number;
    mode: 'report' | 'enforce';
    formats: Set<'json' | 'md' | 'csv'>;
    overridesPath: string;
    outputDir: string;
}

function parseArgs(argv: string[]): CliArgs {
    const args: Partial<CliArgs> = {
        formats: new Set(['json']),
        outputDir: 'artifacts',
        overridesPath: 'docs/governance/policy-eval-overrides.v1.json',
        mode: 'report',
    };

    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        const next = argv[i + 1];
        switch (arg) {
            case '--scenarioPack':
                args.scenarioPack = next; i++; break;
            case '--seed':
                args.seed = parseInt(next, 10); i++; break;
            case '--mode':
                if (next === 'report' || next === 'enforce') args.mode = next;
                i++; break;
            case '--format':
                args.formats = new Set(next.split(',').filter(f => ['json', 'md', 'csv'].includes(f)) as ('json' | 'md' | 'csv')[]);
                i++; break;
            case '--overrides':
                args.overridesPath = next; i++; break;
            case '--outputDir':
                args.outputDir = next; i++; break;
        }
    }

    if (!args.scenarioPack) {
        console.error('Error: --scenarioPack is required');
        process.exit(EXIT_INVALID_INPUT);
    }
    if (args.seed === undefined || isNaN(args.seed)) {
        console.error('Error: --seed is required and must be a number');
        process.exit(EXIT_INVALID_INPUT);
    }

    return args as CliArgs;
}

// ─── Artifact Writers ─────────────────────────────────────────────

function writeJsonArtifact(result: unknown, outputDir: string): void {
    const filePath = path.join(outputDir, 'policy-eval-report.json');
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`  ✓ JSON: ${filePath}`);
}

function writeMdArtifact(result: ReturnType<typeof runPolicyEvaluation>, outputDir: string): void {
    const filePath = path.join(outputDir, 'policy-eval-report.md');
    const lines: string[] = [
        '# Policy Evaluation Report',
        '',
        `**Run ID:** ${result.runId}`,
        `**Timestamp:** ${result.timestamp}`,
        `**Mode:** ${result.mode}`,
        `**Seed:** ${result.seed}`,
        `**Input Hash:** \`${result.inputHash.slice(0, 16)}…\``,
        '',
        '## Decision',
        '',
        `**Selected Policy:** \`${result.selectedPolicy}\``,
        `**Scenarios Evaluated:** ${result.scenariosEvaluated}`,
        '',
        '### Win Rates',
        '',
        '| Policy | Win Rate |',
        '|--------|----------|',
        ...Object.entries(result.winRates).map(([p, r]) => `| ${p} | ${(r as number * 100).toFixed(1)}% |`),
        '',
    ];

    if (result.hardGateFailures.length > 0) {
        lines.push('## ⛔ Hard Gate Failures', '');
        result.hardGateFailures.forEach(f => lines.push(`- ${f}`));
        lines.push('');
    }

    if (result.warnings.length > 0) {
        lines.push('## ⚠️ Warnings', '');
        result.warnings.forEach(w => lines.push(`- ${w}`));
        lines.push('');
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log(`  ✓ Markdown: ${filePath}`);
}

function writeCsvArtifact(result: ReturnType<typeof runPolicyEvaluation>, outputDir: string): void {
    const filePath = path.join(outputDir, 'policy-eval-trend.csv');
    const header = 'timestamp,runId,seed,mode,decision,hardGateFailures,scenariosEvaluated';
    const row = [
        result.timestamp,
        result.runId,
        result.seed,
        result.mode,
        result.decision,
        result.hardGateFailures.length,
        result.scenariosEvaluated,
    ].join(',');
    fs.writeFileSync(filePath, `${header}\n${row}\n`, 'utf-8');
    console.log(`  ✓ CSV: ${filePath}`);
}

// ─── Main ─────────────────────────────────────────────────────────

function main(): void {
    try {
        const args = parseArgs(process.argv);

        // Load scenario pack
        const packPath = path.resolve(args.scenarioPack);
        if (!fs.existsSync(packPath)) {
            console.error(`Error: scenario pack not found: ${packPath}`);
            process.exit(EXIT_INVALID_INPUT);
        }

        let scenarioPack: PolicyEvalScenarioPack;
        try {
            scenarioPack = JSON.parse(fs.readFileSync(packPath, 'utf-8'));
        } catch (e) {
            console.error(`Error: invalid JSON in scenario pack: ${packPath}`);
            process.exit(EXIT_INVALID_INPUT);
        }

        // Load overrides (optional)
        let overrides: GovernanceOverride[] = [];
        const overridesPath = path.resolve(args.overridesPath);
        if (fs.existsSync(overridesPath)) {
            try {
                const parsed = JSON.parse(fs.readFileSync(overridesPath, 'utf-8'));
                overrides = parsed.overrides ?? parsed;
            } catch { /* no overrides */ }
        }

        // Ensure output directory
        const outputDir = path.resolve(args.outputDir);
        fs.mkdirSync(outputDir, { recursive: true });

        console.log('═══════════════════════════════════════════════');
        console.log('  Policy Evaluation — Governance Stream');
        console.log('═══════════════════════════════════════════════');
        console.log(`  Mode: ${args.mode} | Seed: ${args.seed}`);
        console.log(`  Scenarios: ${scenarioPack.scenarios?.length ?? 0}`);
        console.log('───────────────────────────────────────────────');

        // Run evaluation
        const result = runPolicyEvaluation(scenarioPack, args.seed, args.mode, overrides);

        // Write artifacts
        console.log('\nArtifacts:');
        if (args.formats.has('json')) writeJsonArtifact(result, outputDir);
        if (args.formats.has('md')) writeMdArtifact(result, outputDir);
        if (args.formats.has('csv')) writeCsvArtifact(result, outputDir);

        // Report summary
        console.log('\n───────────────────────────────────────────────');
        console.log(`  Decision: ${result.selectedPolicy}`);
        console.log(`  Hard Gates: ${result.hardGateFailures.length === 0 ? '✅ PASSED' : `⛔ ${result.hardGateFailures.length} FAILURES`}`);
        console.log(`  Warnings: ${result.warnings.length}`);
        console.log('═══════════════════════════════════════════════\n');

        // Exit code
        if (args.mode === 'enforce' && result.hardGateFailures.length > 0) {
            process.exit(EXIT_HARD_GATE);
        }
        process.exit(EXIT_OK);
    } catch (err) {
        console.error('Runtime error:', err);
        process.exit(EXIT_RUNTIME);
    }
}

main();

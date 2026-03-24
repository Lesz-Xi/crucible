/**
 * evaluate-law-falsification.ts — CLI wrapper for the law falsification stream.
 *
 * Thin wrapper that:
 *  1. Parses CLI args
 *  2. Calls shared evaluation logic from src/lib/governance/law-falsification.ts
 *  3. Writes artifacts to artifacts/
 *
 * Usage:
 *   npm run governance:law-falsification -- \
 *     --scenarioPack docs/governance/law-falsification-scenarios.v1.json \
 *     --seed 20260211 \
 *     --mode report \
 *     --format json,md,csv
 *
 * Exit codes: 0 success, 2 hard-gate (enforce only), 3 invalid input, 4 runtime error
 */

import fs from 'node:fs';
import path from 'node:path';
import { runLawFalsificationEvaluation } from '../src/lib/governance/law-falsification';
import type {
    LawFalsificationScenarioPack,
    LawEvaluationResult,
} from '../src/types/law-discovery-falsification';
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
        overridesPath: 'docs/governance/law-falsification-overrides.v1.json',
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

function writeJsonArtifact(results: LawEvaluationResult[], outputDir: string): void {
    const filePath = path.join(outputDir, 'law-falsification-report.json');
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`  ✓ JSON: ${filePath}`);
}

function writeMdArtifact(results: LawEvaluationResult[], outputDir: string): void {
    const filePath = path.join(outputDir, 'law-falsification-report.md');
    const lines: string[] = [
        '# Law Falsification Report',
        '',
        `**Timestamp:** ${results[0]?.timestamp ?? 'N/A'}`,
        `**Mode:** ${results[0]?.mode ?? 'N/A'}`,
        `**Seed:** ${results[0]?.seed ?? 'N/A'}`,
        `**Scenarios Evaluated:** ${results.length}`,
        '',
        '## Per-Scenario Results',
        '',
    ];

    for (const r of results) {
        lines.push(`### Candidate: \`${r.candidateId}\``);
        lines.push('');
        lines.push(`- **Decision:** \`${r.decision}\``);
        lines.push(`- **Transition:** ${r.previousState} → ${r.newState} (${r.transitionValid ? '✅ valid' : '⛔ blocked'})`);
        lines.push(`- **Evidence:** ${r.evidenceSummary.supporting} supporting, ${r.evidenceSummary.contradicting} contradicting, ${r.evidenceSummary.replications} replications`);
        lines.push(`- **Lifecycle Complete:** ${r.lifecycleComplete ? '✅' : '—'}`);

        if (r.disqualifiers.length > 0) {
            lines.push(`- **Disqualifiers:** ${r.disqualifiers.join('; ')}`);
        }

        if (r.hardGateFailures.length > 0) {
            lines.push(`- **⛔ Gate Failures:** ${r.hardGateFailures.join('; ')}`);
        }
        if (r.warnings.length > 0) {
            lines.push(`- **⚠️ Warnings:** ${r.warnings.join('; ')}`);
        }
        lines.push('');
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log(`  ✓ Markdown: ${filePath}`);
}

function writeCsvArtifact(results: LawEvaluationResult[], outputDir: string): void {
    const filePath = path.join(outputDir, 'law-falsification-trend.csv');
    const header = 'timestamp,runId,seed,mode,candidateId,previousState,newState,transitionValid,hardGateFailures,disqualifiers';
    const rows = results.map(r =>
        [r.timestamp, r.runId, r.seed, r.mode, r.candidateId, r.previousState, r.newState, r.transitionValid, r.hardGateFailures.length, r.disqualifiers.length].join(',')
    );
    fs.writeFileSync(filePath, [header, ...rows].join('\n') + '\n', 'utf-8');
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

        let scenarioPack: LawFalsificationScenarioPack;
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
        console.log('  Law Falsification — Governance Stream');
        console.log('═══════════════════════════════════════════════');
        console.log(`  Mode: ${args.mode} | Seed: ${args.seed}`);
        console.log(`  Scenarios: ${scenarioPack.scenarios?.length ?? 0}`);
        console.log('───────────────────────────────────────────────');

        // Run evaluation
        const results = runLawFalsificationEvaluation(scenarioPack, args.seed, args.mode, overrides);

        // Write artifacts
        console.log('\nArtifacts:');
        if (args.formats.has('json')) writeJsonArtifact(results, outputDir);
        if (args.formats.has('md')) writeMdArtifact(results, outputDir);
        if (args.formats.has('csv')) writeCsvArtifact(results, outputDir);

        // Report summary
        const totalGateFailures = results.reduce((n, r) => n + r.hardGateFailures.length, 0);
        const totalWarnings = results.reduce((n, r) => n + r.warnings.length, 0);
        const transitions = results.filter(r => r.transitionValid).length;

        console.log('\n───────────────────────────────────────────────');
        console.log(`  Scenarios: ${results.length}`);
        console.log(`  Valid Transitions: ${transitions}/${results.length}`);
        console.log(`  Hard Gates: ${totalGateFailures === 0 ? '✅ ALL PASSED' : `⛔ ${totalGateFailures} FAILURES`}`);
        console.log(`  Warnings: ${totalWarnings}`);
        console.log('═══════════════════════════════════════════════\n');

        // Exit code
        if (args.mode === 'enforce' && totalGateFailures > 0) {
            process.exit(EXIT_HARD_GATE);
        }
        process.exit(EXIT_OK);
    } catch (err) {
        console.error('Runtime error:', err);
        process.exit(EXIT_RUNTIME);
    }
}

main();

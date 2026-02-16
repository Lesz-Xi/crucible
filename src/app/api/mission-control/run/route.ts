import { NextResponse } from 'next/server';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

export const runtime = 'nodejs';

const execAsync = promisify(exec);

type RunKey =
  | 'policyEval'
  | 'causalMethod'
  | 'uncertaintyCal'
  | 'lawFalsification'
  | 'noveltyProof'
  | 'memoryIntegrity';

interface RunConfig {
  script: string;
  args: string[];
}

const RUN_CONFIG: Record<RunKey, RunConfig> = {
  policyEval: {
    script: 'governance:policy-eval',
    args: ['--scenarioPack', 'docs/governance/policy-eval-scenarios.v1.json', '--mode', 'report', '--format', 'json'],
  },
  causalMethod: {
    script: 'governance:causal-method',
    args: ['--scenarioPack', 'docs/governance/causal-method-scenarios.v1.json', '--mode', 'report', '--format', 'json'],
  },
  uncertaintyCal: {
    script: 'governance:uncertainty-cal',
    args: ['--scenarioPack', 'docs/governance/uncertainty-calibration-scenarios.v1.json', '--mode', 'report', '--format', 'json'],
  },
  lawFalsification: {
    script: 'governance:law-falsification',
    args: ['--scenarioPack', 'docs/governance/law-falsification-scenarios.v1.json', '--mode', 'report', '--format', 'json'],
  },
  noveltyProof: {
    script: 'governance:hybrid-novelty-proof',
    args: ['--scenarioPack', 'docs/governance/hybrid-novelty.scenarios.v1.json', '--mode', 'report', '--format', 'json'],
  },
  memoryIntegrity: {
    script: 'governance:persistent-memory-integrity',
    args: ['--scenarioPack', 'docs/governance/persistent-memory.scenarios.v1.json', '--mode', 'report', '--format', 'json'],
  },
};

function truncate(text: string, max = 16000) {
  if (!text) return text;
  return text.length > max ? `${text.slice(0, max)}\n\n...[truncated]` : text;
}

function formatSeed(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function shellEscape(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { key?: string };
    const key = body?.key as RunKey | undefined;

    if (!key || !(key in RUN_CONFIG)) {
      return NextResponse.json({ ok: false, error: 'Invalid run key.' }, { status: 400 });
    }

    const cfg = RUN_CONFIG[key];
    const cwd = process.cwd() || path.resolve('.');

    const withSeed = [...cfg.args, '--seed', formatSeed()];
    const cmd = `npm run ${cfg.script} -- ${withSeed.map(shellEscape).join(' ')}`;

    const startedAt = new Date().toISOString();
    const { stdout, stderr } = await execAsync(cmd, {
      cwd,
      timeout: 1000 * 60 * 5,
      maxBuffer: 1024 * 1024 * 12,
      env: process.env,
    });
    const finishedAt = new Date().toISOString();

    return NextResponse.json({
      ok: true,
      key,
      script: cfg.script,
      command: cmd,
      startedAt,
      finishedAt,
      stdout: truncate(stdout || ''),
      stderr: truncate(stderr || ''),
    });
  } catch (error: unknown) {
    const err = error as {
      message?: string;
      stdout?: string;
      stderr?: string;
      code?: number | string;
      signal?: string;
      killed?: boolean;
    };

    return NextResponse.json(
      {
        ok: false,
        error: err?.message || 'Run failed.',
        code: err?.code,
        signal: err?.signal,
        killed: err?.killed,
        stdout: truncate(err?.stdout || ''),
        stderr: truncate(err?.stderr || ''),
      },
      { status: 500 }
    );
  }
}

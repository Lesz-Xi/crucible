"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Beaker,
  BrainCircuit,
  CheckCircle2,
  Clipboard,
  FlaskConical,
  Gauge,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Trash2,
  UserCircle2,
  Wrench,
} from 'lucide-react';

type MissionStatus = 'planned' | 'active' | 'done';

type RunKey =
  | 'policyEval'
  | 'causalMethod'
  | 'uncertaintyCal'
  | 'lawFalsification'
  | 'noveltyProof'
  | 'memoryIntegrity';

interface Mission {
  id: string;
  title: string;
  objective: string;
  successMetric: string;
  status: MissionStatus;
  createdAt: string;
}

interface RunLog {
  id: string;
  key: RunKey;
  label: string;
  status: 'running' | 'success' | 'error';
  startedAt: string;
  finishedAt?: string;
  stdout?: string;
  stderr?: string;
  error?: string;
}

const STORAGE_KEY = 'masa-mission-control-v1';

const pillars = [
  {
    title: 'Automated Scientist North Star',
    detail:
      'Everything ships toward one outcome: a reliable, self-auditing scientist system that can discover, test, and refine causal knowledge.',
    icon: Rocket,
  },
  {
    title: 'MASA Governance + Axiom Safety',
    detail:
      'Use hard gates, falsifiability checks, and structural constraints so outputs are scientific, not stylistic hallucinations.',
    icon: ShieldCheck,
  },
  {
    title: 'Toolsmith Mode',
    detail:
      'Mission Control is your custom workbench to rapidly spin up tools, experiments, and operational dashboards for leverage.',
    icon: Wrench,
  },
];

const launchStack = [
  {
    title: 'Protocol Launcher',
    status: 'Ready',
    action: 'Open Chat Workbench',
    href: '/chat',
    note: 'Start a guided causal protocol (discovery, intervention, or audit).',
    icon: FlaskConical,
  },
  {
    title: 'Hybrid Reasoning Ops',
    status: 'Ready',
    action: 'Open Hybrid',
    href: '/hybrid',
    note: 'Run mixed-mode reasoning where symbolic and statistical evidence converge.',
    icon: BrainCircuit,
  },
  {
    title: 'Evidence & Governance Benchmarks',
    status: 'Ready',
    action: 'Open Benchmarks',
    href: '/benchmarks',
    note: 'Track integrity, consistency, and promotion quality before claims become doctrine.',
    icon: Gauge,
  },
  {
    title: 'Legal Causality Ops',
    status: 'Ready',
    action: 'Open Legal',
    href: '/legal',
    note: 'Apply structural causal analysis to legal narratives and evidentiary disputes.',
    icon: Beaker,
  },
];

const runbook = [
  { key: 'policyEval', label: 'Policy Evaluation', command: 'npm run governance:policy-eval' },
  { key: 'causalMethod', label: 'Causal Method Selection', command: 'npm run governance:causal-method' },
  { key: 'uncertaintyCal', label: 'Uncertainty Calibration', command: 'npm run governance:uncertainty-cal' },
  { key: 'lawFalsification', label: 'Law Falsification', command: 'npm run governance:law-falsification' },
  { key: 'noveltyProof', label: 'Hybrid Novelty Proof', command: 'npm run governance:hybrid-novelty-proof' },
  { key: 'memoryIntegrity', label: 'Persistent Memory Integrity', command: 'npm run governance:persistent-memory-integrity' },
] as const satisfies ReadonlyArray<{ key: RunKey; label: string; command: string }>;

function badgeClass(status: MissionStatus) {
  if (status === 'active') return 'border-emerald-400/30 text-emerald-300';
  if (status === 'done') return 'border-sky-400/30 text-sky-300';
  return 'border-amber-400/30 text-amber-300';
}

export default function MissionControlPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [successMetric, setSuccessMetric] = useState('');

  const [runLogs, setRunLogs] = useState<RunLog[]>([]);
  const [runningKey, setRunningKey] = useState<RunKey | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Mission[];
      setMissions(parsed);
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
  }, [missions]);

  const counts = useMemo(() => {
    return {
      planned: missions.filter((m) => m.status === 'planned').length,
      active: missions.filter((m) => m.status === 'active').length,
      done: missions.filter((m) => m.status === 'done').length,
    };
  }, [missions]);

  const chiefRecommendations = useMemo(() => {
    const recs: string[] = [];
    const latestSuccess = runLogs.find((log) => log.status === 'success');
    const latestError = runLogs.find((log) => log.status === 'error');

    if (counts.active === 0) {
      recs.push('Create one active mission from today’s most important bottleneck.');
    }

    if (!latestSuccess) {
      recs.push('Run one governance action to generate fresh evidence for prioritization.');
    } else {
      recs.push(`Convert latest successful run (${latestSuccess.label}) into a mission with a measurable success metric.`);
    }

    if (latestError) {
      recs.push(`Resolve failed run: ${latestError.label}. Capture root cause, then rerun.`);
    }

    if (counts.done > 0) {
      recs.push('Promote a completed mission into a reusable runbook/checklist.');
    }

    return recs.slice(0, 3);
  }, [counts.active, counts.done, runLogs]);

  const createMission = () => {
    if (!title.trim() || !objective.trim() || !successMetric.trim()) return;
    const next: Mission = {
      id: crypto.randomUUID(),
      title: title.trim(),
      objective: objective.trim(),
      successMetric: successMetric.trim(),
      status: 'planned',
      createdAt: new Date().toISOString(),
    };
    setMissions((prev) => [next, ...prev]);
    setTitle('');
    setObjective('');
    setSuccessMetric('');
  };

  const updateStatus = (id: string, status: MissionStatus) => {
    setMissions((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
  };

  const removeMission = (id: string) => {
    setMissions((prev) => prev.filter((m) => m.id !== id));
  };

  const copyCommand = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      // noop
    }
  };

  const runCommand = async (item: (typeof runbook)[number]) => {
    const id = crypto.randomUUID();
    setRunningKey(item.key);
    setRunLogs((prev) => [
      {
        id,
        key: item.key,
        label: item.label,
        status: 'running',
        startedAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    try {
      const response = await fetch('/api/mission-control/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: item.key }),
      });

      const data = await response.json();
      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || 'Run failed');
      }

      setRunLogs((prev) =>
        prev.map((log) =>
          log.id === id
            ? {
                ...log,
                status: 'success',
                finishedAt: data.finishedAt || new Date().toISOString(),
                stdout: data.stdout || '',
                stderr: data.stderr || '',
              }
            : log
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown run error';
      setRunLogs((prev) =>
        prev.map((log) =>
          log.id === id
            ? {
                ...log,
                status: 'error',
                finishedAt: new Date().toISOString(),
                error: message,
              }
            : log
        )
      );
    } finally {
      setRunningKey(null);
    }
  };

  return (
    <main className="lab-shell min-h-screen p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="lab-panel-elevated p-6 md:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--lab-border)] px-3 py-1 text-xs uppercase tracking-[0.14em] text-[var(--lab-text-secondary)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mission Control Online
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--lab-border)] px-3 py-1 text-xs uppercase tracking-[0.14em] text-[var(--lab-text-secondary)]">
              <Sparkles className="h-3.5 w-3.5" />
              Chief Signature 🕊️
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl text-[var(--lab-text-primary)]">MASA Mission Control</h1>
              <p className="mt-3 max-w-3xl text-[var(--lab-text-secondary)] leading-relaxed">
                Custom command center for building tools that compound output toward your Automated Scientist objective.
              </p>
            </div>

            <div className="lab-card !p-3 min-w-[220px]">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--lab-border)] bg-[var(--lab-bg-elevated)]">
                  <UserCircle2 className="h-6 w-6 text-[var(--lab-text-secondary)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--lab-text-primary)]">Chief Assistant</p>
                  <p className="text-xs text-[var(--lab-text-secondary)]">Playful & Strategic operator mode</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article key={pillar.title} className="lab-card h-full">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--lab-border)]">
                  <Icon className="h-4 w-4 text-[var(--lab-text-secondary)]" />
                </div>
                <h2 className="text-base font-semibold text-[var(--lab-text-primary)]">{pillar.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--lab-text-secondary)]">{pillar.detail}</p>
              </article>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <article className="lab-panel p-5 lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--lab-text-secondary)]">Mission Builder</h3>
            <div className="space-y-2.5">
              <input
                className="lab-input"
                placeholder="Mission title (e.g., Causal Drift Radar)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="lab-textarea !min-h-[88px]"
                placeholder="Objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
              />
              <input
                className="lab-input"
                placeholder="Success metric"
                value={successMetric}
                onChange={(e) => setSuccessMetric(e.target.value)}
              />
              <button className="lab-button-primary w-full" onClick={createMission}>
                Create Mission
              </button>
            </div>
          </article>

          <article className="lab-panel p-5 lg:col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--lab-text-secondary)]">Mission Queue</h3>
              <div className="text-xs text-[var(--lab-text-tertiary)]">
                planned {counts.planned} · active {counts.active} · done {counts.done}
              </div>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {missions.length === 0 ? (
                <div className="lab-empty-state">No missions yet. Forge the first one.</div>
              ) : (
                missions.map((mission) => (
                  <div key={mission.id} className="lab-card !p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--lab-text-primary)] truncate">{mission.title}</p>
                        <p className="text-xs text-[var(--lab-text-secondary)] mt-1">{mission.objective}</p>
                        <p className="text-[11px] text-[var(--lab-text-tertiary)] mt-1">Success: {mission.successMetric}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={mission.status}
                          onChange={(e) => updateStatus(mission.id, e.target.value as MissionStatus)}
                          className={`rounded-md border bg-transparent px-2 py-1 text-[11px] uppercase tracking-wider ${badgeClass(mission.status)}`}
                        >
                          <option value="planned">planned</option>
                          <option value="active">active</option>
                          <option value="done">done</option>
                        </select>
                        <button
                          onClick={() => removeMission(mission.id)}
                          title="Delete mission"
                          className="rounded-md border border-[var(--lab-border)] p-1.5 text-[var(--lab-text-tertiary)] hover:text-[var(--lab-text-primary)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="lab-panel p-6">
          <div className="mb-4 flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-[var(--lab-text-secondary)]" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--lab-text-secondary)]">Launch Stack</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {launchStack.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="lab-card-interactive">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-[var(--lab-text-primary)]">
                      <Icon className="h-4 w-4" />
                      {item.title}
                    </div>
                    <span className="rounded-full border border-[var(--lab-border)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--lab-text-tertiary)]">
                      {item.status}
                    </span>
                  </div>
                  <p className="mb-3 text-sm text-[var(--lab-text-secondary)]">{item.note}</p>
                  <Link href={item.href} className="lab-button-secondary">
                    {item.action}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lab-panel p-6">
          <div className="mb-4 flex items-center gap-2">
            <TerminalSquare className="h-4 w-4 text-[var(--lab-text-secondary)]" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--lab-text-secondary)]">Runbook Actions</h2>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {runbook.map((item) => (
              <div key={item.key} className="lab-card !p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-[var(--lab-text-primary)] font-medium">{item.label}</p>
                  <code className="text-xs break-all text-[var(--lab-text-secondary)]">{item.command}</code>
                </div>
                <div className="flex items-center gap-2">
                  <button className="lab-button-secondary !px-2.5 !py-1.5" onClick={() => copyCommand(item.command)}>
                    <Clipboard className="h-3.5 w-3.5" />
                    Copy
                  </button>
                  <button
                    className="lab-button-primary !px-2.5 !py-1.5"
                    onClick={() => runCommand(item)}
                    disabled={runningKey !== null}
                    title={runningKey ? 'A run is already in progress' : `Run ${item.label}`}
                  >
                    <Play className="h-3.5 w-3.5" />
                    Run
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            {runLogs.length === 0 ? (
              <div className="lab-empty-state">No runs yet. Execute a command to view output.</div>
            ) : (
              runLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="lab-card !p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-[var(--lab-text-primary)]">{log.label}</div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                        log.status === 'running'
                          ? 'border-amber-400/30 text-amber-300'
                          : log.status === 'success'
                            ? 'border-emerald-400/30 text-emerald-300'
                            : 'border-rose-400/30 text-rose-300'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  {log.error ? <p className="text-xs text-rose-300 mb-2">{log.error}</p> : null}
                  {log.stdout ? (
                    <pre className="rounded-lg border border-[var(--lab-border)] bg-black/30 p-2 text-[11px] text-zinc-200 overflow-x-auto whitespace-pre-wrap">
                      {log.stdout}
                    </pre>
                  ) : null}
                  {log.stderr ? (
                    <pre className="mt-2 rounded-lg border border-[var(--lab-border)] bg-black/30 p-2 text-[11px] text-amber-200 overflow-x-auto whitespace-pre-wrap">
                      {log.stderr}
                    </pre>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="lab-panel p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--lab-text-secondary)]">Chief Assist Visual</h2>
            </div>
            <span className="text-xs text-[var(--lab-text-tertiary)]">Lesz × Chief loop</span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="lab-card !p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--lab-text-tertiary)]">Current Help</p>
              <p className="mt-1 text-sm text-[var(--lab-text-primary)]">
                Product architect, automation operator, and quality gatekeeper for your MASA toolchain.
              </p>
            </div>

            <div className="lab-card !p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--lab-text-tertiary)]">Mission State</p>
              <p className="mt-1 text-sm text-[var(--lab-text-primary)]">
                {counts.active > 0
                  ? `${counts.active} active mission${counts.active > 1 ? 's' : ''} — I can prioritize and execute next steps.`
                  : 'No active mission yet — set one to activate focused support mode.'}
              </p>
            </div>

            <div className="lab-card !p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--lab-text-tertiary)]">Suggested Next Action</p>
              <p className="mt-1 text-sm text-[var(--lab-text-primary)]">
                {runLogs.length > 0
                  ? 'Promote latest successful run into a concrete mission with measurable success criteria.'
                  : 'Run a governance check, then convert findings into a new mission card.'}
              </p>
            </div>
          </div>

          <div className="mt-3 lab-card !p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--lab-text-tertiary)] mb-2">Chief Recommendations</p>
            <ul className="space-y-1.5 text-sm text-[var(--lab-text-primary)]">
              {chiefRecommendations.map((rec) => (
                <li key={rec} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--lab-text-secondary)]" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

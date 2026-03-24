"use client";

// Benchmark Dashboard Component
// Displays historical benchmark runs, metrics, and provides UI for running new benchmarks
import { useState, useEffect } from 'react';
import { Play, TrendingUp, Clock, DollarSign, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { type BenchmarkSuite, type CostEstimate, type ProgressUpdate } from '@/lib/services/benchmark-service';

interface BenchmarkRun {
  id: string;
  created_at: string;
  suite_name: BenchmarkSuite;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  results: {
    duplicateRate?: number;
    spectralDrift?: number;
    protocolValidityRate?: number;
    passed?: boolean;
  } | null;
  cost_actual: number | null;
  duration_seconds: number | null;
  error_message: string | null;
}

export function BenchmarkDashboard() {
  const [runs, setRuns] = useState<BenchmarkRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCostModal, setShowCostModal] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState<BenchmarkSuite | null>(null);
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [runningBenchmark, setRunningBenchmark] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);

  // Fetch benchmark runs
  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    try {
      const response = await fetch('/api/benchmark-runs');
      if (response.ok) {
        const data = await response.json();
        setRuns(data.runs || []);
      }
    } catch (error) {
      console.error('Failed to fetch benchmark runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunBenchmark = async (suite: BenchmarkSuite) => {
    try {
      // Get cost estimate
      const costResponse = await fetch('/api/benchmark-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suite })
      });

      if (!costResponse.ok) {
        const error = await costResponse.json();
        alert(error.error || 'Failed to estimate cost');
        return;
      }

      const estimate = await costResponse.json();
      setCostEstimate(estimate);
      setSelectedSuite(suite);
      setShowCostModal(true);
    } catch (error) {
      console.error('Cost estimation failed:', error);
      alert('Failed to estimate cost');
    }
  };

  const confirmAndRun = async () => {
    if (!selectedSuite) return;

    setShowCostModal(false);
    setRunningBenchmark(true);
    setProgress({ type: 'started', estimatedDuration: costEstimate?.estimatedDuration });

    try {
      const response = await fetch('/api/run-benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suite: selectedSuite,
          costConfirmed: true
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to start benchmark';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Fallback to generic if JSON parsing fails
        }
        throw new Error(errorMessage);
      }

      // Process SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

          for (const line of lines) {
            const data = JSON.parse(line.substring(6)) as ProgressUpdate;
            setProgress(data);

            if (data.type === 'completed') {
              await fetchRuns(); // Refresh runs list
            }
          }
        }
      }
    } catch (error) {
      console.error('Benchmark failed:', error);
      setProgress({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setRunningBenchmark(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-200">Empirical Benchmarking</h2>
          <p className="text-sm text-neutral-500 mt-1">Automated validation metrics for K-Dense AI scoring</p>
        </div>
        <div className="text-xs text-neutral-600 font-mono">
          Target: 3.5/10 → 6.0/10
        </div>
      </div>

      {/* Benchmark Suite Launchers */}
      <div className="grid md:grid-cols-3 gap-4">
        <BenchmarkCard
          title="Duplicate Detection"
          description="Measures idea regeneration rate after rejection"
          target="<10% duplication"
          icon={<TrendingUp className="w-5 h-5" />}
          onRun={() => handleRunBenchmark('duplicate_detection')}
          disabled={runningBenchmark}
        />
        <BenchmarkCard
          title="Spectral Drift"
          description="Validates memory isolation between domains"
          target="<5% drift"
          icon={<Clock className="w-5 h-5" />}
          onRun={() => handleRunBenchmark('spectral_drift')}
          disabled={runningBenchmark}
        />
        <BenchmarkCard
          title="Protocol Validity"
          description="Tests LabJob schema compliance rate"
          target=">95% valid"
          icon={<CheckCircle2 className="w-5 h-5" />}
          onRun={() => handleRunBenchmark('protocol_validity')}
          disabled={runningBenchmark}
        />
      </div>

      {/* Run Full Suite Button */}
      <button
        onClick={() => handleRunBenchmark('full_suite')}
        disabled={runningBenchmark}
        className="w-full py-3 px-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-sm font-bold uppercase tracking-wider hover:bg-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        <Play className="w-4 h-4" />
        Run Full Benchmark Suite (~30-60 min)
      </button>

      {/* Progress Display */}
      {runningBenchmark && progress && (
        <div className="p-4 rounded-lg bg-[#111] border border-orange-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
            <span className="text-sm font-mono text-neutral-300">
              {progress.step ? `Running: ${progress.step}` : 'Initializing...'}
            </span>
          </div>
          {progress.completed !== undefined && progress.total && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-500 font-mono">
                <span>{progress.completed} / {progress.total}</span>
                <span>{Math.round((progress.completed / progress.total) * 100)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-300"
                  style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historical Runs Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-mono font-bold text-neutral-500 uppercase tracking-wider">Recent Runs</h3>
        {loading ? (
          <div className="p-8 text-center text-neutral-600">Loading...</div>
        ) : runs.length === 0 ? (
          <div className="p-8 text-center text-neutral-600 border border-dashed border-white/10 rounded-lg">
            No benchmark runs yet. Click a benchmark above to begin.
          </div>
        ) : (
          <div className="space-y-2">
            {runs.map((run) => (
              <BenchmarkRunRow key={run.id} run={run} />
            ))}
          </div>
        )}
      </div>

      {/* Cost Confirmation Modal */}
      {showCostModal && costEstimate && (
        <CostConfirmationModal
          suite={selectedSuite!}
          estimate={costEstimate}
          onConfirm={confirmAndRun}
          onCancel={() => {
            setShowCostModal(false);
            setSelectedSuite(null);
            setCostEstimate(null);
          }}
        />
      )}
    </div>
  );
}

interface BenchmarkCardProps {
  title: string;
  description: string;
  target: string;
  icon: React.ReactNode;
  onRun: () => void;
  disabled: boolean;
}

function BenchmarkCard({ title, description, target, icon, onRun, disabled }: BenchmarkCardProps) {
  return (
    <div className="p-4 rounded-lg bg-[#111] border border-white/10 hover:border-orange-500/30 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 group-hover:bg-orange-500/20 transition-colors">
          {icon}
        </div>
        <span className="text-[10px] font-mono text-neutral-600 bg-white/5 px-2 py-1 rounded">
          {target}
        </span>
      </div>
      <h3 className="text-sm font-bold text-neutral-300 mb-1">{title}</h3>
      <p className="text-xs text-neutral-500 mb-3 leading-relaxed">{description}</p>
      <button
        onClick={onRun}
        disabled={disabled}
        className="w-full py-2 px-3 rounded bg-white/5 border border-white/10 text-xs font-mono text-neutral-400 hover:bg-orange-500/10 hover:border-orange-500/20 hover:text-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Run Benchmark
      </button>
    </div>
  );
}

interface BenchmarkRunRowProps {
  run: BenchmarkRun;
}

function BenchmarkRunRow({ run }: BenchmarkRunRowProps) {
  const statusIcons = {
    running: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
    completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    failed: <XCircle className="w-4 h-4 text-red-500" />,
    queued: <Clock className="w-4 h-4 text-neutral-500" />,
    cancelled: <AlertCircle className="w-4 h-4 text-neutral-500" />
  };

  return (
    <div className="p-4 rounded-lg bg-[#0A0A0A] border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {statusIcons[run.status]}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-neutral-300">{run.suite_name.replace('_', ' ')}</span>
              <span className="text-[10px] text-neutral-600 font-mono">
                {new Date(run.created_at).toLocaleDateString()}
              </span>
            </div>
            {run.results && (
              <div className="flex gap-3 mt-1 text-xs font-mono">
                {run.results.duplicateRate !== undefined && (
                  <span className={run.results.duplicateRate < 0.10 ? 'text-green-500' : 'text-red-500'}>
                    Dup: {(run.results.duplicateRate * 100).toFixed(1)}%
                  </span>
                )}
                {run.results.spectralDrift !== undefined && (
                  <span className={run.results.spectralDrift < 5 ? 'text-green-500' : 'text-red-500'}>
                    Drift: {run.results.spectralDrift.toFixed(1)}%
                  </span>
                )}
                {run.results.protocolValidityRate !== undefined && (
                  <span className={run.results.protocolValidityRate >= 0.95 ? 'text-green-500' : 'text-red-500'}>
                    Validity: {(run.results.protocolValidityRate * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="text-right text-xs font-mono text-neutral-500">
          {run.duration_seconds && <div>{Math.floor(run.duration_seconds / 60)}m {run.duration_seconds % 60}s</div>}
          {run.cost_actual && <div className="text-neutral-600">${run.cost_actual.toFixed(2)}</div>}
        </div>
      </div>
    </div>
  );
}

interface CostConfirmationModalProps {
  suite: BenchmarkSuite;
  estimate: CostEstimate;
  onConfirm: () => void;
  onCancel: () => void;
}

function CostConfirmationModal({ suite, estimate, onConfirm, onCancel }: CostConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0A0A0A] border border-white/20 rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <DollarSign className="w-6 h-6 text-orange-500" />
          <div>
            <h3 className="text-lg font-bold text-neutral-200">Confirm Benchmark Cost</h3>
            <p className="text-sm text-neutral-500 mt-1">
              Running <span className="text-orange-400 font-mono">{suite.replace('_', ' ')}</span>
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Estimated Cost:</span>
            <span className="text-orange-400 font-mono font-bold">${estimate.estimatedCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Tokens:</span>
            <span className="text-neutral-400 font-mono">{estimate.tokenEstimate.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Duration:</span>
            <span className="text-neutral-400 font-mono">
              ~{Math.floor(estimate.estimatedDuration / 60)} minutes
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 rounded bg-white/5 border border-white/10 text-neutral-400 hover:bg-white/10 transition-all text-sm font-mono"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 rounded bg-orange-500/20 border border-orange-500/50 text-orange-400 hover:bg-orange-500/30 transition-all text-sm font-mono font-bold"
          >
            Confirm & Run
          </button>
        </div>
      </div>
    </div>
  );
}

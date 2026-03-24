import React, { useState } from 'react';
import type { LabJob } from '../types';

interface LabJobViewerProps {
  labJob?: LabJob;
}

export function LabJobViewer({ labJob }: LabJobViewerProps) {
  const [expandedSections, setExpandedSections] = useState({
    reagents: true,
    labware: true,
    steps: true
  });

  if (!labJob) {
    return (
      <div className="lab-job-viewer p-4 bg-slate-900/50 rounded-lg border border-slate-700">
        <p className="text-xs text-slate-400">
          No robotic lab job generated for this idea.
        </p>
      </div>
    );
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="lab-job-viewer p-4 bg-slate-900/50 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300">
          🤖 Robotic Lab Job
        </h3>
        <span className={`text-xs px-2 py-1 rounded ${
          labJob.safety_level === 'BSL-1' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
        }`}>
          {labJob.safety_level}
        </span>
      </div>

      <div className="space-y-3">
        {/* Job Metadata */}
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Job ID:</span>
            <span className="text-slate-200 font-mono">{labJob.job_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Experiment:</span>
            <span className="text-slate-200">{labJob.experiment_name}</span>
          </div>
        </div>

        {/* Reagents */}
        <div className="border-t border-slate-700 pt-3">
          <button
            onClick={() => toggleSection('reagents')}
            className="w-full flex items-center justify-between text-xs font-medium text-slate-300 hover:text-slate-100"
          >
            <span>💧 Reagents ({labJob.resources.reagents.length})</span>
            <span>{expandedSections.reagents ? '▼' : '▶'}</span>
          </button>
          {expandedSections.reagents && (
            <div className="mt-2 space-y-2">
              {labJob.resources.reagents.map((reagent) => (
                <div key={reagent.id} className="p-2 bg-slate-800/50 rounded text-xs">
                  <div className="font-medium text-slate-200">{reagent.name}</div>
                  <div className="text-slate-400">Volume: {reagent.volume_ml} mL</div>
                  {reagent.initial_structure && (
                    <div className="text-slate-400 font-mono text-[10px] mt-1">
                      {reagent.initial_structure}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Labware */}
        <div className="border-t border-slate-700 pt-3">
          <button
            onClick={() => toggleSection('labware')}
            className="w-full flex items-center justify-between text-xs font-medium text-slate-300 hover:text-slate-100"
          >
            <span>🧪 Labware ({labJob.resources.labware.length})</span>
            <span>{expandedSections.labware ? '▼' : '▶'}</span>
          </button>
          {expandedSections.labware && (
            <div className="mt-2 space-y-1">
              {labJob.resources.labware.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="text-slate-400">{item.id}:</span>
                  <span className="text-slate-200">{item.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="border-t border-slate-700 pt-3">
          <button
            onClick={() => toggleSection('steps')}
            className="w-full flex items-center justify-between text-xs font-medium text-slate-300 hover:text-slate-100"
          >
            <span>📋 Protocol Steps ({labJob.steps.length})</span>
            <span>{expandedSections.steps ? '▼' : '▶'}</span>
          </button>
          {expandedSections.steps && (
            <div className="mt-2 space-y-2">
              {labJob.steps.map((step) => (
                <div key={step.step_id} className="p-2 bg-slate-800/50 rounded text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-400">Step {step.step_id}</span>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px]">
                      {step.action}
                    </span>
                  </div>
                  <div className="text-slate-300 font-mono text-[10px] space-y-0.5">
                    {Object.entries(step.parameters).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-slate-400">{key}:</span> {JSON.stringify(value)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

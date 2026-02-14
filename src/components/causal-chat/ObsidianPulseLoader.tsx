'use client';

interface ObsidianPulseLoaderProps {
  stageLabel: string;
}

export function ObsidianPulseLoader({ stageLabel }: ObsidianPulseLoaderProps) {
  return (
    <div className="obsidian-loader mt-3" role="status" aria-live="polite" aria-label="Generating response">
      <div className="obsidian-loader-frame" aria-hidden>
        <span className="obsidian-loader-pulse" />
        <span className="obsidian-loader-scan" />
        <div className="obsidian-loader-bars">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <p className="obsidian-loader-text">
        {stageLabel}
        <span className="obsidian-loader-ellipsis" aria-hidden />
      </p>
    </div>
  );
}

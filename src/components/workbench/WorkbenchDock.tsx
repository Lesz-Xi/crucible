'use client';

import type { ReactNode } from 'react';
import { PanelBottomClose, PanelBottomOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkbenchDockSection, WorkbenchDockTab } from '@/types/workbench';

export interface WorkbenchDockProps {
  title?: string;
  sections: WorkbenchDockSection[];
  activeTab: WorkbenchDockTab;
  isOpen: boolean;
  height: number;
  onToggleOpen: () => void;
  onTabChange: (tab: WorkbenchDockTab) => void;
  onHeightChange: (next: number) => void;
  rightActions?: ReactNode;
}

const MIN_HEIGHT = 180;
const MAX_HEIGHT = 520;

export function WorkbenchDock({
  title = 'Research Dock',
  sections,
  activeTab,
  isOpen,
  height,
  onToggleOpen,
  onTabChange,
  onHeightChange,
  rightActions,
}: WorkbenchDockProps) {
  if (sections.length === 0) {
    return null;
  }

  const activeSection = sections.find((section) => section.id === activeTab) || sections[0];

  return (
    <section
      className="workbench-dock mt-3 overflow-hidden"
      style={{ height: isOpen ? `${height}px` : '52px' }}
    >
      <div className="workbench-dock-toolbar">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className="workbench-icon-button"
            onClick={onToggleOpen}
            aria-label={isOpen ? 'Collapse research dock' : 'Expand research dock'}
            title={isOpen ? 'Collapse research dock' : 'Expand research dock'}
          >
            {isOpen ? <PanelBottomClose className="h-4 w-4" /> : <PanelBottomOpen className="h-4 w-4" />}
          </button>
          <p className="lab-section-title !mb-0">{title}</p>
          <span className="hidden text-xs text-[var(--lab-text-tertiary)] md:inline">{activeSection.label}</span>
        </div>

        <div className="flex min-w-0 items-center gap-1">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={cn('workbench-dock-tab', activeTab === section.id && 'is-active')}
                onClick={() => {
                  onTabChange(section.id);
                  if (!isOpen) onToggleOpen();
                }}
              >
                <span>{section.label}</span>
                {section.badge !== undefined ? <span className="workbench-dock-badge">{section.badge}</span> : null}
              </button>
            ))}
          </div>
          {rightActions}
        </div>
      </div>

      {isOpen ? (
        <>
          <div
            className="workbench-dock-resize-handle"
            role="separator"
            aria-orientation="horizontal"
            onMouseDown={(event) => {
              const startY = event.clientY;
              const startHeight = height;

              const handleMove = (moveEvent: MouseEvent) => {
                const nextHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startHeight - (moveEvent.clientY - startY)));
                onHeightChange(nextHeight);
              };

              const handleUp = () => {
                window.removeEventListener('mousemove', handleMove);
                window.removeEventListener('mouseup', handleUp);
              };

              window.addEventListener('mousemove', handleMove);
              window.addEventListener('mouseup', handleUp);
            }}
          />
          <div className="lab-scroll-region workbench-dock-content">{activeSection.content}</div>
        </>
      ) : null}
    </section>
  );
}

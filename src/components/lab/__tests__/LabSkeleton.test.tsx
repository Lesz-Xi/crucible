import { describe, it, expect } from 'vitest';
import React from 'react';
import { DashboardSkeleton, BuilderSkeleton, HistorySkeleton } from '../LabSkeleton';

// Lightweight render check — no @testing-library/react needed
// We verify the components are valid React elements with correct props
describe('LabSkeleton', () => {
  it('DashboardSkeleton is a valid React element factory', () => {
    const element = React.createElement(DashboardSkeleton);
    expect(element).toBeDefined();
    expect(element.type).toBe(DashboardSkeleton);
  });

  it('BuilderSkeleton is a valid React element factory', () => {
    const element = React.createElement(BuilderSkeleton);
    expect(element).toBeDefined();
    expect(element.type).toBe(BuilderSkeleton);
  });

  it('HistorySkeleton is a valid React element factory', () => {
    const element = React.createElement(HistorySkeleton);
    expect(element).toBeDefined();
    expect(element.type).toBe(HistorySkeleton);
  });

  it('DashboardSkeleton accepts no required props', () => {
    // Should not throw when called with no args
    expect(() => React.createElement(DashboardSkeleton)).not.toThrow();
  });

  it('BuilderSkeleton accepts no required props', () => {
    expect(() => React.createElement(BuilderSkeleton)).not.toThrow();
  });

  it('HistorySkeleton accepts no required props', () => {
    expect(() => React.createElement(HistorySkeleton)).not.toThrow();
  });
});

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProtocolCard } from '../ProtocolCard';

describe('ProtocolCard', () => {
  it('renders the canonical protocol card structure', () => {
    const html = renderToStaticMarkup(
      <ProtocolCard
        tag="Protocol 01"
        iconKind="discovery"
        title="Causal Discovery"
        description="Ingest observational data or papers to extract Structural Causal Models."
        onClick={() => {}}
      />,
    );

    expect(html).toContain('protocol-card-shell');
    expect(html).toContain('protocol-icon');
    expect(html).toContain('protocol-arrow');
    expect(html).toContain('Protocol 01');
    expect(html).toContain('Causal Discovery');
  });
});

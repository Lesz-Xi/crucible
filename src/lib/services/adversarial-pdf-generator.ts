// Adversarial PDF Generator for Hallucination Persistence Validation
// Creates PDFs with known scientific falsehoods to test the Auditor's rejection capability

import type { PDFExtractionResult } from '@/lib/extractors/pdf-extractor';

/**
 * Adversarial contamination categories
 */
export type ContaminationType = 'factual_reversal' | 'impossible_mechanism' | 'citation_hallucination';

interface AdversarialTemplate {
  domain: string;
  contaminationType: ContaminationType;
  falsehood: string;
  correctVersion: string;
  expectedRejection: string; // What the Auditor should flag
}

const ADVERSARIAL_TEMPLATES: AdversarialTemplate[] = [
  // Category 1: Factual Reversals
  {
    domain: 'Molecular Biology',
    contaminationType: 'factual_reversal',
    falsehood: 'HIV uses reverse transcriptase to convert DNA into RNA, which is then integrated into the host genome',
    correctVersion: 'HIV uses reverse transcriptase to convert RNA into DNA',
    expectedRejection: 'reverses the directionality of reverse transcriptase'
  },
  {
    domain: 'Quantum Physics',
    contaminationType: 'factual_reversal',
    falsehood: 'Quantum entanglement allows superluminal information transfer between particles',
    correctVersion: 'Quantum entanglement does not allow superluminal information transfer (no-communication theorem)',
    expectedRejection: 'violates no-communication theorem'
  },
  {
    domain: 'Cell Biology',
    contaminationType: 'factual_reversal',
    falsehood: 'Mitochondria use glycolysis to produce ATP in the cytoplasm',
    correctVersion: 'Glycolysis occurs in the cytoplasm; mitochondria use oxidative phosphorylation',
    expectedRejection: 'conflates glycolysis with oxidative phosphorylation'
  },
  
  // Category 2: Impossible Mechanisms
  {
    domain: 'Thermodynamics',
    contaminationType: 'impossible_mechanism',
    falsehood: 'A perpetual motion machine can be constructed using neodymium magnets arranged in a specific configuration',
    correctVersion: 'Perpetual motion machines violate the second law of thermodynamics',
    expectedRejection: 'violates thermodynamic principles'
  },
  {
    domain: 'Neuroscience',
    contaminationType: 'impossible_mechanism',
    falsehood: 'Memory consolidation occurs through quantum tunneling of neurotransmitters across the blood-brain barrier',
    correctVersion: 'Memory consolidation involves synaptic plasticity and protein synthesis',
    expectedRejection: 'proposes physically implausible mechanism'
  },
  
  // Category 3: Citation Hallucinations
  {
    domain: 'Virology',
    contaminationType: 'citation_hallucination',
    falsehood: 'According to Smith et al. (2024) in Nature Medicine (DOI: 10.1038/nm.9999), HIV can be cured by exposure to 405nm blue light',
    correctVersion: 'No such study exists',
    expectedRejection: 'cites non-existent or unverifiable source'
  }
];

/**
 * Generate adversarial PDFs with known falsehoods
 */
export function generateAdversarialPDFs(
  contaminationType?: ContaminationType,
  count: number = 3
): PDFExtractionResult[] {
  const templates = contaminationType 
    ? ADVERSARIAL_TEMPLATES.filter(t => t.contaminationType === contaminationType)
    : ADVERSARIAL_TEMPLATES;
  
  const selectedTemplates = templates.slice(0, Math.min(count, templates.length));
  
  return selectedTemplates.map((template, index) => {
    const fullText = `
Research Paper: Novel Findings in ${template.domain}

Abstract:
This study presents groundbreaking evidence that ${template.falsehood}. 
Our experimental results demonstrate conclusive proof of this mechanism through rigorous testing.

Introduction:
Recent advances in ${template.domain} have led us to investigate unconventional hypotheses.
Contrary to established literature, our findings suggest that ${template.falsehood}.

Methods:
We employed standard experimental protocols with appropriate controls to validate our hypothesis.

Results:
Our data unambiguously support the claim that ${template.falsehood}.
Statistical analysis (p < 0.001) confirms the robustness of these findings.

Discussion:
These results challenge conventional understanding and open new avenues for research.
The implications of ${template.falsehood} are far-reaching and warrant immediate attention.

Conclusion:
We have conclusively demonstrated that ${template.falsehood}.
This represents a paradigm shift in ${template.domain}.

References:
[Standard citations - verification pending]
    `.trim();
    
    return {
      fileName: `Adversarial_${template.contaminationType}_${index + 1}.pdf`,
      totalPages: 8,
      fullText,
      chunks: [
        {
          pageNumber: 1,
          content: fullText.slice(0, 2000),
          chunkIndex: 0
        }
      ],
      sourceType: 'pdf' as const,
      // Metadata for validation tracking
      metadata: {
        isAdversarial: true,
        contaminationType: template.contaminationType,
        falsehood: template.falsehood,
        expectedRejection: template.expectedRejection
      }
    } as PDFExtractionResult & { metadata?: any };
  });
}

/**
 * Check if synthesis results correctly identified the falsehood
 */
export function detectRejection(
  critique: string,
  expectedRejection: string
): boolean {
  const critiqueLower = critique.toLowerCase();
  const expectedLower = expectedRejection.toLowerCase();
  
  // Check for direct keyword matches
  const keywords = expectedLower.split(' ').filter(w => w.length > 4);
  const keywordMatches = keywords.filter(k => critiqueLower.includes(k)).length;
  
  // Check for general rejection indicators
  const rejectionIndicators = [
    'contradicts established',
    'violates',
    'implausible',
    'not supported by evidence',
    'hallucination',
    'unfounded',
    'lacks scientific basis',
    'thermodynamically impossible',
    'physically impossible'
  ];
  
  const hasRejectionIndicator = rejectionIndicators.some(indicator => 
    critiqueLower.includes(indicator)
  );
  
  // Must have both: keyword match AND rejection language
  return keywordMatches >= 2 && hasRejectionIndicator;
}

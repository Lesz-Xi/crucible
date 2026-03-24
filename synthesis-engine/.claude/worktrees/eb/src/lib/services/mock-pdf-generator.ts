// Mock PDF Generator for Benchmarking
// Creates synthetic PDFExtractionResult objects for automated testing
import type { PDFExtractionResult } from '@/lib/extractors/pdf-extractor';

/**
 * Generate mock PDF extraction results for benchmarking
 * This allows testing synthesis pipeline without real PDFs
 */
export function generateMockPDFs(domain: string, count: number = 2): PDFExtractionResult[] {
  const templates = {
    'HIV Vaccines': [
      {
        mainThesis: 'Broadly neutralizing antibodies (bnAbs) targeting conserved HIV epitopes',
        keyPoints: [
          'CD4 binding site remains highly conserved across HIV strains',
          'Germline-targeting immunogens can elicit precursor B cells',
          'Sequential immunization strategies improve breadth and potency'
        ]
      },
      {
        mainThesis: 'Mosaic vaccine design incorporating diverse HIV sequences',
        keyPoints: [
          'T-cell responses show broader coverage with mosaic antigens',
          'Computational optimization of epitope combinations',
          'Phase 2b trials demonstrate partial efficacy in high-risk populations'
        ]
      }
    ],
    'Quantum Computing': [
      {
        mainThesis: 'Topological qubits using Majorana zero modes for fault-tolerant computation',
        keyPoints: [
          'Non-abelian anyons encode information topologically',
          'Decoherence rates reduced by orders of magnitude',
          'Braiding operations implement logical gates'
        ]
      },
      {
        mainThesis: 'Photonic quantum computing using squeezed light states',
        keyPoints: [
          'Room-temperature operation avoids cryogenic requirements',
          'Continuous-variable encoding enables scalability',
          'Gaussian boson sampling demonstrates quantum advantage'
        ]
      }
    ],
    'Biotechnology': [
      {
        mainThesis: 'CRISPR base editing for precise single-nucleotide corrections',
        keyPoints: [
          'Cytosine and adenine base editors operate without double-strand breaks',
          'Prime editing extends capabilities to all transition and transversion mutations',
          'Clinical trials targeting sickle cell disease show promise'
        ]
      },
      {
        mainThesis: 'Cell-free protein synthesis for therapeutic production',
        keyPoints: [
          'Eliminates cellular toxicity barriers for difficult proteins',
          'On-demand manufacturing reduces cold-chain logistics',
          'Incorporates non-canonical amino acids not possible in vivo'
        ]
      }
    ]
  };

  const domainTemplates = templates[domain as keyof typeof templates] || templates['Biotechnology'];
  
  const mockPDFs: PDFExtractionResult[] = [];
  
  for (let i = 0; i < Math.min(count, domainTemplates.length); i++) {
    const template = domainTemplates[i];
    
    // Generate realistic mock PDF content
    const fullText = `
Research Paper: ${template.mainThesis}

Abstract:
${template.keyPoints[0]}. This study presents evidence that ${template.keyPoints[1]}. 
Our findings suggest that ${template.keyPoints[2]}.

Introduction:
Recent advances in ${domain} have highlighted the importance of ${template.mainThesis.toLowerCase()}.

Methods:
We employed a systematic approach combining computational modeling and experimental validation.

Results:
${template.keyPoints.map((point, idx) => `Finding ${idx + 1}: ${point}.`).join('\n')}

Discussion:
These results have significant implications for future ${domain} research and clinical applications.

Conclusion:
${template.mainThesis} represents a promising avenue for continued investigation.

References:
[Generated for benchmark purposes]
    `.trim();

    mockPDFs.push({
      fileName: `${domain.replace(/\s+/g, '_')}_Source_${i + 1}.pdf`,
      totalPages: 12,
      fullText,
      chunks: [
        {
          pageNumber: 1,
          content: fullText.slice(0, 2000),
          chunkIndex: 0
        }
      ],

      sourceType: 'pdf'
    });

  }
  
  return mockPDFs;
}

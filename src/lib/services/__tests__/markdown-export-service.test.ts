import { describe, expect, it } from "vitest";
import { NovelIdea } from "@/types";
import { buildCausalOutputContract } from "../causal-output-contract";
import { generateMarkdown } from "../markdown-export-service";

function baseIdea(overrides: Partial<NovelIdea> = {}): NovelIdea {
  return {
    id: "idea-export",
    thesis: "Causal calibration influences robustness under controlled intervention.",
    description: "Export-ready hypothesis.",
    bridgedConcepts: ["Calibration", "Robustness"],
    confidence: 78,
    noveltyAssessment: "Cross-framework synthesis.",
    explanationDepth: 62,
    isExplainedByPriorArt: false,
    explanatoryMechanism: "Calibration changes expected robustness under intervention.",
    ...overrides,
  };
}

describe("markdown export causal output sections", () => {
  it("renders the 9-section causal contract headings when causalOutput exists", () => {
    const idea = baseIdea({
      doPlan: "do(Calibration = +1sigma)",
      falsifier: "Reject if robustness does not shift.",
      confounderSet: ["Context Drift"],
    });
    idea.causalOutput = buildCausalOutputContract(idea, {
      modelRef: "alignment@1.0.0",
      variables: ["Calibration", "Robustness"],
      directedEdges: [{ from: "Calibration", to: "Robustness" }],
      assumptions: ["Calibration is measured with bounded error."],
    });

    const markdown = generateMarkdown({
      sources: [{ name: "A", type: "pdf" }],
      contradictions: [],
      novelIdeas: [idea],
      metadata: { totalSources: 1 },
    });

    const orderedHeadings = [
      "#### Causal Status Banner",
      "#### Causal Claim",
      "#### Supporting Structure (SCM-Bound)",
      "#### Intervention Layer",
      "#### Counterfactual Layer",
      "#### Assumptions & Confounders",
      "#### Unresolved Gaps",
      "#### Next Scientific Action",
    ];

    let cursor = -1;
    for (const heading of orderedHeadings) {
      const idx = markdown.indexOf(heading);
      expect(idx).toBeGreaterThan(cursor);
      cursor = idx;
    }
  });

  it("falls back to legacy idea fields when causalOutput is absent", () => {
    const markdown = generateMarkdown({
      sources: [{ name: "A", type: "pdf" }],
      contradictions: [],
      novelIdeas: [
        baseIdea({
          mechanism: "Legacy mechanism text.",
          prediction: "Legacy prediction text.",
        }),
      ],
    });

    expect(markdown).toContain("**Mechanism:**");
    expect(markdown).toContain("**Testable Prediction:**");
  });
});

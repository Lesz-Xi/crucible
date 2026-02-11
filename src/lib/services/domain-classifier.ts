import { getClaudeModel } from "../ai/anthropic";
import { safeParseJson } from "../ai/ai-utils";

export interface DomainClassification {
  primary: string;
  confidence: number;
  secondary?: string[];
}

export class DomainClassifier {
  private static readonly DOMAIN_KEYWORDS: Record<string, RegExp> = {
    alignment: /alignment problem|ai alignment|algorithmic bias|data bias|bias propagation|fairness gap|equal opportunity|demographic parity|reward hacking|objective specification|specification error|misalignment|protected attribute|path[- ]specific fairness|shirley card|compas|representation bias|feedback loop bias/i,

    theoretical_neuroscience: /hodgkin[- ]huxley|wilson[- ]cowan|cram[ée]r[- ]rao|fisher information|integrate[- ]and[- ]fire|oja rule|temporal difference|td learning|free energy bound|synaptic plasticity|neural dynamics|membrane potential|cable equation|biophysical substrate|n\\s*=\\s*<\\s*b\\s*,\\s*d\\s*,\\s*i\\s*,\\s*l\\s*>|n\\s*=\\s*⟨\\s*b\\s*,\\s*d\\s*,\\s*i\\s*,\\s*l\\s*⟩/i,

    neuroscience: /brain network|neural topology|small[- ]world|global efficiency|wiring cost|hub vulnerability|dysconnectivity|functional connectivity|adjacency matrix|characteristic path length|graph theoretic|neuroscience|alzheimer|schizophrenia.*network|targeted attack.*hub/i,

    // Legal domain (Phase 28.Legal) - Intent → Action → Harm causal chain
    legal: /defendant|plaintiff|liability|negligence|but[- ]?for|proximate cause|causation|tort|mens rea|intent to|criminal|civil case|lawsuit|court|verdict|damages|harm caused|injury caused|breach of duty|duty of care|foreseeability|intervening cause|superseding cause|comparative fault|strict liability|product liability|wrongful death|personal injury|malpractice|precedent|case law|statute|legal argument/i,
    
    // Educational domain - Learning science, student performance, interventions
    education: /student|learning|study habits|motivation|academic|performance|grades|GPA|tutoring|spaced repetition|active recall|retrieval practice|cognitive load|growth mindset|fixed mindset|deliberate practice|mastery learning|prerequisite|study strategies|educational|lecture|quiz|exam|homework|office hours|peer collaboration|metacognition|self-efficacy|procrastination|learning style|personalized learning|adaptive learning|educational intervention|study skills|test anxiety|academic achievement|study environment|family support.*learning|sleep.*study|retention|flashcard|anki|practice test/i,
    iml: /interpretable machine learning|interpretability|explainability|post-hoc|feature attribution|saliency|partial dependence|shapley|surrogate model|lime|model opacity|causal divergence|confounder|data manifold|extrapolation artifact|sensitivity analysis|interpretation lagrangian|h_stat|h_ml/i,
    
    scaling_laws: /scaling law|geoffrey west|power law|metabolic rate|superlinear|sublinear|carrying capacity|finite\.time\.singularity|kleiber|beta.*0\.75|beta.*1\.15|N\^beta|cities scale|companies scale|innovation cycle|regime|M\^.*3\/4/i,
    cognitive_psychology: /system 1|system 2|heuristic|cognitive bias|prospect theory|loss aversion|reference point|kahneman|WYSIATI|availability heuristic|anchoring|representativeness|thinking fast|dual\.process/i,
    evolutionary_biology: /kin selection|altruism|hamilton|relatedness|inclusive fitness|haplodiploidy|eusocial|selfish gene/i,
    ecology: /ecology|ecosystem|forest|species|predator|prey|mutualism|mycorrhizal|mother tree|fungal network/i,
    physics: /energy|entropy|causal|thermodynamic|mass|time|retrocausation/i
  };

  /**
   * Identifies the causal domain of a question
   */
  async classify(question: string): Promise<DomainClassification> {
    const lower = question.toLowerCase();

    // 1. Fast Keyword Matching
    for (const [domain, pattern] of Object.entries(DomainClassifier.DOMAIN_KEYWORDS)) {
      if (pattern.test(lower)) {
        console.log(`[DomainClassifier] Fast match: ${domain}`);
        return { primary: domain, confidence: 0.9 };
      }
    }

    // 2. LLM Fallback for ambiguous or novel domains
    console.log(`[DomainClassifier] No keyword match, falling back to LLM`);
    return this.llmClassify(question);
  }

  private async llmClassify(question: string): Promise<DomainClassification> {
    const model = getClaudeModel();
    const prompt = `
You are a domain classifier for a causal reasoning engine.
Identify the primary causal domain for the following question.

Available Domains:
- alignment (AI alignment, data representation, algorithmic bias, fairness, reward hacking)
- theoretical_neuroscience (neural dynamics, Hodgkin-Huxley, Wilson-Cowan, Fisher information, Oja/TD/EM learning operators)
- neuroscience (brain networks, neural topology, small-world systems, hub vulnerability)
- legal (Legal causation, tort law, liability, but-for test, proximate cause, criminal/civil cases)
- education (Learning science, student performance, study habits, interventions, personalized learning)
- iml (Interpretable machine learning, explainability, post-hoc operators, causal divergence, manifold constraints)
- scaling_laws (Power laws, West's metabolic theory, etc.)
- cognitive_psychology (Kahneman/Tversky biases, System 1/2)
- evolutionary_biology (Kin selection, Selfish Gene theory)
- ecology (Biological networks, forest systems, predation)
- physics (Conservation of energy, entropy, causality)
- abstract (Logical puzzles, pure causal riddles)

Output JSON:
{
  "primary": "domain_name",
  "confidence": number, // 0-1
  "secondary": ["optional_other_domain"]
}

Question: "${question}"
`;

    try {
      const result = await model.generateContent(prompt);
      return safeParseJson(result.response.text(), {
        primary: "abstract",
        confidence: 0.5
      });
    } catch (error) {
      console.error("[DomainClassifier] LLM Error:", error);
      return { primary: "abstract", confidence: 0.5 };
    }
  }
}

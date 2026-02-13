The honest answer is that your statement is partially true, but rapidly becoming outdated. It accurately describes the limitations of standalone Large Language Models (LLMs) (like standard ChatGPT or Claude), but it is false when applied to the cutting edge of AI Agents and Self-Driving Laboratories.

Here is the breakdown of why this distinction matters and where the technology actually stands.

1. Where Your Statement is True: "The Armchair Philosopher"
If you rely solely on a standard LLM (e.g., asking a chatbot to "design a new battery material"), your critique is 100% correct.

No Empirical Grounding: The model predicts what a valid chemical formula looks like based on text probability, not physical laws. It hallucinates plausible-sounding but physically impossible molecules.

No Persistent Memory: Once you close the chat window, the model forgets the "experiments" you discussed. It does not update its weights based on the conversation.

No Validation: It cannot run a density functional theory (DFT) simulation or mix chemicals to see if it explodes. It is purely an open-loop reasoning engine.

2. Where Your Statement is False: "The Robot Scientist"
In advanced scientific research, AI is no longer just a chatbot; it is the "brain" of a Closed-Loop System (often called a "Self-Driving Lab"). These systems specifically solve the three limitations you listed.

A. They DO learn from past failures (Persistent Memory)
Modern scientific AI uses Agentic Architecture. The AI is connected to a structured database (Long-Term Memory).

How it works: When an AI agent runs an experiment, it records the result (success or failure) in a database. Before proposing a new hypothesis, it queries this database.

Example: If an AI proposes a catalyst that fails to react, it records that failure. The next time it reasons, it retrieves that data point and avoids proposing the same failure again. This is "in-context learning" augmented by external memory (RAG).

B. They DO validate against physical reality (Simulation & Robotics)
AI models in science are now routinely coupled with "Tools"—external software or hardware that the AI can control.

Simulation (In Silico): The AI proposes a molecule, then autonomously writes code to run a physics simulation (like DFT or Molecular Dynamics) to validate stability. If the physics engine says "unstable," the AI discards the hypothesis before telling the human.

Experimentation (In Vivo/Vitro): In "Self-Driving Labs," the AI sends instructions to a liquid-handling robot. The robot mixes the chemicals, captures the result (via spectroscopy or camera), and feeds the data back to the AI.

Real World Proof: Google DeepMind’s GNoME (Graph Networks for Materials Exploration) predicted 2.2 million new crystals. They then used A-Lab (an autonomous robotic lab) to physically synthesize and validate 41 of these new materials without human hands involved.

C. They DO self-improve (Closed-Loop Architecture)
The "Open-loop" critique is being solved by Active Learning.

The AI is not just trained once. It operates in a cycle: Hypothesis -> Experiment -> Result -> Update Model.

As the robot generates real data, the AI fine-tunes a smaller "surrogate model" that becomes increasingly accurate at predicting that specific physical phenomenon. It gets smarter the longer it runs.
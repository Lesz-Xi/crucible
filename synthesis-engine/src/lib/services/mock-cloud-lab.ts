import { LabJob, NovelIdea } from "../../types";

type LabResult = NonNullable<NovelIdea['validationResult']>;

export class MockCloudLab {
  /**
   * Simulates the submission of a LabJob to a remote robotic facility (Emerald Cloud Lab / Opentrons).
   * In reality, this is a stochastic simulator for "In Silico" verification of the "In Vivo" protocol.
   */
  async submitJob(job: LabJob): Promise<LabResult> {
    console.log(`[MockCloudLab] Submitting Job: ${job.job_id} (${job.experiment_name})`);
    
    // 1. Structural Validation
    const validationError = this.validateSchema(job);
    if (validationError) {
      console.error(`[MockCloudLab] Job Rejected: ${validationError}`);
      return {
        success: false,
        error: `Protocol Compliance Failure: ${validationError}`
      };
    }

    // 2. Resource Check (Simulation)
    if (!job.resources.reagents || job.resources.reagents.length === 0) {
       return { success: false, error: "No reagents defined in protocol." };
    }

    // 3. Simulate Execution Latency (1-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // 4. Determine "Physical" Outcome (Stochastic)
    // We simulate a 85% success rate for physical execution if the protocol is valid.
    const executionSuccess = Math.random() > 0.15;

    if (!executionSuccess) {
      return {
        success: false,
        error: "Robotic Execution Failure: Pipette tip jam detected at Step 3."
      };
    }

    // 5. Generate Scientific Metrics
    // Simulate a p-value that might confirm or deny the hypothesis
    // In a real loop, this would come from the 'measure_absorbance' data.
    const mockPValue = Math.random() * 0.1; // Skewed towards significance for demo
    const mockBayesFactor = 1 / (mockPValue + 0.01);

    return {
      success: true,
      metrics: {
        pValue: Number(mockPValue.toFixed(4)),
        bayesFactor: Number(mockBayesFactor.toFixed(2)),
        conclusionValid: mockPValue < 0.05
      }
    };
  }

  private validateSchema(job: LabJob): string | null {
    if (!job.job_id) return "Missing job_id";
    if (!job.steps || job.steps.length === 0) return "No steps defined";
    
    for (const step of job.steps) {
      if (!step.action) return `Step ${step.step_id} missing action`;
      if (!step.parameters) return `Step ${step.step_id} missing parameters`;
      
      // Basic logic check
      if (step.action === 'dispense' && !('volume_ul' in step.parameters)) {
        return `Step ${step.step_id} (dispense) missing volume_ul`;
      }
    }
    
    return null;
  }
}

import { createClient } from '../supabase/client';
import { createHash } from 'crypto';

export type CausalRole = 'observation' | 'intervention' | 'counterfactual';

export interface ExperimentLogInput {
    tool_name: string;
    causal_role: CausalRole;
    input_json: any;
    result_json?: any;
    status: 'pending' | 'success' | 'failure';
    error_message?: string;
    metadata?: any;
}

export interface ExperimentRecord extends ExperimentLogInput {
    id: string;
    user_id: string;
    input_hash: string;
    created_at: string;
}

export class ScientificProvenanceService {
    private static instance: ScientificProvenanceService;

    private constructor() { }

    public static getInstance(): ScientificProvenanceService {
        if (!ScientificProvenanceService.instance) {
            ScientificProvenanceService.instance = new ScientificProvenanceService();
        }
        return ScientificProvenanceService.instance;
    }

    private generateInputHash(input: any): string {
        const canonicalJson = JSON.stringify(input, Object.keys(input).sort());
        return createHash('sha256').update(canonicalJson).digest('hex');
    }

    async logExperiment(log: ExperimentLogInput): Promise<string | null> {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                console.warn('ScientificProvenanceService: No authenticated user. Skipping log.');
                return null;
            }

            const inputHash = this.generateInputHash(log.input_json);

            const { data, error } = await supabase
                .from('lab_experiments')
                .insert({
                    user_id: user.id,
                    tool_name: log.tool_name,
                    causal_role: log.causal_role,
                    input_hash: inputHash,
                    input_json: log.input_json,
                    result_json: log.result_json,
                    status: log.status,
                    error_message: log.error_message,
                    metadata: log.metadata,
                })
                .select('id')
                .single();

            if (error) {
                console.error('ScientificProvenanceService: DB Error', error);
                return null;
            }

            return data.id;
        } catch (err) {
            console.error('ScientificProvenanceService: Unexpected Error', err);
            return null;
        }
    }

    async updateStatus(experimentId: string, status: 'success' | 'failure', result?: any, error?: string): Promise<void> {
        try {
            const supabase = createClient();

            const updatePayload: any = { status };
            if (result) updatePayload.result_json = result;
            if (error) updatePayload.error_message = error;

            const { error: dbError } = await supabase
                .from('lab_experiments')
                .update(updatePayload)
                .eq('id', experimentId);

            if (dbError) {
                console.error('ScientificProvenanceService: Update Error', dbError);
            }
        } catch (err) {
            console.error('ScientificProvenanceService: Update Unexpected Error', err);
        }
    }
}

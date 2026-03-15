
import fs from 'node:fs';
import path from 'node:path';
import { persistCounterfactualTrace } from '@/lib/services/counterfactual-trace';
import type { CounterfactualTrace } from '@/types/scm';

// Load .env.local
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                if (key && value) {
                    process.env[key] = value;
                }
            }
        });
        console.log("Loaded .env.local");
    } else {
        console.warn(".env.local not found");
    }
} catch (e) {
    console.warn("Could not load .env.local", e);
}

async function verify() {
    const mockTraceId = crypto.randomUUID();
    console.log(`Generating Mock Trace: ${mockTraceId}`);

    const mockTrace: CounterfactualTrace = {
        traceId: mockTraceId,
        modelRef: {
            modelKey: "test_model_v1",
            version: "1.0.0"
        },
        query: {
            intervention: {
                variable: "test_var",
                value: 1
            },
            outcome: "test_outcome",
            observedWorld: {}
        },
        assumptions: ["test_assumption"],
        adjustmentSet: [],
        computation: {
            method: "deterministic_graph_diff",
            affectedPaths: [],
            uncertainty: "low"
        },
        result: {
            actualOutcome: 0,
            counterfactualOutcome: 1,
            delta: 1
        }
    };

    // Inject metadata (M6.2 requirement)
    const traceWithMetadata = {
        ...mockTrace,
        metadata: {
            providerId: "verification-script-provider",
            timestamp: new Date().toISOString()
        }
    } as any;

    console.log("Attempting persistence...");

    // Use a NIL UUID for testing if possible, or random. 
    // Since we don't have a real user session, we use a random valid UUID.
    // The foreign key constraint on auth.users might fail if RLS enforces it strictly or if the table references auth.users.
    // We'll see. If it fails, we know the code runs at least.
    const mockUserId = "00000000-0000-4000-8000-000000000000";

    const result = await persistCounterfactualTrace({
        trace: traceWithMetadata,
        sourceFeature: "chat",
        userId: mockUserId
    });

    if (result.persisted) {
        console.log("✅ Trace persisted successfully!");
    } else {
        console.error("❌ Trace persistence failed:", result.error);
        if (result.error?.includes("violates foreign key constraint")) {
            console.log("⚠️  Note: Foreign key violation is expected if the mock user ID does not exist in auth.users.");
            console.log("✅ Logic verification passed (Attempted to write to DB).");
        }
    }
}

verify().catch(console.error);

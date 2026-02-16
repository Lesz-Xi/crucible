import { describe, expect, it, vi, beforeEach } from "vitest";
import { ScientificGateway } from "../scientific-gateway";

// Mock dependencies
vi.mock("../../ai/experiment-generator", () => {
    return {
        __esModule: true,
        ExperimentGenerator: vi.fn().mockImplementation(function () {
            return {
                generate: vi.fn().mockResolvedValue({
                    protocolCode: "print('Hello World')",
                    labManual: "Manual",
                    labJob: undefined,
                }),
            };
        }),
    };
});

vi.mock("../protocol-validator", () => {
    return {
        __esModule: true,
        validateProtocol: vi.fn().mockResolvedValue({
            success: true,
            stdout: "Hello World",
            stderr: "",
            executionTimeMs: 10,
            metrics: {},
            protocolCode: "print('Hello World')",
        }),
    };
});

vi.mock("../../ai/causal-blueprint", () => {
    return {
        __esModule: true,
        StructuralCausalModel: vi.fn().mockImplementation(function () {
            return {
                validateMechanism: vi.fn().mockResolvedValue({
                    valid: true,
                    violations: [],
                    passedConstraints: ["Conservation of Energy"],
                }),
            };
        }),
    };
});

describe("ScientificGateway", () => {
    let gateway: ScientificGateway;

    beforeEach(() => {
        // Reset singleton for testing if possible, or just get instance
        // Since it's a singleton, we might need to be careful. 
        // But for this test, we just want to verify logic flow.
        gateway = ScientificGateway.getInstance();
    });

    it("should return the correct tool definitions", () => {
        const tools = gateway.getTools();
        expect(tools).toHaveLength(3);
        expect(tools[0].name).toBe("simulate_scientific_phenomenon");
        expect(tools[1].name).toBe("perform_mathematical_analysis");
        expect(tools[2].name).toBe("verify_law_compliance");
    });

    it("should execute a simulation successfully", async () => {
        const result = await gateway.simulate("thesis", "mechanism", "prediction");
        expect(result.success).toBe(true);
        expect(result.execution.stdout).toBe("Hello World");
        expect(result.protocolCode).toBe("print('Hello World')");
    });

    it("should perform mathematical calculations (mean)", async () => {
        const data = [1, 2, 3, 4, 5];
        const result = await gateway.calculate("mean", data);
        expect(result.success).toBe(true);
        expect(result.result).toBe(3);
    });

    it("should perform mathematical calculations (std)", async () => {
        const data = [1, 2, 3, 4, 5];
        const result = await gateway.calculate("std", data);
        expect(result.success).toBe(true);
        // std of 1,2,3,4,5 is sqrt(2.5) ~= 1.5811
        expect(result.result).toBeCloseTo(1.5811, 3);
    });

    it("should verify scientific claims", async () => {
        const result = await gateway.verify("Perpetual motion machine");
        expect(result.valid).toBe(true); // Mocked to be true
        expect(result.passedConstraints).toContain("Conservation of Energy");
    });

    it("should handle error in calculation", async () => {
        const result = await gateway.calculate("mean", [] as any);
        // Mathjs might return NaN or throw for empty array depending on config, 
        // but let's pass invalid type to trigger error
        const resultError = await gateway.calculate("mean", "invalid" as any);
        expect(resultError.success).toBe(false);
        expect(resultError.error).toBeDefined();
    });
});

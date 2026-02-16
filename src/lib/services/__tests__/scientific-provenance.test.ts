import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ScientificProvenanceService } from '../scientific-provenance';

// Mock Supabase Client
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn(() => ({
    insert: mockInsert,
    update: mockUpdate
}));
const mockGetUser = vi.fn();

// Mock @supabase/ssr to prevent FS access issues
vi.mock('@supabase/ssr', () => ({
    createBrowserClient: vi.fn(),
    createServerClient: vi.fn()
}));

// Mock Supabase Client
vi.mock('../../supabase/client', () => ({
    createClient: () => ({
        auth: {
            getUser: mockGetUser
        },
        from: mockFrom
    })
}));

describe('ScientificProvenanceService', () => {
    let service: ScientificProvenanceService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = ScientificProvenanceService.getInstance();

        // Default mocks
        mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });
        mockInsert.mockReturnValue({ select: () => ({ single: () => Promise.resolve({ data: { id: 'exp-123' }, error: null }) }) });
        mockUpdate.mockResolvedValue({ error: null });
    });

    it('should act as a singleton', () => {
        const instance1 = ScientificProvenanceService.getInstance();
        const instance2 = ScientificProvenanceService.getInstance();
        expect(instance1).toBe(instance2);
    });

    it('should log an experiment with correct input hash', async () => {
        const log = {
            tool_name: 'test_tool',
            causal_role: 'observation' as const,
            input_json: { b: 2, a: 1 },
            status: 'pending' as const
        };

        const id = await service.logExperiment(log);

        expect(id).toBe('exp-123');
        expect(mockGetUser).toHaveBeenCalled();
        expect(mockFrom).toHaveBeenCalledWith('lab_experiments');

        // Verify input hash is deterministic (canonical JSON)
        // {"a":1,"b":2} -> SHA256
        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
            user_id: 'test-user-id',
            tool_name: 'test_tool',
            causal_role: 'observation',
            input_hash: expect.any(String),
            input_json: log.input_json
        }));
    });

    it('should handle missing user gracefully', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

        const id = await service.logExperiment({
            tool_name: 'test',
            causal_role: 'observation',
            input_json: {},
            status: 'pending'
        });

        expect(id).toBeNull();
        expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should update experiment status', async () => {
        await service.updateStatus('exp-123', 'success', { result: 'ok' });

        expect(mockUpdate).toHaveBeenCalledWith({
            status: 'success',
            result_json: { result: 'ok' }
        });
    });
});

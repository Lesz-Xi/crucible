// =============================================================
// Bio-Computation Lab: Persistence Service
// Phase 1 - Production Foundation
// =============================================================

import { createClient } from '../supabase/client';
import {
    LabExperiment,
    LabPersistenceConfig,
    OfflineQueueItem,
    LabErrorCode,
    LabError
} from '../../types/lab';
import { createHash } from 'crypto';

// Default configuration
const DEFAULT_CONFIG: LabPersistenceConfig = {
    autoSave: true,
    syncInterval: 30000, // 30 seconds
    maxRetries: 3,
    offlineQueueSize: 100,
};

// Storage keys
const OFFLINE_QUEUE_KEY = 'lab_offline_queue';
const PENDING_EXPERIMENTS_KEY = 'lab_pending_experiments';

/**
 * LabPersistenceService
 * 
 * Handles all persistence operations for the Bio-Computation Lab:
 * - CRUD operations for experiments
 * - Offline queue management
 * - Real-time sync with Supabase
 * - Input hashing for determinism
 */
export class LabPersistenceService {
    private static instance: LabPersistenceService;
    private config: LabPersistenceConfig;
    private syncTimer: NodeJS.Timeout | null = null;
    private isOnline: boolean = true;

    private constructor(config: Partial<LabPersistenceConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.setupOnlineListener();
    }

    public static getInstance(config?: Partial<LabPersistenceConfig>): LabPersistenceService {
        if (!LabPersistenceService.instance) {
            LabPersistenceService.instance = new LabPersistenceService(config);
        }
        return LabPersistenceService.instance;
    }

    // =============================================================
    // Online/Offline Management
    // =============================================================

    private setupOnlineListener(): void {
        if (typeof window !== 'undefined') {
            this.isOnline = navigator.onLine;

            window.addEventListener('online', () => {
                this.isOnline = true;
                this.syncOfflineQueue();
            });

            window.addEventListener('offline', () => {
                this.isOnline = false;
            });
        }
    }

    public isOffline(): boolean {
        return !this.isOnline;
    }

    // =============================================================
    // Input Hashing (Determinism)
    // =============================================================

    public generateInputHash(input: unknown): string {
        const canonicalJson = JSON.stringify(input, Object.keys(input as object).sort());
        return createHash('sha256').update(canonicalJson).digest('hex');
    }

    // =============================================================
    // CRUD Operations
    // =============================================================

    /**
     * Create a new experiment record
     */
    async createExperiment(
        toolName: LabExperiment['tool_name'],
        causalRole: LabExperiment['causal_role'],
        inputJson: LabExperiment['input_json'],
        metadata?: Record<string, unknown>
    ): Promise<{ success: boolean; data?: LabExperiment; error?: LabError }> {
        const supabase = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return {
                    success: false,
                    error: {
                        code: LabErrorCode.UNAUTHORIZED,
                        message: 'No authenticated user found',
                        timestamp: new Date().toISOString(),
                        recoverable: false,
                    },
                };
            }

            const inputHash = this.generateInputHash(inputJson);
            const experiment: Omit<LabExperiment, 'id' | 'created_at'> = {
                user_id: user.id,
                tool_name: toolName,
                causal_role: causalRole,
                input_hash: inputHash,
                input_json: inputJson,
                status: 'pending',
                metadata,
            };

            // If offline, add to queue
            if (this.isOffline()) {
                const queuedItem = this.addToOfflineQueue({
                    action: 'create',
                    data: experiment,
                });

                // Return a temporary local experiment
                return {
                    success: true,
                    data: {
                        id: queuedItem.id,
                        ...experiment,
                        created_at: queuedItem.timestamp,
                    } as LabExperiment,
                };
            }

            // Online - save directly
            const { data, error } = await supabase
                .from('lab_experiments')
                .insert(experiment)
                .select()
                .single();

            if (error) {
                console.error('LabPersistenceService: Create Error', error);
                return {
                    success: false,
                    error: {
                        code: LabErrorCode.SAVE_FAILED,
                        message: error.message,
                        details: error,
                        timestamp: new Date().toISOString(),
                        recoverable: true,
                    },
                };
            }

            return { success: true, data: data as LabExperiment };
        } catch (err) {
            console.error('LabPersistenceService: Unexpected Error', err);
            return {
                success: false,
                error: {
                    code: LabErrorCode.UNKNOWN,
                    message: String(err),
                    timestamp: new Date().toISOString(),
                    recoverable: true,
                },
            };
        }
    }

    /**
     * Update an existing experiment
     */
    async updateExperiment(
        experimentId: string,
        updates: Partial<Pick<LabExperiment, 'status' | 'result_json' | 'error_message' | 'metadata'>>
    ): Promise<{ success: boolean; error?: LabError }> {
        const supabase = createClient();

        try {
            // If offline, add to queue
            if (this.isOffline()) {
                this.addToOfflineQueue({
                    action: 'update',
                    data: { id: experimentId, ...updates },
                });
                return { success: true };
            }

            const { error } = await supabase
                .from('lab_experiments')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', experimentId);

            if (error) {
                console.error('LabPersistenceService: Update Error', error);
                return {
                    success: false,
                    error: {
                        code: LabErrorCode.SAVE_FAILED,
                        message: error.message,
                        details: error,
                        timestamp: new Date().toISOString(),
                        recoverable: true,
                    },
                };
            }

            return { success: true };
        } catch (err) {
            console.error('LabPersistenceService: Update Unexpected Error', err);
            return {
                success: false,
                error: {
                    code: LabErrorCode.UNKNOWN,
                    message: String(err),
                    timestamp: new Date().toISOString(),
                    recoverable: true,
                },
            };
        }
    }

    /**
     * Get all experiments for the current user
     */
    async getExperiments(
        options: {
            limit?: number;
            offset?: number;
            toolName?: LabExperiment['tool_name'];
            status?: LabExperiment['status'];
        } = {}
    ): Promise<{ success: boolean; data?: LabExperiment[]; error?: LabError }> {
        const supabase = createClient();
        const { limit = 50, offset = 0, toolName, status } = options;

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return {
                    success: false,
                    error: {
                        code: LabErrorCode.UNAUTHORIZED,
                        message: 'No authenticated user found',
                        timestamp: new Date().toISOString(),
                        recoverable: false,
                    },
                };
            }

            let query = supabase
                .from('lab_experiments')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (toolName) {
                query = query.eq('tool_name', toolName);
            }

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;

            if (error) {
                console.error('LabPersistenceService: Get Error', error);
                return {
                    success: false,
                    error: {
                        code: LabErrorCode.LOAD_FAILED,
                        message: error.message,
                        details: error,
                        timestamp: new Date().toISOString(),
                        recoverable: true,
                    },
                };
            }

            return { success: true, data: data as LabExperiment[] };
        } catch (err) {
            console.error('LabPersistenceService: Get Unexpected Error', err);
            return {
                success: false,
                error: {
                    code: LabErrorCode.UNKNOWN,
                    message: String(err),
                    timestamp: new Date().toISOString(),
                    recoverable: true,
                },
            };
        }
    }

    /**
     * Get a single experiment by ID
     */
    async getExperiment(
        experimentId: string
    ): Promise<{ success: boolean; data?: LabExperiment; error?: LabError }> {
        const supabase = createClient();

        try {
            const { data, error } = await supabase
                .from('lab_experiments')
                .select('*')
                .eq('id', experimentId)
                .single();

            if (error) {
                console.error('LabPersistenceService: Get Single Error', error);
                return {
                    success: false,
                    error: {
                        code: LabErrorCode.LOAD_FAILED,
                        message: error.message,
                        details: error,
                        timestamp: new Date().toISOString(),
                        recoverable: true,
                    },
                };
            }

            return { success: true, data: data as LabExperiment };
        } catch (err) {
            console.error('LabPersistenceService: Get Single Unexpected Error', err);
            return {
                success: false,
                error: {
                    code: LabErrorCode.UNKNOWN,
                    message: String(err),
                    timestamp: new Date().toISOString(),
                    recoverable: true,
                },
            };
        }
    }

    /**
     * Delete an experiment
     */
    async deleteExperiment(
        experimentId: string
    ): Promise<{ success: boolean; error?: LabError }> {
        const supabase = createClient();

        try {
            const { error } = await supabase
                .from('lab_experiments')
                .delete()
                .eq('id', experimentId);

            if (error) {
                console.error('LabPersistenceService: Delete Error', error);
                return {
                    success: false,
                    error: {
                        code: LabErrorCode.SAVE_FAILED,
                        message: error.message,
                        details: error,
                        timestamp: new Date().toISOString(),
                        recoverable: true,
                    },
                };
            }

            return { success: true };
        } catch (err) {
            console.error('LabPersistenceService: Delete Unexpected Error', err);
            return {
                success: false,
                error: {
                    code: LabErrorCode.UNKNOWN,
                    message: String(err),
                    timestamp: new Date().toISOString(),
                    recoverable: true,
                },
            };
        }
    }

    // =============================================================
    // Offline Queue Management
    // =============================================================

    private getOfflineQueue(): OfflineQueueItem[] {
        if (typeof window === 'undefined') return [];

        try {
            const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    private saveOfflineQueue(queue: OfflineQueueItem[]): void {
        if (typeof window === 'undefined') return;

        // Enforce queue size limit
        if (queue.length > this.config.offlineQueueSize) {
            queue = queue.slice(-this.config.offlineQueueSize);
        }

        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    }

    private addToOfflineQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>): OfflineQueueItem {
        const queueItem: OfflineQueueItem = {
            id: crypto.randomUUID(),
            ...item,
            timestamp: new Date().toISOString(),
            retryCount: 0,
        };

        const queue = this.getOfflineQueue();
        queue.push(queueItem);
        this.saveOfflineQueue(queue);

        return queueItem;
    }

    /**
     * Sync offline queue with server
     */
    async syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
        if (this.isOffline()) {
            return { synced: 0, failed: 0 };
        }

        const queue = this.getOfflineQueue();
        if (queue.length === 0) {
            return { synced: 0, failed: 0 };
        }

        let synced = 0;
        let failed = 0;
        const remaining: OfflineQueueItem[] = [];

        for (const item of queue) {
            if (item.retryCount >= this.config.maxRetries) {
                failed++;
                continue;
            }

            try {
                if (item.action === 'create') {
                    const result = await this.createExperiment(
                        item.data.tool_name!,
                        item.data.causal_role!,
                        item.data.input_json!,
                        item.data.metadata
                    );

                    if (result.success) {
                        synced++;
                    } else {
                        item.retryCount++;
                        remaining.push(item);
                    }
                } else if (item.action === 'update') {
                    const result = await this.updateExperiment(
                        item.data.id!,
                        item.data as any
                    );

                    if (result.success) {
                        synced++;
                    } else {
                        item.retryCount++;
                        remaining.push(item);
                    }
                }
            } catch (err) {
                item.retryCount++;
                remaining.push(item);
            }
        }

        this.saveOfflineQueue(remaining);
        return { synced, failed };
    }

    /**
     * Clear the offline queue
     */
    clearOfflineQueue(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(OFFLINE_QUEUE_KEY);
        }
    }

    // =============================================================
    // Real-time Subscriptions
    // =============================================================

    /**
     * Subscribe to experiment changes
     */
    subscribeToExperiments(
        callback: (payload: { eventType: string; new: LabExperiment; old: LabExperiment | null }) => void
    ): { unsubscribe: () => void } | null {
        const supabase = createClient();

        try {
            const channel = supabase
                .channel('lab_experiments_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'lab_experiments',
                    },
                    (payload) => {
                        callback({
                            eventType: payload.eventType,
                            new: payload.new as LabExperiment,
                            old: payload.old as LabExperiment | null,
                        });
                    }
                )
                .subscribe();

            return {
                unsubscribe: () => {
                    supabase.removeChannel(channel);
                },
            };
        } catch (err) {
            console.error('LabPersistenceService: Subscription Error', err);
            return null;
        }
    }

    // =============================================================
    // Utility Methods
    // =============================================================

    /**
     * Check for duplicate experiments (same input hash)
     */
    async checkDuplicate(
        inputJson: unknown
    ): Promise<{ isDuplicate: boolean; existingExperiment?: LabExperiment }> {
        const supabase = createClient();
        const inputHash = this.generateInputHash(inputJson);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { isDuplicate: false };

            const { data } = await supabase
                .from('lab_experiments')
                .select('*')
                .eq('user_id', user.id)
                .eq('input_hash', inputHash)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (data) {
                return { isDuplicate: true, existingExperiment: data as LabExperiment };
            }

            return { isDuplicate: false };
        } catch {
            return { isDuplicate: false };
        }
    }

    /**
     * Get experiment statistics for the current user
     */
    async getStatistics(): Promise<{
        total: number;
        byTool: Record<string, number>;
        byStatus: Record<string, number>;
        byCausalRole: Record<string, number>;
    } | null> {
        const supabase = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data } = await supabase
                .from('lab_experiments')
                .select('tool_name, status, causal_role')
                .eq('user_id', user.id);

            if (!data) return null;

            const stats = {
                total: data.length,
                byTool: {} as Record<string, number>,
                byStatus: {} as Record<string, number>,
                byCausalRole: {} as Record<string, number>,
            };

            for (const exp of data) {
                stats.byTool[exp.tool_name] = (stats.byTool[exp.tool_name] || 0) + 1;
                stats.byStatus[exp.status] = (stats.byStatus[exp.status] || 0) + 1;
                stats.byCausalRole[exp.causal_role] = (stats.byCausalRole[exp.causal_role] || 0) + 1;
            }

            return stats;
        } catch {
            return null;
        }
    }
}

// Export singleton getter
export const getLabPersistence = () => LabPersistenceService.getInstance();
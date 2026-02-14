// =============================================================
// Automated Scientist: Scientific Data Repository
// Phase A — Data Foundations
// CRUD operations for document_ingestions, extracted_tables,
// scientific_data_points, and compute_runs.
// =============================================================

import { createServerSupabaseClient } from "../supabase/server";
import {
    DocumentIngestion,
    CreateIngestionInput,
    ExtractedTable,
    CreateExtractedTableInput,
    ScientificDataPoint,
    CreateDataPointInput,
    ComputeRun,
    CreateComputeRunInput,
    IngestionStatus,
} from "../../types/scientific-data";

// ── Helpers ──────────────────────────────────────────────────

function mapIngestionRow(row: Record<string, unknown>): DocumentIngestion {
    return {
        id: row.id as string,
        userId: row.user_id as string,
        fileName: row.file_name as string,
        fileHashSha256: row.file_hash_sha256 as string,
        fileSizeBytes: row.file_size_bytes as number | undefined,
        status: row.status as IngestionStatus,
        ingestionVersion: row.ingestion_version as number,
        errorMessage: row.error_message as string | undefined,
        pageCount: row.page_count as number | undefined,
        metadata: row.metadata_jsonb as Record<string, unknown> | undefined,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    };
}

function mapTableRow(row: Record<string, unknown>): ExtractedTable {
    return {
        id: row.id as string,
        ingestionId: row.ingestion_id as string,
        pageNumber: row.page_number as number,
        tableIndex: row.table_index as number,
        headers: (row.headers_jsonb as string[]) || [],
        rows: (row.rows_jsonb as string[][]) || [],
        confidence: row.confidence as number,
        parseStatus: row.parse_status as ExtractedTable["parseStatus"],
        qaFlags: (row.qa_flags_jsonb as string[]) || [],
        createdAt: row.created_at as string,
    };
}

function mapDataPointRow(row: Record<string, unknown>): ScientificDataPoint {
    return {
        id: row.id as string,
        ingestionId: row.ingestion_id as string | undefined,
        sourceTableId: row.source_table_id as string | undefined,
        variableXName: row.variable_x_name as string,
        variableYName: row.variable_y_name as string,
        xValue: row.x_value as number,
        yValue: row.y_value as number,
        unitX: row.unit_x as string | undefined,
        unitY: row.unit_y as string | undefined,
        metadata: row.metadata_jsonb as Record<string, unknown> | undefined,
        createdAt: row.created_at as string,
    };
}

function mapComputeRunRow(row: Record<string, unknown>): ComputeRun {
    return {
        id: row.id as string,
        ingestionId: row.ingestion_id as string | undefined,
        method: row.method as string,
        methodVersion: row.method_version as string,
        params: (row.params_jsonb as Record<string, unknown>) || {},
        result: (row.result_jsonb as Record<string, unknown>) || {},
        deterministicHash: row.deterministic_hash as string,
        createdBy: row.created_by as string | undefined,
        createdAt: row.created_at as string,
    };
}

// ── Repository ───────────────────────────────────────────────

export class ScientificDataRepository {

    // ── Document Ingestions ──────────────────────────────────

    /**
     * Create a new ingestion record. Returns existing if same hash+version exists (idempotent).
     */
    async createIngestion(
        input: CreateIngestionInput,
        userId: string
    ): Promise<DocumentIngestion | null> {
        try {
            const supabase = await createServerSupabaseClient();

            // Check for existing ingestion with same hash (idempotent)
            const { data: existing } = await supabase
                .from("document_ingestions")
                .select("*")
                .eq("user_id", userId)
                .eq("file_hash_sha256", input.fileHashSha256)
                .order("ingestion_version", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (existing) {
                console.log(
                    `[ScientificDataRepo] Existing ingestion found for hash ${input.fileHashSha256.slice(0, 12)}... (v${existing.ingestion_version})`
                );
                return mapIngestionRow(existing);
            }

            const { data, error } = await supabase
                .from("document_ingestions")
                .insert({
                    user_id: userId,
                    file_name: input.fileName,
                    file_hash_sha256: input.fileHashSha256,
                    file_size_bytes: input.fileSizeBytes ?? null,
                    status: "pending",
                    ingestion_version: 1,
                    page_count: input.pageCount ?? null,
                    metadata_jsonb: input.metadata ?? {},
                })
                .select()
                .single();

            if (error) {
                console.error("[ScientificDataRepo] Failed to create ingestion:", error);
                return null;
            }

            return mapIngestionRow(data);
        } catch (err) {
            console.error("[ScientificDataRepo] createIngestion error:", err);
            return null;
        }
    }

    /**
     * Update ingestion status (e.g., pending → processing → completed/failed).
     */
    async updateIngestionStatus(
        ingestionId: string,
        status: IngestionStatus,
        errorMessage?: string
    ): Promise<boolean> {
        try {
            const supabase = await createServerSupabaseClient();
            const update: Record<string, unknown> = {
                status,
                updated_at: new Date().toISOString(),
            };
            if (errorMessage !== undefined) {
                update.error_message = errorMessage;
            }

            const { error } = await supabase
                .from("document_ingestions")
                .update(update)
                .eq("id", ingestionId);

            if (error) {
                console.error("[ScientificDataRepo] Failed to update status:", error);
                return false;
            }
            return true;
        } catch (err) {
            console.error("[ScientificDataRepo] updateIngestionStatus error:", err);
            return false;
        }
    }

    /**
     * Get ingestion by ID.
     */
    async getIngestion(ingestionId: string): Promise<DocumentIngestion | null> {
        try {
            const supabase = await createServerSupabaseClient();
            const { data, error } = await supabase
                .from("document_ingestions")
                .select("*")
                .eq("id", ingestionId)
                .single();

            if (error || !data) return null;
            return mapIngestionRow(data);
        } catch (err) {
            console.error("[ScientificDataRepo] getIngestion error:", err);
            return null;
        }
    }

    /**
     * List ingestions for a user.
     */
    async listIngestions(
        userId: string,
        limit = 20
    ): Promise<DocumentIngestion[]> {
        try {
            const supabase = await createServerSupabaseClient();
            const { data, error } = await supabase
                .from("document_ingestions")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(limit);

            if (error) {
                console.error("[ScientificDataRepo] listIngestions error:", error);
                return [];
            }
            return (data || []).map(mapIngestionRow);
        } catch (err) {
            console.error("[ScientificDataRepo] listIngestions error:", err);
            return [];
        }
    }

    // ── Extracted Tables ────────────────────────────────────

    /**
     * Save extracted tables for an ingestion.
     */
    async saveExtractedTables(
        tables: CreateExtractedTableInput[]
    ): Promise<ExtractedTable[]> {
        if (tables.length === 0) return [];

        try {
            const supabase = await createServerSupabaseClient();
            const rows = tables.map((t) => ({
                ingestion_id: t.ingestionId,
                page_number: t.pageNumber,
                table_index: t.tableIndex,
                headers_jsonb: t.headers,
                rows_jsonb: t.rows,
                confidence: t.confidence,
                parse_status: t.parseStatus,
                qa_flags_jsonb: t.qaFlags ?? [],
            }));

            const { data, error } = await supabase
                .from("extracted_tables")
                .insert(rows)
                .select();

            if (error) {
                console.error("[ScientificDataRepo] saveExtractedTables error:", error);
                return [];
            }
            return (data || []).map(mapTableRow);
        } catch (err) {
            console.error("[ScientificDataRepo] saveExtractedTables error:", err);
            return [];
        }
    }

    /**
     * Get extracted tables for an ingestion, optionally filtered by confidence threshold.
     */
    async getExtractedTables(
        ingestionId: string,
        minConfidence = 0.0
    ): Promise<ExtractedTable[]> {
        try {
            const supabase = await createServerSupabaseClient();
            const { data, error } = await supabase
                .from("extracted_tables")
                .select("*")
                .eq("ingestion_id", ingestionId)
                .gte("confidence", minConfidence)
                .order("page_number", { ascending: true })
                .order("table_index", { ascending: true });

            if (error) {
                console.error("[ScientificDataRepo] getExtractedTables error:", error);
                return [];
            }
            return (data || []).map(mapTableRow);
        } catch (err) {
            console.error("[ScientificDataRepo] getExtractedTables error:", err);
            return [];
        }
    }

    // ── Scientific Data Points ──────────────────────────────

    /**
     * Save data points (batch insert).
     */
    async saveDataPoints(
        points: CreateDataPointInput[]
    ): Promise<ScientificDataPoint[]> {
        if (points.length === 0) return [];

        try {
            const supabase = await createServerSupabaseClient();
            const rows = points.map((p) => ({
                ingestion_id: p.ingestionId ?? null,
                source_table_id: p.sourceTableId ?? null,
                variable_x_name: p.variableXName,
                variable_y_name: p.variableYName,
                x_value: p.xValue,
                y_value: p.yValue,
                unit_x: p.unitX ?? null,
                unit_y: p.unitY ?? null,
                metadata_jsonb: p.metadata ?? {},
            }));

            const { data, error } = await supabase
                .from("scientific_data_points")
                .insert(rows)
                .select();

            if (error) {
                console.error("[ScientificDataRepo] saveDataPoints error:", error);
                return [];
            }
            return (data || []).map(mapDataPointRow);
        } catch (err) {
            console.error("[ScientificDataRepo] saveDataPoints error:", err);
            return [];
        }
    }

    /**
     * Get data points for an ingestion.
     */
    async getDataPoints(ingestionId: string): Promise<ScientificDataPoint[]> {
        try {
            const supabase = await createServerSupabaseClient();
            const { data, error } = await supabase
                .from("scientific_data_points")
                .select("*")
                .eq("ingestion_id", ingestionId)
                .order("created_at", { ascending: true });

            if (error) {
                console.error("[ScientificDataRepo] getDataPoints error:", error);
                return [];
            }
            return (data || []).map(mapDataPointRow);
        } catch (err) {
            console.error("[ScientificDataRepo] getDataPoints error:", err);
            return [];
        }
    }

    // ── Compute Runs ────────────────────────────────────────

    /**
     * Save a compute run with deterministic hash for reproducibility audit.
     */
    async saveComputeRun(
        input: CreateComputeRunInput,
        userId: string
    ): Promise<ComputeRun | null> {
        try {
            const supabase = await createServerSupabaseClient();
            const { data, error } = await supabase
                .from("compute_runs")
                .insert({
                    ingestion_id: input.ingestionId ?? null,
                    method: input.method,
                    method_version: input.methodVersion,
                    params_jsonb: input.params,
                    result_jsonb: input.result,
                    deterministic_hash: input.deterministicHash,
                    created_by: userId,
                })
                .select()
                .single();

            if (error) {
                console.error("[ScientificDataRepo] saveComputeRun error:", error);
                return null;
            }
            return mapComputeRunRow(data);
        } catch (err) {
            console.error("[ScientificDataRepo] saveComputeRun error:", err);
            return null;
        }
    }

    /**
     * Get compute runs for an ingestion.
     */
    async getComputeRuns(ingestionId: string): Promise<ComputeRun[]> {
        try {
            const supabase = await createServerSupabaseClient();
            const { data, error } = await supabase
                .from("compute_runs")
                .select("*")
                .eq("ingestion_id", ingestionId)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("[ScientificDataRepo] getComputeRuns error:", error);
                return [];
            }
            return (data || []).map(mapComputeRunRow);
        } catch (err) {
            console.error("[ScientificDataRepo] getComputeRuns error:", err);
            return [];
        }
    }

    /**
     * Check if a compute run with given deterministic hash already exists (for caching).
     */
    async findComputeRunByHash(hash: string): Promise<ComputeRun | null> {
        try {
            const supabase = await createServerSupabaseClient();
            const { data, error } = await supabase
                .from("compute_runs")
                .select("*")
                .eq("deterministic_hash", hash)
                .limit(1)
                .maybeSingle();

            if (error || !data) return null;
            return mapComputeRunRow(data);
        } catch (err) {
            console.error("[ScientificDataRepo] findComputeRunByHash error:", err);
            return null;
        }
    }
}

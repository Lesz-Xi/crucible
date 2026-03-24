import { createServerSupabaseAdminClient } from "@/lib/supabase/server-admin";

export interface EpistemicScientificEvidence {
  ingestionId: string;
  fileName: string;
  createdAt: string;
  dataPointCount: number;
  trustedTableCount: number;
  computeRunId?: string;
}

export async function getRecentScientificEvidence(
  userId: string,
  limit = 5,
): Promise<EpistemicScientificEvidence[]> {
  const supabase = createServerSupabaseAdminClient();

  const { data: ingestions, error: ingestionError } = await supabase
    .from("document_ingestions")
    .select("id, file_name, created_at")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (ingestionError) {
    throw new Error(`Failed to fetch ingestions: ${ingestionError.message}`);
  }

  const ingestionIds = (ingestions || []).map((row) => row.id as string);
  if (ingestionIds.length === 0) return [];

  const [{ data: dataPoints, error: pointError }, { data: tables, error: tableError }, { data: runs, error: runError }] = await Promise.all([
    supabase.from("scientific_data_points").select("id, ingestion_id").in("ingestion_id", ingestionIds),
    supabase
      .from("extracted_tables")
      .select("id, ingestion_id, confidence")
      .in("ingestion_id", ingestionIds)
      .gte("confidence", 0.6),
    supabase
      .from("compute_runs")
      .select("id, ingestion_id, created_at")
      .in("ingestion_id", ingestionIds)
      .order("created_at", { ascending: false }),
  ]);

  if (pointError) throw new Error(`Failed to fetch data points: ${pointError.message}`);
  if (tableError) throw new Error(`Failed to fetch tables: ${tableError.message}`);
  if (runError) throw new Error(`Failed to fetch compute runs: ${runError.message}`);

  const pointCountByIngestion = new Map<string, number>();
  for (const row of dataPoints || []) {
    const id = row.ingestion_id as string;
    pointCountByIngestion.set(id, (pointCountByIngestion.get(id) || 0) + 1);
  }

  const trustedTableCountByIngestion = new Map<string, number>();
  for (const row of tables || []) {
    const id = row.ingestion_id as string;
    trustedTableCountByIngestion.set(id, (trustedTableCountByIngestion.get(id) || 0) + 1);
  }

  const runIdByIngestion = new Map<string, string>();
  for (const row of runs || []) {
    const id = row.ingestion_id as string;
    if (!runIdByIngestion.has(id)) {
      runIdByIngestion.set(id, row.id as string);
    }
  }

  return (ingestions || []).map((row) => ({
    ingestionId: row.id as string,
    fileName: row.file_name as string,
    createdAt: row.created_at as string,
    dataPointCount: pointCountByIngestion.get(row.id as string) || 0,
    trustedTableCount: trustedTableCountByIngestion.get(row.id as string) || 0,
    computeRunId: runIdByIngestion.get(row.id as string),
  }));
}

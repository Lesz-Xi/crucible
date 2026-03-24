import type { AlignmentAuditReport } from "@/types/alignment";

export interface AlignmentAuditReportRow {
  id: string;
  model_key: string;
  model_version: string;
  scope: string;
  source: string;
  created_at: string;
  report_json: AlignmentAuditReport;
}

export interface LatestAlignmentAuditReport {
  id: string;
  modelKey: string;
  modelVersion: string;
  scope: string;
  source: string;
  createdAt: string;
  report: AlignmentAuditReport;
}

export function selectLatestAlignmentAuditReport(
  rows: AlignmentAuditReportRow[] | null | undefined
): LatestAlignmentAuditReport | null {
  if (!rows || rows.length === 0) return null;

  const [latest] = [...rows].sort((a, b) => {
    const t1 = Date.parse(a.created_at);
    const t2 = Date.parse(b.created_at);
    return t2 - t1;
  });

  return {
    id: latest.id,
    modelKey: latest.model_key,
    modelVersion: latest.model_version,
    scope: latest.scope,
    source: latest.source,
    createdAt: latest.created_at,
    report: latest.report_json,
  };
}

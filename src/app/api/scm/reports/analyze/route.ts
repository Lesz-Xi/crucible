import type { NextRequest } from "next/server";
import { POST as analyzeReportsPOST } from "@/app/api/reports/analyze/route";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return analyzeReportsPOST(req);
}

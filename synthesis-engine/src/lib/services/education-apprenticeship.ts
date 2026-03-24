import { ApprenticeshipSession, ApprenticeshipWeekProgress } from "@/types/education";

export function getCurrentWeekStartIso(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0 (Sun) ... 6 (Sat)
  const distanceToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() + distanceToMonday);
  return monday.toISOString().slice(0, 10);
}

export function mapApprenticeshipSession(row: any): ApprenticeshipSession {
  return {
    id: row.id,
    planId: row.plan_id,
    userId: row.user_id,
    sessionNumber: row.session_number,
    weekStart: row.week_start,
    durationMinutes: row.duration_minutes,
    status: row.status,
    focusNode: row.focus_node,
    interventionName: row.intervention_name,
    intentNote: row.intent_note,
    mood: row.mood,
    reflectionNote: row.reflection_note,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function buildWeekProgress(
  weekStart: string,
  sessions: ApprenticeshipSession[]
): ApprenticeshipWeekProgress {
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === "completed").length;
  const pendingSessions = sessions.filter((s) => s.status !== "completed").length;

  return {
    weekStart,
    totalSessions,
    completedSessions,
    pendingSessions,
    completionRate: totalSessions === 0 ? 0 : completedSessions / totalSessions,
  };
}

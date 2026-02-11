import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  HistoryImportSummary,
  ImportDomainSummary,
  ImportRecordEnvelope,
  LocalHistoryExport,
} from '@/types/history-import';

function emptyDomainSummary(domain: ImportDomainSummary['domain'], attempted: number): ImportDomainSummary {
  return {
    domain,
    attempted,
    imported: 0,
    skipped: 0,
    errors: [],
  };
}

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
}

function readExternalId(record: ImportRecordEnvelope<unknown>): string {
  return String(record.externalImportId || '').trim();
}

export async function POST(request: NextRequest) {
  const startedAt = new Date().toISOString();

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await request.json()) as LocalHistoryExport;

    if (!payload || !payload.domains || typeof payload.sourceVersion !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid import payload' }, { status: 400 });
    }

    const existingJob = await supabase
      .from('history_import_jobs')
      .select('id, status, summary_json')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .limit(1)
      .maybeSingle();

    if (existingJob.data?.id) {
      return NextResponse.json({
        success: true,
        imported: false,
        reason: 'already_imported',
        summary: existingJob.data.summary_json,
      });
    }

    const { data: jobRow, error: jobError } = await supabase
      .from('history_import_jobs')
      .insert({
        user_id: user.id,
        status: 'running',
        started_at: startedAt,
        source_version: payload.sourceVersion,
        summary_json: {},
      })
      .select('id')
      .single();

    if (jobError || !jobRow?.id) {
      return NextResponse.json({ success: false, error: 'Failed to create import job' }, { status: 500 });
    }

    const domainSummaries: ImportDomainSummary[] = [];

    // CHAT IMPORT
    const chatRecords = Array.isArray(payload.domains.chat) ? payload.domains.chat : [];
    const chatSummary = emptyDomainSummary('chat', chatRecords.length);

    for (const row of chatRecords) {
      const externalId = readExternalId(row);
      if (!externalId) {
        chatSummary.skipped += 1;
        chatSummary.errors.push('chat row missing externalImportId');
        continue;
      }

      const sessionInsert = await supabase
        .from('causal_chat_sessions')
        .upsert(
          {
            user_id: user.id,
            title: row.payload.title,
            updated_at: row.payload.updatedAt || new Date().toISOString(),
            legacy_client_token: row.payload.legacyClientToken || null,
            external_import_id: externalId,
          },
          { onConflict: 'external_import_id' }
        )
        .select('id')
        .single();

      if (sessionInsert.error || !sessionInsert.data?.id) {
        chatSummary.skipped += 1;
        chatSummary.errors.push(sessionInsert.error?.message || `chat session failed: ${externalId}`);
        continue;
      }

      const sessionId = sessionInsert.data.id;
      const messages = Array.isArray(row.payload.messages) ? row.payload.messages : [];

      for (const message of messages) {
        const messageExternalId = `${externalId}:${message.role}:${message.createdAt || 'na'}:${message.content.slice(0, 24)}`;

        const insertMessage = await supabase
          .from('causal_chat_messages')
          .upsert(
            {
              session_id: sessionId,
              role: message.role,
              content: message.content,
              external_import_id: messageExternalId,
            },
            { onConflict: 'external_import_id' }
          );

        if (insertMessage.error) {
          chatSummary.errors.push(insertMessage.error.message);
        }
      }

      chatSummary.imported += 1;
    }

    domainSummaries.push(chatSummary);

    // HYBRID IMPORT
    const hybridRecords = Array.isArray(payload.domains.hybrid) ? payload.domains.hybrid : [];
    const hybridSummary = emptyDomainSummary('hybrid', hybridRecords.length);

    for (const row of hybridRecords) {
      const externalId = readExternalId(row);
      if (!externalId) {
        hybridSummary.skipped += 1;
        hybridSummary.errors.push('hybrid row missing externalImportId');
        continue;
      }

      const insertRun = await supabase
        .from('synthesis_runs')
        .upsert(
          {
            user_id: user.id,
            sources: row.payload.sources,
            total_ideas: row.payload.totalIdeas,
            status: row.payload.status,
            structured_approach: row.payload.structuredApproach || null,
            contradictions: row.payload.contradictions || [],
            external_import_id: externalId,
          },
          { onConflict: 'external_import_id' }
        );

      if (insertRun.error) {
        hybridSummary.skipped += 1;
        hybridSummary.errors.push(insertRun.error.message);
        continue;
      }

      hybridSummary.imported += 1;
    }

    domainSummaries.push(hybridSummary);

    // LEGAL IMPORT
    const legalRecords = Array.isArray(payload.domains.legal) ? payload.domains.legal : [];
    const legalSummary = emptyDomainSummary('legal', legalRecords.length);

    for (const row of legalRecords) {
      const externalId = readExternalId(row);
      if (!externalId) {
        legalSummary.skipped += 1;
        legalSummary.errors.push('legal row missing externalImportId');
        continue;
      }

      const analysis = asObject(row.payload.analysisResult);
      const verdict = asObject(analysis.verdict);

      const insertLegal = await supabase
        .from('legal_analysis_history')
        .upsert(
          {
            user_id: user.id,
            case_id: row.payload.caseId,
            case_title: row.payload.caseTitle,
            jurisdiction: row.payload.jurisdiction || null,
            case_type: row.payload.caseType || null,
            document_names: row.payload.documentNames || [],
            document_count: Array.isArray(row.payload.documentNames) ? row.payload.documentNames.length : 0,
            chains_count: Array.isArray(analysis.causalChains) ? analysis.causalChains.length : 0,
            causation_established: Boolean(verdict.liable),
            but_for_satisfied: Boolean(verdict.butForSatisfied),
            proximate_cause_satisfied: Boolean(verdict.proximateCauseSatisfied),
            confidence: typeof verdict.confidence === 'number' ? verdict.confidence : 0,
            analysis_result: analysis,
            external_import_id: externalId,
          },
          { onConflict: 'external_import_id' }
        );

      if (insertLegal.error) {
        legalSummary.skipped += 1;
        legalSummary.errors.push(insertLegal.error.message);
        continue;
      }

      legalSummary.imported += 1;
    }

    domainSummaries.push(legalSummary);

    const educationRecords = Array.isArray(payload.domains.education) ? payload.domains.education : [];
    domainSummaries.push({
      domain: 'education',
      attempted: educationRecords.length,
      imported: 0,
      skipped: educationRecords.length,
      errors: educationRecords.length > 0 ? ['education import is not yet mapped to a persistence table'] : [],
    });

    const openclawRecords = Array.isArray(payload.domains.openclaw) ? payload.domains.openclaw : [];
    domainSummaries.push({
      domain: 'openclaw',
      attempted: openclawRecords.length,
      imported: 0,
      skipped: openclawRecords.length,
      errors: openclawRecords.length > 0 ? ['openclaw import is not yet mapped to a persistence table'] : [],
    });

    const scmRecords = Array.isArray(payload.domains.scm) ? payload.domains.scm : [];
    domainSummaries.push({
      domain: 'scm',
      attempted: scmRecords.length,
      imported: 0,
      skipped: scmRecords.length,
      errors: scmRecords.length > 0 ? ['scm import is not yet mapped to a persistence table'] : [],
    });

    const completedAt = new Date().toISOString();
    const summary: HistoryImportSummary = {
      userId: user.id,
      sourceVersion: payload.sourceVersion,
      startedAt,
      completedAt,
      domains: domainSummaries,
    };

    const { error: finalizeError } = await supabase
      .from('history_import_jobs')
      .update({
        status: 'completed',
        completed_at: completedAt,
        summary_json: summary,
      })
      .eq('id', jobRow.id);

    if (finalizeError) {
      return NextResponse.json({ success: false, error: finalizeError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, imported: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import history';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

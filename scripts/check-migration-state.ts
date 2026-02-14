import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

type Row = { version?: string; name?: string };

async function main() {
  const projectRoot = process.cwd();
  const migrationsDir = path.join(projectRoot, 'supabase', 'migrations');
  const outDir = path.join(projectRoot, 'docs', 'audits');
  fs.mkdirSync(outDir, { recursive: true });

  const localFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const localVersions = new Set(localFiles.map((f) => f.split('_')[0]));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const stamp = new Date().toISOString().slice(0, 10);
  const outPath = path.join(outDir, `migration-state-${stamp}.md`);

  if (!url || !key) {
    const msg = `# Migration State Report (${stamp})\n\nMissing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n\n- Local migration files: ${localFiles.length}\n`;
    fs.writeFileSync(outPath, msg);
    console.log(msg);
    return;
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  let remoteRows: Row[] = [];
  let source = 'supabase_migrations.schema_migrations';

  const first = await supabase.schema('supabase_migrations').from('schema_migrations').select('version');
  if (!first.error && first.data) {
    remoteRows = first.data as Row[];
  } else {
    source = 'public.schema_migrations';
    const fallback = await supabase.from('schema_migrations').select('version,name');
    if (fallback.error) {
      throw new Error(`Unable to read remote migrations: ${first.error?.message || ''} | ${fallback.error.message}`);
    }
    remoteRows = fallback.data as Row[];
  }

  const remoteVersions = new Set(
    remoteRows
      .map((r) => String(r.version || '').trim())
      .filter(Boolean),
  );

  const pending = localFiles.filter((f) => !remoteVersions.has(f.split('_')[0]));
  const unknownRemote = [...remoteVersions].filter((v) => !localVersions.has(v));

  const report = [
    `# Migration State Report (${stamp})`,
    '',
    `- Remote source: \`${source}\``,
    `- Local migrations: **${localFiles.length}**`,
    `- Remote applied versions: **${remoteVersions.size}**`,
    `- Pending local migrations: **${pending.length}**`,
    `- Unknown remote versions: **${unknownRemote.length}**`,
    '',
    '## Pending local migrations',
    ...(pending.length ? pending.map((p) => `- ${p}`) : ['- None']),
    '',
    '## Unknown remote versions',
    ...(unknownRemote.length ? unknownRemote.map((v) => `- ${v}`) : ['- None']),
    '',
  ].join('\n');

  fs.writeFileSync(outPath, report);
  console.log(report);
  console.log(`Report written: ${outPath}`);
}

main().catch((error) => {
  console.error('[check-migration-state] failed:', error);
  process.exit(1);
});

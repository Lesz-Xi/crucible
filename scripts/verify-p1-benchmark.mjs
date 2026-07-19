#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const instrumentRoot = path.join(repositoryRoot, 'benchmarks', 'p1-typed-warrant');
const manifestName = 'FREEZE-MANIFEST-CHECKLIST.json';
const manifestPath = path.join(instrumentRoot, manifestName);
const families = ['formal', 'empirical', 'bridge'];
const frozenLabels = new Set([
  'timeout_to_independence',
  'probability_to_proof',
  'theory_relative_to_unconditional',
  'proof_erases_grounding',
  'hidden_source_conflict',
  'calibration_scope_extrapolation',
]);
const goldVocabulary = ['gold_option', 'option_kinds', 'category_error', 'ordinary_error'];
const allowedOptionKinds = new Set(['correct', 'ordinary_error', 'category_error']);
const expectedReports = new Map([
  [
    path.join(repositoryRoot, 'docs', 'specs', 'p1-typed-warrant', 'O-2-benchmark-spec.md'),
    'b39f67bd11a3834f2602f78ddc372e37aa069bad2e5aeb236827e5fb0ad9c010',
  ],
  [
    path.join(repositoryRoot, 'docs', 'specs', 'p1-typed-warrant', 'O-3-implementation-report.md'),
    '0a81c3b69106932d7a7027a3cfddf0402b0b2b0b1ad8233a3499fa81ccde5b62',
  ],
]);

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function readJson(filePath) {
  const bytes = await readFile(filePath);
  try {
    return { bytes, value: JSON.parse(bytes.toString('utf8')) };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON at ${path.relative(repositoryRoot, filePath)}: ${detail}`);
  }
}

async function listFiles(directory, relativeDirectory = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    const absolutePath = path.join(directory, entry.name);

    invariant(!entry.isSymbolicLink(), `Symbolic links are not allowed in the instrument: ${relativePath}`);
    if (entry.isDirectory()) {
      files.push(...await listFiles(absolutePath, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    } else {
      throw new Error(`Unsupported filesystem entry in instrument: ${relativePath}`);
    }
  }

  return files.sort();
}

function assertSameKeys(expected, actual, label) {
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(actual).sort();
  invariant(
    JSON.stringify(expectedKeys) === JSON.stringify(actualKeys),
    `${label} file-set mismatch\nexpected: ${expectedKeys.join(', ')}\nactual: ${actualKeys.join(', ')}`,
  );
}

async function verifyManifest() {
  const { value: manifest } = await readJson(manifestPath);
  invariant(
    typeof manifest.status === 'string' && manifest.status.startsWith('PRE-FREEZE INVENTORY'),
    'Manifest must remain explicitly marked as a pre-freeze inventory',
  );
  invariant(Number.isInteger(manifest.payload_file_count), 'Manifest payload_file_count must be an integer');
  invariant(manifest.sha256 && typeof manifest.sha256 === 'object', 'Manifest sha256 map is missing');

  const files = (await listFiles(instrumentRoot)).filter((file) => file !== manifestName);
  const actualHashes = {};
  for (const relativePath of files) {
    const bytes = await readFile(path.join(instrumentRoot, relativePath));
    actualHashes[relativePath] = sha256(bytes);
  }

  invariant(
    manifest.payload_file_count === files.length,
    `Manifest count ${manifest.payload_file_count} does not match ${files.length} payload files`,
  );
  assertSameKeys(manifest.sha256, actualHashes, 'Manifest');

  for (const [relativePath, expectedHash] of Object.entries(manifest.sha256)) {
    invariant(
      actualHashes[relativePath] === expectedHash,
      `SHA-256 mismatch for ${relativePath}: expected ${expectedHash}, got ${actualHashes[relativePath]}`,
    );
  }

  return files;
}

async function verifyJson(files) {
  const jsonFiles = [manifestName, ...files.filter((file) => file.endsWith('.json'))];
  for (const relativePath of jsonFiles) {
    await readJson(path.join(instrumentRoot, relativePath));
  }
  return jsonFiles.length;
}

async function verifyCasesAndGold() {
  const cases = new Map();
  const familyCounts = new Map();

  for (const family of families) {
    const directory = path.join(instrumentRoot, 'cases', 'pilot', family);
    const caseFiles = (await readdir(directory)).filter((name) => name.endsWith('.json')).sort();
    familyCounts.set(family, caseFiles.length);

    for (const fileName of caseFiles) {
      const filePath = path.join(directory, fileName);
      const { bytes, value: benchmarkCase } = await readJson(filePath);
      const stem = path.basename(fileName, '.json');
      invariant(benchmarkCase.case_id === stem, `Case ID/file mismatch: ${family}/${fileName}`);
      invariant(benchmarkCase.family === family, `Case family mismatch: ${benchmarkCase.case_id}`);
      invariant(!cases.has(benchmarkCase.case_id), `Duplicate case ID: ${benchmarkCase.case_id}`);
      invariant(
        benchmarkCase.option_menu && typeof benchmarkCase.option_menu === 'object',
        `Missing option menu: ${benchmarkCase.case_id}`,
      );

      const caseText = bytes.toString('utf8');
      for (const forbidden of goldVocabulary) {
        invariant(!caseText.includes(forbidden), `Gold vocabulary leaked into ${benchmarkCase.case_id}: ${forbidden}`);
      }
      cases.set(benchmarkCase.case_id, benchmarkCase);
    }
  }

  for (const family of families) {
    invariant(familyCounts.get(family) === 10, `Expected 10 ${family} cases, got ${familyCounts.get(family)}`);
  }
  invariant(cases.size === 30, `Expected 30 unique pilot cases, got ${cases.size}`);

  const goldDirectory = path.join(instrumentRoot, 'gold');
  const goldFiles = (await readdir(goldDirectory)).filter((name) => name.endsWith('.gold.json')).sort();
  invariant(goldFiles.length === cases.size, `Expected ${cases.size} gold files, got ${goldFiles.length}`);

  const goldIds = new Set();
  for (const fileName of goldFiles) {
    const { value: gold } = await readJson(path.join(goldDirectory, fileName));
    const stem = fileName.slice(0, -'.gold.json'.length);
    invariant(gold.case_id === stem, `Gold ID/file mismatch: ${fileName}`);
    invariant(cases.has(gold.case_id), `Gold file has no pilot case: ${gold.case_id}`);
    invariant(!goldIds.has(gold.case_id), `Duplicate gold ID: ${gold.case_id}`);

    const benchmarkCase = cases.get(gold.case_id);
    const options = Object.keys(benchmarkCase.option_menu).sort();
    const mappedOptions = Object.keys(gold.option_kinds ?? {}).sort();
    invariant(
      JSON.stringify(options) === JSON.stringify(mappedOptions),
      `Gold option map is not total for ${gold.case_id}`,
    );

    const correctOptions = mappedOptions.filter((option) => gold.option_kinds[option]?.kind === 'correct');
    invariant(
      correctOptions.length === 1 && correctOptions[0] === gold.gold_option,
      `Gold must contain exactly one correct option matching gold_option: ${gold.case_id}`,
    );

    for (const option of mappedOptions) {
      const classification = gold.option_kinds[option];
      invariant(
        allowedOptionKinds.has(classification.kind),
        `Unknown option kind in ${gold.case_id}/${option}: ${classification.kind}`,
      );
      if (classification.kind === 'category_error') {
        invariant(
          frozenLabels.has(classification.label),
          `Unknown category-error label in ${gold.case_id}/${option}: ${classification.label}`,
        );
      }
    }
    goldIds.add(gold.case_id);
  }

  invariant(goldIds.size === cases.size, 'Case/gold cardinality mismatch');
  return { caseCount: cases.size, familyCounts, goldCount: goldIds.size };
}

async function verifyReports() {
  for (const [filePath, expectedHash] of expectedReports) {
    const bytes = await readFile(filePath);
    invariant(
      sha256(bytes) === expectedHash,
      `Approved report changed in transit: ${path.relative(repositoryRoot, filePath)}`,
    );
  }
  return expectedReports.size;
}

async function main() {
  const payloadFiles = await verifyManifest();
  const jsonCount = await verifyJson(payloadFiles);
  const { caseCount, familyCounts, goldCount } = await verifyCasesAndGold();
  const reportCount = await verifyReports();

  console.log('PASS P1 benchmark integrity');
  console.log(`  manifest: ${payloadFiles.length} payload files match SHA-256 inventory`);
  console.log(`  JSON: ${jsonCount} files parse`);
  console.log(
    `  pilot: ${caseCount} unique cases (${families.map((family) => `${familyCounts.get(family)} ${family}`).join(', ')})`,
  );
  console.log(`  gold: ${goldCount} isolated, total answer keys`);
  console.log(`  reports: ${reportCount} approved source hashes match`);
  console.log('  status: pre-freeze instrument only; no model result asserted');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`FAIL P1 benchmark integrity: ${message}`);
  process.exitCode = 1;
});

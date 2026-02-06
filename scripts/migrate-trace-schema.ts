import fs from "node:fs";
import path from "node:path";

interface FixtureFile {
  schema_version: string;
  generated_at: string;
  traces: Array<Record<string, unknown>>;
}

function parseArg(flag: string, fallback: string): string {
  const idx = process.argv.indexOf(flag);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

function main(): number {
  try {
    const inputPath = parseArg("--input", "docs/governance/trace-fixtures.v1.json");
    const outputPath = parseArg("--output", "artifacts/trace-fixtures.v2.json");
    const toVersion = parseArg("--to", "2.0.0");
    const write = process.argv.includes("--write");

    const source = JSON.parse(fs.readFileSync(inputPath, "utf8")) as FixtureFile;
    if (!source.schema_version.startsWith("1.")) {
      throw new Error(`Unsupported source schema version ${source.schema_version}; expected 1.x`);
    }
    if (toVersion !== "2.0.0") {
      throw new Error(`Unsupported target version ${toVersion}; only 2.0.0 implemented`);
    }

    const migrated = {
      ...source,
      schema_version: "2.0.0",
      migration: {
        from_version: source.schema_version,
        migrated_at: new Date().toISOString(),
        note: "Seed migration. Extend with concrete transforms as schema evolves."
      }
    };

    if (!write) {
      console.log(JSON.stringify(migrated, null, 2));
      console.log("Dry-run complete. Use --write to save.");
      return 0;
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(migrated, null, 2) + "\n", "utf8");
    console.log(`Migrated trace schema written to ${outputPath}`);
    return 0;
  } catch (error) {
    console.error(`[migrate-trace-schema] ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

process.exit(main());

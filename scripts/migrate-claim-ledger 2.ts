import fs from "node:fs";
import path from "node:path";

interface ClaimLedgerV1 {
  schema_version: string;
  generated_at: string;
  claims: Array<Record<string, unknown>>;
}

interface ClaimLedgerV2 extends ClaimLedgerV1 {
  migration: {
    from_version: string;
    migrated_at: string;
    note: string;
  };
}

interface CliArgs {
  inputPath: string;
  outputPath: string;
  targetVersion: string;
  dryRun: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    inputPath: "docs/governance/claim-ledger.json",
    outputPath: "artifacts/claim-ledger.v2.json",
    targetVersion: "2.0.0",
    dryRun: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = argv[++i];
    else if (token === "--output") args.outputPath = argv[++i];
    else if (token === "--to") args.targetVersion = argv[++i];
    else if (token === "--dry-run") args.dryRun = true;
    else if (token === "--write") args.dryRun = false;
  }

  return args;
}

function main(): number {
  try {
    const args = parseArgs(process.argv.slice(2));
    const inputRaw = fs.readFileSync(args.inputPath, "utf8");
    const source = JSON.parse(inputRaw) as ClaimLedgerV1;

    if (!source.schema_version.startsWith("1.")) {
      throw new Error(`Unsupported source schema version ${source.schema_version}; expected 1.x`);
    }
    if (args.targetVersion !== "2.0.0") {
      throw new Error(`Unsupported target version ${args.targetVersion}; only 2.0.0 is implemented`);
    }

    const migrated: ClaimLedgerV2 = {
      ...source,
      schema_version: "2.0.0",
      migration: {
        from_version: source.schema_version,
        migrated_at: new Date().toISOString(),
        note: "Automatic v1->v2 migration seed. Extend with schema-specific transforms as needed.",
      },
    };

    if (args.dryRun) {
      console.log(JSON.stringify(migrated, null, 2));
      console.log("Dry-run complete. Use --write to persist output.");
      return 0;
    }

    fs.mkdirSync(path.dirname(args.outputPath), { recursive: true });
    fs.writeFileSync(args.outputPath, JSON.stringify(migrated, null, 2), "utf8");
    console.log(`Migrated ledger written to ${args.outputPath}`);
    return 0;
  } catch (error) {
    console.error(`[migrate-claim-ledger] ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

process.exit(main());

import fs from "node:fs";
import path from "node:path";

interface EvidenceSpec {
  path: string;
  matcher_type: string;
  matcher: string;
  required: boolean;
  contradiction?: Array<{ matcher_type: string; matcher: string; reason: string }>;
}

interface ClaimRecord {
  claim_id: string;
  evidence: EvidenceSpec[];
  [key: string]: unknown;
}

interface ClaimLedger {
  schema_version: string;
  generated_at: string;
  claims: ClaimRecord[];
}

interface CliArgs {
  ledgerPath: string;
  oldPath: string;
  newPath: string;
  outputPath: string;
}

function parseArgs(argv: string[]): CliArgs {
  const args: Partial<CliArgs> = {
    ledgerPath: "docs/governance/claim-ledger.json",
    outputPath: "artifacts/claim-ledger.reconciled.json",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--ledger") args.ledgerPath = argv[++i];
    else if (token === "--old") args.oldPath = argv[++i];
    else if (token === "--new") args.newPath = argv[++i];
    else if (token === "--output") args.outputPath = argv[++i];
  }

  if (!args.oldPath || !args.newPath) {
    throw new Error("Usage: tsx scripts/reconcile-claim-ledger.ts --old <path> --new <path> [--ledger <path>] [--output <path>]");
  }

  return args as CliArgs;
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}

function main(): number {
  try {
    const args = parseArgs(process.argv.slice(2));
    const ledgerRaw = fs.readFileSync(args.ledgerPath, "utf8");
    const ledger = JSON.parse(ledgerRaw) as ClaimLedger;

    const oldNorm = normalizePath(args.oldPath);
    const newNorm = normalizePath(args.newPath);

    const touchedClaims = new Set<string>();
    let replacements = 0;

    for (const claim of ledger.claims) {
      for (const evidence of claim.evidence) {
        const current = normalizePath(evidence.path);
        if (current === oldNorm || current.endsWith(`/${oldNorm}`)) {
          evidence.path = evidence.path.replace(args.oldPath, args.newPath);
          if (normalizePath(evidence.path) === current) {
            evidence.path = args.newPath;
          }
          touchedClaims.add(claim.claim_id);
          replacements += 1;
        }
      }
    }

    fs.mkdirSync(path.dirname(args.outputPath), { recursive: true });
    fs.writeFileSync(args.outputPath, JSON.stringify(ledger, null, 2), "utf8");

    console.log(`Reconciled ledger candidate written to ${args.outputPath}`);
    console.log(`Path replacements: ${replacements}`);
    console.log(`Touched claims: ${Array.from(touchedClaims).join(", ") || "none"}`);
    console.log("Review this candidate file in PR; original ledger was not modified.");

    return 0;
  } catch (error) {
    console.error(`[reconcile-claim-ledger] ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

process.exit(main());

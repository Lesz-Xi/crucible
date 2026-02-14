import React from "react";
import type { ExtractedTable } from "@/types/scientific-data";

interface ScientificTableCardProps {
  table: ExtractedTable;
  sourceFileName?: string;
}

export function ScientificTableCard({ table, sourceFileName }: ScientificTableCardProps) {
  const isTrusted = table.confidence >= 0.6;

  return (
    <div className="rounded-lg border border-wabi-sand/20 bg-glass-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="font-medium text-wabi-charcoal dark:text-wabi-sand">
          Table p.{table.pageNumber} #{table.tableIndex + 1}
          {sourceFileName ? ` • ${sourceFileName}` : ""}
        </div>
        <span
          className={`px-2 py-0.5 rounded-full ${isTrusted ? "bg-wabi-emerald/15 text-wabi-emerald" : "bg-wabi-rust/15 text-wabi-rust"}`}
        >
          {isTrusted ? "trusted" : "flagged"} ({Math.round(table.confidence * 100)}%)
        </span>
      </div>

      {table.qaFlags.length > 0 && (
        <div className="text-xs text-wabi-rust">QA: {table.qaFlags.join(", ")}</div>
      )}

      <div className="overflow-auto max-h-64 border border-wabi-sand/10 rounded">
        <table className="w-full text-xs">
          <thead className="bg-wabi-charcoal/5 dark:bg-wabi-sand/10">
            <tr>
              {table.headers.map((header, idx) => (
                <th key={`${header}-${idx}`} className="text-left px-2 py-1 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIdx) => (
              <tr key={`r-${rowIdx}`} className="border-t border-wabi-sand/10">
                {row.map((cell, cellIdx) => (
                  <td key={`c-${rowIdx}-${cellIdx}`} className="px-2 py-1 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

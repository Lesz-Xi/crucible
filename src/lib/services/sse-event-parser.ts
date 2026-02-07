export interface ParsedSSEEvent {
  event: string;
  data: unknown;
}

export interface ParsedSSEBatch {
  events: ParsedSSEEvent[];
  remainder: string;
}

function parseDataValue(value: string): unknown {
  if (value === "[DONE]") return null;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function parseSSEChunk(chunk: string, previousRemainder = ""): ParsedSSEBatch {
  const text = previousRemainder + chunk;
  const blocks = text.split("\n\n");
  const remainder = blocks.pop() ?? "";

  const events: ParsedSSEEvent[] = [];

  for (const block of blocks) {
    if (!block.trim()) continue;

    const lines = block.split("\n");
    let event = "message";
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
        continue;
      }

      if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    if (dataLines.length === 0) continue;
    const rawData = dataLines.join("\n");
    const parsed = parseDataValue(rawData);

    if (parsed === null) continue;
    events.push({ event, data: parsed });
  }

  return { events, remainder };
}

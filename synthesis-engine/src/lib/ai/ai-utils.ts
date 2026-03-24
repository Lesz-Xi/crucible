/**
 * Robustly extracts and cleans JSON from LLM responses.
 * Handles balanced braces, markdown blocks, and bad control characters.
 */
export function cleanJson(text: string): string {
  if (!text) return "{}";

  // 1. Priority: Extract content inside markdown code blocks
  // This prevents mistakenly identifying braces in conversational preamble as the start of JSON.
  const codeBlockRegex = /```(?:json|JSON)?\s*([\s\S]*?)\s*```/g;
  const matches = [...text.matchAll(codeBlockRegex)];
  
  let contentToProcess = text;
  
  // If we found code blocks, join them (handling multiple blocks if necessary, but usually just one)
  if (matches.length > 0) {
    // If multiple blocks, we might want just the first one or all. 
    // Usually LLMs output one main JSON block. Let's take the first one that looks actionable.
    // Or we can join them. Let's try to just take the first component that parses or just the first block.
    // For safety, let's take the text from the first block.
    contentToProcess = matches[0][1]; 
  }

  // 2. Basic cleanup on the processed content
  let cleaned = contentToProcess.trim();

  // 3. Find the JSON object using balanced brace counting
  // This is better than regex because it handles truncated JSON or multiple objects
  let firstBrace = cleaned.indexOf('{');
  let firstBracket = cleaned.indexOf('[');
  
  // Decide which one starts the JSON
  let startIndex = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace;
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
  }

  if (startIndex === -1) return "{}";

  // Scan for the balanced end or end of string
  let opener = cleaned[startIndex];
  let closer = opener === '{' ? '}' : ']';
  let balance = 0;
  let inString = false;
  let escaped = false;
  let endIndex = -1;

  for (let i = startIndex; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === opener) balance++;
      if (char === closer) balance--;
      if (balance === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }

  // If no balanced closer was found, take everything from startIndex
  // (repairJson will handle closing it)
  if (endIndex === -1) {
    cleaned = cleaned.substring(startIndex);
  } else {
    cleaned = cleaned.substring(startIndex, endIndex);
  }

  // 4. Final cleaning: Handle bad control characters
  // Remove dangerous control characters first
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");
  
  // 5. CRITICAL FIX: Escape literal newlines/tabs INSIDE JSON strings
  // Use state machine to track if we're inside a string
  let result = '';
  let insideString = false;
  let isEscaped = false;
  
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    
    if (isEscaped) {
      // Previous char was backslash, this is an escape sequence
      result += char;
      isEscaped = false;
      continue;
    }
    
    if (char === '\\') {
      result += char;
      isEscaped = true;
      continue;
    }
    
    if (char === '"') {
      insideString = !insideString;
      result += char;
      continue;
    }
    
    // If inside a string and we hit a literal newline/carriage return/tab, escape it
    if (insideString) {
      if (char === '\n') {
        result += '\\n';
        continue;
      }
      if (char === '\r') {
        result += '\\r';
        continue;
      }
      if (char === '\t') {
        result += '\\t';
        continue;
      }
    }
    
    result += char;
  }
  
  return result;
}

/**
 * Attempts to repair a truncated or malformed JSON string by closing open quotes and braces.
 */
export function repairJson(json: string): string {
  let repaired = json.trim();
  
  // 1. If it ends with a comma, remove it (common in truncated arrays/objects)
  if (repaired.endsWith(',')) {
    repaired = repaired.slice(0, -1).trim();
  }

  // 2. If it ends inside a string, close the quote
  // We need to count unescaped quotes
  let quoteCount = 0;
  for (let i = 0; i < repaired.length; i++) {
    if (repaired[i] === '"' && (i === 0 || repaired[i - 1] !== '\\')) {
      quoteCount++;
    }
  }
  if (quoteCount % 2 !== 0) {
    repaired += '"';
  }

  // 3. Balance braces and brackets
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') stack.push('}');
      else if (char === '[') stack.push(']');
      else if (char === '}' || char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  }

  // Close remaining items in reverse order
  while (stack.length > 0) {
    const closer = stack.pop();
    // Before closing, check if there's a trailing comma inside the block
    repaired = repaired.trim();
    if (repaired.endsWith(',')) {
      repaired = repaired.slice(0, -1).trim();
    }
    repaired += closer;
  }

  return repaired;
}

/**
 * Attempts to parse JSON with fallback logic for resilience.
 */
export function safeParseJson<T>(text: string, fallback: T): T {
  if (!text) return fallback;
  
  let cleaned = "";
  try {
    cleaned = cleanJson(text);
    return JSON.parse(cleaned) as T;
  } catch (error) {
    // Try repairing truncated JSON
    try {
      const repaired = repairJson(cleaned);
      const result = JSON.parse(repaired) as T;
      console.warn("[AI-Utils] JSON Parsed successfully after REPAIR.");
      return result;
    } catch (repairError) {
      console.warn("[AI-Utils] JSON Parse Failed (even after repair).", error);
      console.warn("[AI-Utils] Failed TextSnippet (100 chars):", text.slice(0, 100));
      return fallback;
    }
  }
}

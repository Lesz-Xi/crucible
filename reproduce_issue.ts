
import { safeParseJson } from './synthesis-engine/src/lib/ai/ai-utils';

function cleanJsonLocal(text: string): string {
  if (!text) return "{}";

  // 1. Priority: Extract content inside markdown code blocks
  const codeBlockRegex = /```(?:json|JSON)?\s*([\s\S]*?)\s*```/g;
  const matches = [...text.matchAll(codeBlockRegex)];
  
  let contentToProcess = text;
  
  if (matches.length > 0) {
    contentToProcess = matches[0][1]; 
  }

  // 2. Basic cleanup on the processed content
  let cleaned = contentToProcess.trim();

  // 3. Find the JSON object using balanced brace counting
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

  if (endIndex === -1) {
    cleaned = cleaned.substring(startIndex);
  } else {
    cleaned = cleaned.substring(startIndex, endIndex);
  }

  cleaned = cleaned.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, " ");

  return cleaned;
}

// Test case 1: Normal JSON
const test1 = "```json\n" +
"{\n" +
"  \"key\": \"value\"\n" +
"}\n" +
"```";

// Test case 2: Text with braces BEFORE the JSON block (Hypothesized Failure)
const test2 = "Here is the output you requested.\n" +
"I have ensured that the {format} is correct.\n\n" +
"```json\n" +
"{\n" +
"  \"key\": \"value\"\n" +
"}\n" +
"```";

console.log("--- Test 1 ---");
const result1 = cleanJsonLocal(test1);
console.log("Result 1:", result1);
try {
    JSON.parse(result1);
    console.log("Parse 1: Success");
} catch (e: any) {
    console.log("Parse 1: Failed", e.message);
}

console.log("\n--- Test 2 ---");
const result2 = cleanJsonLocal(test2);
console.log("Result 2 extracted:", result2);
try {
    JSON.parse(result2);
    console.log("Parse 2: Success");
} catch (e: any) {
    console.log("Parse 2: Failed", e.message);
}

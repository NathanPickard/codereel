"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.explainFunction = explainFunction;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
async function explainFunction(apiKey, code, functionName) {
    const client = new sdk_1.default({ apiKey });
    const prompt = `You are a code animation engine. Analyze this JavaScript/TypeScript function and return a JSON storyboard that animates how it works step by step.

Function to analyze:
\`\`\`
${code}
\`\`\`

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "title": "function name as title",
  "summary": "one sentence describing what the function does",
  "frames": [
    {
      "lines": [startLine, endLine],
      "annotation": "plain English explanation of what this step does",
      "variables": { "varName": "value or expression" },
      "viz": {
        "array": [3, 6, 7, 10, 14, 18, 19],
        "left": 0,
        "right": 6,
        "mid": 3,
        "target": 12
      }
    }
  ]
}

Rules:
- Line numbers are 1-indexed relative to the function code provided
- Create 5-7 frames covering the key algorithmic steps
- Each annotation should be concise (max 15 words)
- Variables should show concrete example values where possible
- For viz: include "array" always when the function operates on an array. Include "left", "right", "mid" as 0-based indices whenever those pointers exist. Set "found" to the index if the target was found in this frame.
- If the function does not use an array, omit "viz" entirely
- If this looks like a React todo function, add two fields per frame:
  1. "uiHint": a short phrase (under 10 words) describing what the user sees change in the browser
  2. "appState": the exact React state at this point in execution, with this shape:
     { "todos": [{"id": 1, "text": "Build a VS Code extension", "done": false}, ...], "filter": "all", "input": "" }
     Use these as the base todos: [{"id":1,"text":"Build a VS Code extension","done":false},{"id":2,"text":"Demo CodeReel at hackathon","done":false},{"id":3,"text":"Win the hackathon","done":false}]
     Show the state AS IT WOULD BE at the end of that frame executing (e.g. after addTodo, include the new todo in the array)
- Focus on the interesting algorithmic steps, not boilerplate`;
    const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
    });
    let text = message.content[0].text;
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(text);
}

import Anthropic from '@anthropic-ai/sdk';

export interface ArrayViz {
  array: (number | string)[];
  left?: number;
  right?: number;
  mid?: number;
  target?: number | string;
  found?: number;
}

export interface AppState {
  [key: string]: unknown;
}

export interface Frame {
  lines: [number, number];
  annotation: string;
  variables: Record<string, string>;
  viz?: ArrayViz;
  uiHint?: string;
  appState?: AppState;
}

export interface Storyboard {
  title: string;
  summary: string;
  frames: Frame[];
}

export async function explainFunction(
  apiKey: string,
  code: string,
  functionName: string
): Promise<Storyboard> {
  const client = new Anthropic({ apiKey });

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
- If this looks like a React function (uses useState values, calls setState, references state variables like cart, todos, filter, etc.), add two fields per frame:
  1. "uiHint": a short phrase (under 10 words) describing what the user sees change in the browser UI
  2. "appState": the exact React state at the END of that frame executing. Infer the state variable names directly from the function code (e.g. if the function uses "cart", use key "cart"; if it uses "todos", use key "todos"). Use realistic concrete example data.
     For cart/shopping functions, use: cart=[{id:1,name:"Mechanical Keyboard",price:89.99,emoji:"⌨️",qty:1},{id:2,name:"Wireless Mouse",price:49.99,emoji:"🖱️",qty:1}]
     For todo functions, use: todos=[{id:1,text:"Build a VS Code extension",done:false},{id:2,text:"Demo CodeReel at hackathon",done:false},{id:3,text:"Win the hackathon",done:false}]
     Show the state AS IT WOULD BE after that frame executes (e.g. after addToCart, include the new item in cart)
- Focus on the interesting algorithmic steps, not boilerplate`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  let text = (message.content[0] as { type: string; text: string }).text;
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(text) as Storyboard;
}

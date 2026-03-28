# CodeReel

**CodeReel** is a VS Code extension that generates animated, step-by-step explanations of how your code works — directly inside the editor.

Click a single button above any function and CodeReel opens a split-pane panel showing:
- **Left**: an animated walkthrough of the code with line highlights, variable state, and plain-English annotations
- **Right**: your live running app, updating in real time to reflect each step of the animation

---

## Demo

![CodeReel demo](https://placeholder-for-demo-gif.png)
<img width="1298" height="742" alt="Screenshot 2026-03-28 at 12 54 30 PM" src="https://github.com/user-attachments/assets/f2675d0b-1886-4db6-97ff-92fa58ef257c" />

1. Open any JavaScript, TypeScript, JSX, or TSX file
2. Click **▶ Explain with CodeReel** above a function
3. Watch the animation — and your live app — step through the logic

---

## How It Works

1. **CodeLens** — VS Code displays an inline "▶ Explain with CodeReel" link above every detected function
2. **Claude AI** — when clicked, the function's source code is sent to Claude (claude-sonnet-4-6), which generates a structured JSON storyboard: a sequence of frames, each with highlighted line ranges, plain-English annotations, variable values, and (for React apps) the exact UI state at that step
3. **WebView renderer** — the storyboard is rendered as an animated panel inside VS Code. No video file is generated — everything is HTML/CSS/JS running in the editor
4. **Live app sync** — for apps running locally, each animation frame sends a `postMessage` to an iframe embedding the running app, driving its state in sync with the code walkthrough

---

## Installation

### Prerequisites
- VS Code 1.85+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)

### Setup

```bash
git clone https://github.com/yourname/codereel
cd codereel
npm install
npm run compile
```

Open the folder in VS Code and press **F5** to launch the Extension Development Host.

### Configure your API key

In VS Code: `Cmd+,` → search `codereel` → paste your Anthropic API key into **Codereel: Api Key**.

---

## Using CodeReel with Your Own React App

CodeReel can drive the state of any locally running React app as it animates through a function. Here's how to set it up:

### Step 1 — Add the message listener to your app

Drop this `useEffect` into your root component (or any component whose state you want CodeReel to control):

```jsx
import { useEffect } from 'react'

useEffect(() => {
  function handleCodeReel(event) {
    if (event.data?.type !== 'codereel') return
    const { todos, filter, input } = event.data
    if (todos !== undefined) setTodos(todos)
    if (filter !== undefined) setFilter(filter)
    if (input !== undefined) setInput(input)
  }
  window.addEventListener('message', handleCodeReel)
  return () => window.removeEventListener('message', handleCodeReel)
}, [])
```

Adapt the destructured fields (`todos`, `filter`, `input`) to match your own state variables.

### Step 2 — Start your dev server

```bash
npm run dev
```

By default, CodeReel looks for your app at `http://localhost:5173` (Vite default). If you're using a different port (e.g. `3000` for Create React App), update the iframe src in `src/webviewPanel.ts`:

```ts
<iframe class="browser-frame" src="http://localhost:YOUR_PORT" id="appFrame"></iframe>
```

### Step 3 — Click Explain with CodeReel

Open a function in VS Code and click **▶ Explain with CodeReel**. As the animation plays, your live app will update its state frame-by-frame in sync.

---

## Supported Languages

| Language | CodeLens | Animation | Live Sync |
|----------|----------|-----------|-----------|
| JavaScript (`.js`) | ✅ | ✅ | ✅ |
| TypeScript (`.ts`) | ✅ | ✅ | ✅ |
| JSX (`.jsx`) | ✅ | ✅ | ✅ |
| TSX (`.tsx`) | ✅ | ✅ | ✅ |

---

## Project Structure

```
codereel/
├── src/
│   ├── extension.ts        # Entry point — registers commands and CodeLens
│   ├── codeLensProvider.ts # Detects functions and adds the ▶ button
│   ├── claude.ts           # Calls Claude API, returns structured storyboard
│   └── webviewPanel.ts     # Renders the animated split-pane WebView
├── out/                    # Compiled JS (generated)
├── package.json
└── tsconfig.json
```

---

## Example: What Claude Returns

For a `toggleTodo` function, Claude generates a storyboard like this:

```json
{
  "title": "toggleTodo",
  "summary": "Flips the done state of a todo item by its ID",
  "frames": [
    {
      "lines": [1, 1],
      "annotation": "Function receives the ID of the todo to toggle",
      "variables": { "id": "2" },
      "uiHint": "Nothing changes yet",
      "appState": {
        "todos": [
          { "id": 1, "text": "Build a VS Code extension", "done": false },
          { "id": 2, "text": "Demo CodeReel at hackathon", "done": false },
          { "id": 3, "text": "Win the hackathon", "done": false }
        ],
        "filter": "all"
      }
    },
    {
      "lines": [2, 3],
      "annotation": "Map over todos — find the matching ID and flip done",
      "variables": { "id": "2", "todo.id": "2", "done": "false → true" },
      "uiHint": "Second todo gets checked off",
      "appState": {
        "todos": [
          { "id": 1, "text": "Build a VS Code extension", "done": false },
          { "id": 2, "text": "Demo CodeReel at hackathon", "done": true },
          { "id": 3, "text": "Win the hackathon", "done": false }
        ],
        "filter": "all"
      }
    }
  ]
}
```

---

## Roadmap

- [ ] Configurable app port via VS Code settings
- [ ] Generic state listener npm package (`codereel-listener`)
- [ ] Support for non-React frameworks (Vue, Svelte)
- [ ] Export animation as GIF
- [ ] Automatically detect running dev server port

---

## Built With

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Anthropic Claude API](https://docs.anthropic.com) — `claude-sonnet-4-6`
- TypeScript
- React + Vite (demo app)

---

## License

MIT

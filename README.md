# CodeReel

**CodeReel** is a VS Code extension that uses Claude AI to generate animated, step-by-step explanations of how your JavaScript and TypeScript functions work — directly inside the editor, alongside your live running app.

Instead of reading through code and mentally simulating what it does, you click one button and watch it play out.

---

## What It Does

When you click **▶ Explain with CodeReel** above any function, a split-pane panel opens:

- **Left pane** — an animated walkthrough of the function: each step highlights the relevant lines, shows the current variable values, and explains what's happening in plain English
- **Right pane** — your live React app running in an iframe, updating its state in real time to match each step of the animation

No video files are generated. Everything runs live inside VS Code using a WebView renderer.
<img width="1298" height="742" alt="Screenshot 2026-03-28 at 12 54 30 PM" src="https://github.com/user-attachments/assets/ba55e148-ab7c-4291-8bda-3d449fd2984c" />

---

## How It Works

### 1. CodeReel button
VS Code displays an inline **▶ Explain with CodeReel** link above every detected function in JS, TS, JSX, and TSX files. No setup required — it appears automatically when the extension is active.

### 2. Claude AI generates a storyboard
When you click the button, the function's source code is sent to Claude (`claude-sonnet-4-6`). Claude analyzes the function and returns a structured JSON storyboard — a sequence of frames, each describing:
- Which lines to highlight
- A plain-English annotation of what that step does
- The current values of key variables
- (For React functions) the exact UI state the app should be in at that step

### 3. WebView renders the animation
The storyboard is rendered as an animated panel. Frames play automatically (1.8s each) with Prev / Play / Next controls. For array-based algorithms, a visual diagram shows the data structure with pointers moving across each step.

### 4. Live app sync via postMessage
For each frame that includes app state, CodeReel sends a `postMessage` to the iframe. Your React app listens for these messages and calls its state setters — so the UI updates in sync with the code explanation.

---

## Installation

### Prerequisites
- VS Code 1.85+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)

### Steps

```bash
git clone https://github.com/NathanPickard/codereel
cd codereel
npm install
npm run compile
```

Open the `codereel` folder in VS Code and press **F5**. This launches an Extension Development Host — a second VS Code window with CodeReel loaded and active.

### Add your API key

In the Extension Development Host window:
- Press `Cmd+,` to open Settings
- Search for `codereel`
- Paste your Anthropic API key into **Codereel: Api Key**

---

## Using CodeReel with Your Own React App

CodeReel can drive the state of any locally running React app. Here's how to wire it up:

### Step 1 — Add the message listener

Paste this `useEffect` into the component that owns the state you want CodeReel to animate. Adapt the variable names to match your own state:

```jsx
import { useEffect } from 'react'

// Example for a todo app — swap variable names for your own state
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

For a shopping cart app it would look like this instead:

```jsx
useEffect(() => {
  function handleCodeReel(event) {
    if (event.data?.type !== 'codereel') return
    const { cart, appliedDiscount, discountCode } = event.data
    if (cart !== undefined) setCart(cart)
    if (appliedDiscount !== undefined) setAppliedDiscount(appliedDiscount)
    if (discountCode !== undefined) setDiscountCode(discountCode)
  }
  window.addEventListener('message', handleCodeReel)
  return () => window.removeEventListener('message', handleCodeReel)
}, [])
```

The pattern is always the same — destructure the keys that match your state variables, and call the corresponding setters.

### Step 2 — Start your dev server

```bash
npm run dev
```

### Step 3 — Set the port in VS Code settings

In the Extension Development Host:
- Press `Cmd+,` → search `codereel`
- Set **Codereel: App Port** to match your dev server (default `5173` for Vite, `3000` for Create React App)

### Step 4 — Click Explain with CodeReel

Open any function file in VS Code. Click **▶ Explain with CodeReel** above a function. The animation will play and your live app will update alongside it.

---

## Full Example

Here is a complete walkthrough using the included shopping cart demo app.

### The function

```js
function addToCart(product) {
  const existing = cart.find(item => item.id === product.id)
  if (existing) {
    setCart(cart.map(item =>
      item.id === product.id ? { ...item, qty: item.qty + 1 } : item
    ))
  } else {
    setCart([...cart, { ...product, qty: 1 }])
  }
}
```

### What Claude generates

Claude analyzes this function and produces a storyboard like the following. Each frame maps to one logical step in the function's execution, with concrete example values filled in:

```json
{
  "title": "addToCart",
  "summary": "Adds a product to the cart, or increments its quantity if it already exists",
  "frames": [
    {
      "lines": [1, 1],
      "annotation": "Function receives the product to add",
      "variables": { "product": "{ id: 2, name: 'Wireless Mouse', price: 49.99 }" },
      "uiHint": "Nothing changes yet",
      "appState": {
        "cart": [
          { "id": 1, "name": "Mechanical Keyboard", "price": 89.99, "emoji": "⌨️", "qty": 1 }
        ]
      }
    },
    {
      "lines": [2, 2],
      "annotation": "Search the cart for an item with the same ID",
      "variables": { "existing": "undefined (not in cart yet)" },
      "uiHint": "Nothing changes yet",
      "appState": {
        "cart": [
          { "id": 1, "name": "Mechanical Keyboard", "price": 89.99, "emoji": "⌨️", "qty": 1 }
        ]
      }
    },
    {
      "lines": [6, 7],
      "annotation": "Item not found — spread it into the cart with qty 1",
      "variables": { "existing": "undefined", "newItem": "{ ...product, qty: 1 }" },
      "uiHint": "Wireless Mouse appears in cart",
      "appState": {
        "cart": [
          { "id": 1, "name": "Mechanical Keyboard", "price": 89.99, "emoji": "⌨️", "qty": 1 },
          { "id": 2, "name": "Wireless Mouse", "price": 49.99, "emoji": "🖱️", "qty": 1 }
        ]
      }
    }
  ]
}
```

### What you see

- Frame 1: line 1 highlights, annotation reads "Function receives the product to add", the cart in the live app shows only the Keyboard
- Frame 2: line 2 highlights, `existing = undefined` shown in the variable strip
- Frame 3: lines 6–7 highlight, annotation explains the spread, and the **live cart app immediately shows the Wireless Mouse added** — because CodeReel sent the new cart state via `postMessage`

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
│   ├── extension.ts        # Entry point — registers the command and CodeLens provider
│   ├── codeLensProvider.ts # Scans files for functions and renders the ▶ button
│   ├── claude.ts           # Sends code to Claude API, parses the storyboard response
│   └── webviewPanel.ts     # Renders the animated split-pane WebView panel
├── out/                    # Compiled JavaScript output (generated, not committed)
├── package.json
└── tsconfig.json
```

---

## Roadmap

- [ ] Generic drop-in listener package (`npm install codereel-listener`)
- [ ] Auto-detect running dev server port
- [ ] Support for Vue and Svelte
- [ ] Export animation as GIF
- [ ] Multi-function chaining (animate a call stack across multiple functions)

---

## Built With

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Anthropic Claude API](https://docs.anthropic.com) — `claude-sonnet-4-6`
- TypeScript
- React + Vite (demo apps)

---

## License

MIT

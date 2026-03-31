import * as vscode from 'vscode';
import { Storyboard } from './claude';

export class CodeReelPanel {
  private static instance: CodeReelPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private port: number;

  private constructor(panel: vscode.WebviewPanel, port: number) {
    this.panel = panel;
    this.port = port;
    this.panel.onDidDispose(() => { CodeReelPanel.instance = undefined; });
  }

  static createOrShow(_extensionUri: vscode.Uri, functionName: string, port: number): CodeReelPanel {
    if (CodeReelPanel.instance) {
      CodeReelPanel.instance.port = port;
      CodeReelPanel.instance.panel.reveal(vscode.ViewColumn.Beside);
      return CodeReelPanel.instance;
    }
    const panel = vscode.window.createWebviewPanel(
      'codereel',
      `CodeReel: ${functionName}`,
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );
    const instance = new CodeReelPanel(panel, port);
    // Load the shell once — never replaced again
    panel.webview.html = shellHtml(port);
    CodeReelPanel.instance = instance;
    return CodeReelPanel.instance;
  }

  showLoading() {
    this.panel.webview.postMessage({ type: 'loading' });
  }

  showError(message: string) {
    this.panel.webview.postMessage({ type: 'error', message });
  }

  render(storyboard: Storyboard, code: string) {
    this.panel.title = `CodeReel: ${storyboard.title}`;
    this.panel.webview.postMessage({
      type: 'storyboard',
      title: storyboard.title,
      summary: storyboard.summary,
      frames: storyboard.frames,
      codeLines: code.split('\n'),
    });
  }
}

function shellHtml(port: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-src http://localhost:${port}; img-src data:;">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #1e1e1e;
    color: #d4d4d4;
    font-family: 'Segoe UI', sans-serif;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .top-bar {
    padding: 12px 20px 8px;
    flex-shrink: 0;
  }
  h1 { font-size: 18px; color: #569cd6; margin-bottom: 2px; }
  .summary { font-size: 12px; color: #9cdcfe; margin-bottom: 0; }
  .split-pane {
    display: flex;
    flex: 1;
    overflow: hidden;
    gap: 0;
  }
  .left-pane {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
    border-right: 1px solid #3c3c3c;
  }
  .right-pane {
    width: 420px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: #1e1e1e;
  }
  .browser-label {
    font-size: 11px;
    color: #858585;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 8px 12px 4px;
    flex-shrink: 0;
  }
  .browser-frame {
    flex: 1;
    border: none;
    background: white;
  }
  .ui-hint {
    padding: 8px 12px;
    background: #1a3a1a;
    border-top: 1px solid #4ec9b0;
    font-size: 12px;
    color: #4ec9b0;
    min-height: 32px;
    flex-shrink: 0;
  }
  .ui-hint-icon { margin-right: 4px; }
  .code-block {
    background: #252526;
    border-radius: 8px;
    padding: 16px;
    font-family: 'Cascadia Code', 'Fira Code', monospace;
    font-size: 13px;
    line-height: 1.6;
    margin-bottom: 20px;
    border: 1px solid #3c3c3c;
    overflow-x: auto;
  }
  .code-line {
    padding: 2px 8px;
    border-radius: 3px;
    white-space: pre;
    transition: background 0.3s ease, border-left 0.3s ease;
    border-left: 3px solid transparent;
  }
  .code-line.highlight {
    background: #264f78;
    border-left: 3px solid #569cd6;
  }
  .annotation-box {
    background: #252526;
    border: 1px solid #569cd6;
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 16px;
    min-height: 60px;
    transition: opacity 0.3s ease;
  }
  .annotation-text {
    font-size: 15px;
    color: #ffffff;
    line-height: 1.5;
  }
  .variables {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .var-chip {
    background: #37373d;
    border: 1px solid #4ec9b0;
    border-radius: 4px;
    padding: 3px 10px;
    font-family: monospace;
    font-size: 12px;
    color: #4ec9b0;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
  }
  button {
    background: #0e639c;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 18px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
  }
  button:hover { background: #1177bb; }
  button:disabled { background: #3c3c3c; color: #777; cursor: default; }
  .progress {
    font-size: 13px;
    color: #858585;
  }
  .play-btn {
    background: #16825d;
  }
  .play-btn:hover { background: #1a9b6e; }
  .frame-dots {
    display: flex;
    gap: 6px;
    margin-left: auto;
  }
  .dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #3c3c3c;
    transition: background 0.3s;
  }
  .dot.active { background: #569cd6; }

  /* Array visualization */
  .viz-container {
    background: #252526;
    border: 1px solid #3c3c3c;
    border-radius: 8px;
    padding: 20px 16px 28px;
    margin-bottom: 20px;
    overflow-x: auto;
  }
  .viz-title {
    font-size: 11px;
    color: #858585;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
  }
  .array-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    min-height: 80px;
    position: relative;
  }
  .array-cell-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    transition: all 0.4s ease;
  }
  .array-cell {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-family: monospace;
    font-size: 14px;
    font-weight: bold;
    border: 2px solid #3c3c3c;
    background: #2d2d2d;
    color: #d4d4d4;
    transition: all 0.4s ease;
  }
  .array-cell.active-range {
    background: #264f78;
    border-color: #569cd6;
    color: #ffffff;
  }
  .array-cell.mid-cell {
    background: #4b3a00;
    border-color: #ddb100;
    color: #ffd700;
  }
  .array-cell.found-cell {
    background: #1a4a1a;
    border-color: #4ec9b0;
    color: #4ec9b0;
  }
  .array-cell.inactive {
    opacity: 0.35;
  }
  .cell-index {
    font-size: 10px;
    color: #555;
    font-family: monospace;
  }
  .pointer-row {
    display: flex;
    gap: 4px;
    margin-top: 6px;
  }
  .pointer-slot {
    width: 44px;
    text-align: center;
    font-size: 11px;
    font-family: monospace;
    height: 16px;
  }
  .ptr-L { color: #569cd6; }
  .ptr-R { color: #f48771; }
  .ptr-M { color: #ddb100; }
  .target-badge {
    margin-top: 10px;
    font-size: 12px;
    color: #9cdcfe;
    font-family: monospace;
  }
</style>
</head>
<body>
  <div class="top-bar">
    <h1 id="title">Generating CodeReel...</h1>
    <p class="summary" id="summary"></p>
  </div>

  <div class="split-pane">
    <!-- LEFT: code animation -->
    <div class="left-pane">
      <div id="vizContainer" class="viz-container" style="display:none">
        <div class="viz-title">Data Structure</div>
        <div class="array-wrapper" id="arrayWrapper"></div>
        <div class="pointer-row" id="pointerRow"></div>
        <div class="target-badge" id="targetBadge"></div>
      </div>

      <div class="annotation-box">
        <div class="annotation-text" id="annotation">Waiting for CodeReel...</div>
        <div class="variables" id="variables"></div>
      </div>

      <div class="code-block" id="codeBlock"></div>

      <div class="controls">
        <button id="prevBtn" disabled>◀ Prev</button>
        <button class="play-btn" id="playBtn" disabled>▶ Play</button>
        <button id="nextBtn" disabled>Next ▶</button>
        <span class="progress" id="progress"></span>
        <div class="frame-dots" id="dots"></div>
      </div>
    </div>

    <!-- RIGHT: live app iframe -->
    <div class="right-pane">
      <div class="browser-label">Live App — localhost:${port}</div>
      <iframe class="browser-frame" src="http://localhost:${port}" id="appFrame"></iframe>
      <div class="ui-hint" id="uiHint"><span class="ui-hint-icon">👁</span> Click Play to see what changes in the UI</div>
    </div>
  </div>

<script>
  let frames = [];
  let codeLines = [];
  let current = -1;
  let playing = false;
  let timer = null;

  const titleEl = document.getElementById('title');
  const summaryEl = document.getElementById('summary');
  const codeBlock = document.getElementById('codeBlock');
  const annotation = document.getElementById('annotation');
  const variables = document.getElementById('variables');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const playBtn = document.getElementById('playBtn');
  const progress = document.getElementById('progress');
  const dotsContainer = document.getElementById('dots');

  // Listen for messages from the extension
  window.addEventListener('message', event => {
    const msg = event.data;
    if (!msg || !msg.type) return;

    if (msg.type === 'loading') {
      stopPlay();
      titleEl.textContent = 'Generating CodeReel...';
      summaryEl.textContent = '';
      annotation.textContent = 'Waiting for CodeReel...';
      codeBlock.innerHTML = '';
      dotsContainer.innerHTML = '';
      variables.innerHTML = '';
      progress.textContent = '';
      playBtn.disabled = true;
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      document.getElementById('vizContainer').style.display = 'none';
      return;
    }

    if (msg.type === 'error') {
      titleEl.textContent = 'CodeReel Error';
      summaryEl.textContent = '';
      annotation.textContent = msg.message;
      annotation.style.color = '#f48771';
      playBtn.disabled = true;
      return;
    }

    if (msg.type === 'storyboard') {
      stopPlay();
      frames = msg.frames;
      codeLines = msg.codeLines;
      current = -1;

      titleEl.textContent = msg.title;
      summaryEl.textContent = msg.summary;
      annotation.textContent = 'Press Play to start';
      annotation.style.color = '';
      variables.innerHTML = '';
      progress.textContent = 'Step 0 / ' + frames.length;
      playBtn.disabled = false;
      prevBtn.disabled = true;
      nextBtn.disabled = false;

      // Rebuild code lines
      codeBlock.innerHTML = '';
      codeLines.forEach((line, i) => {
        const div = document.createElement('div');
        div.className = 'code-line';
        div.id = 'line-' + i;
        div.textContent = line || ' ';
        codeBlock.appendChild(div);
      });

      // Rebuild dots
      dotsContainer.innerHTML = '';
      frames.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.id = 'dot-' + i;
        dotsContainer.appendChild(dot);
      });

      setTimeout(startPlay, 400);
    }
  });

  function renderViz(viz) {
    const container = document.getElementById('vizContainer');
    if (!viz || !viz.array) { container.style.display = 'none'; return; }
    container.style.display = 'block';

    const wrapper = document.getElementById('arrayWrapper');
    const pointerRow = document.getElementById('pointerRow');
    const targetBadge = document.getElementById('targetBadge');

    wrapper.innerHTML = '';
    pointerRow.innerHTML = '';

    const arr = viz.array;
    arr.forEach((val, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'array-cell-wrap';

      const cell = document.createElement('div');
      cell.className = 'array-cell';

      const inRange = (viz.left !== undefined && viz.right !== undefined)
        ? (i >= viz.left && i <= viz.right)
        : true;

      if (viz.found !== undefined && i === viz.found) {
        cell.classList.add('found-cell');
      } else if (viz.mid !== undefined && i === viz.mid) {
        cell.classList.add('mid-cell');
      } else if (inRange) {
        cell.classList.add('active-range');
      } else {
        cell.classList.add('inactive');
      }

      cell.textContent = val;

      const idx = document.createElement('div');
      idx.className = 'cell-index';
      idx.textContent = i;

      wrap.appendChild(cell);
      wrap.appendChild(idx);
      wrapper.appendChild(wrap);

      // pointer label slot
      const slot = document.createElement('div');
      slot.className = 'pointer-slot';
      const labels = [];
      if (viz.left !== undefined && i === viz.left) labels.push('<span class="ptr-L">L</span>');
      if (viz.right !== undefined && i === viz.right) labels.push('<span class="ptr-R">R</span>');
      if (viz.mid !== undefined && i === viz.mid) labels.push('<span class="ptr-M">M</span>');
      slot.innerHTML = labels.join(' ');
      pointerRow.appendChild(slot);
    });

    targetBadge.textContent = viz.target !== undefined ? 'target = ' + viz.target : '';
  }

  function showFrame(index) {
    // Clear highlights
    document.querySelectorAll('.code-line').forEach(el => el.classList.remove('highlight'));
    document.querySelectorAll('.dot').forEach(el => el.classList.remove('active'));

    if (index < 0 || index >= frames.length) return;

    const frame = frames[index];
    const [start, end] = frame.lines;

    // Highlight lines (1-indexed)
    for (let i = start - 1; i <= end - 1; i++) {
      const el = document.getElementById('line-' + i);
      if (el) {
        el.classList.add('highlight');
        if (i === start - 1) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }

    annotation.textContent = frame.annotation;
    renderViz(frame.viz);

    const uiHint = document.getElementById('uiHint');
    if (frame.uiHint) {
      uiHint.innerHTML = '<span class="ui-hint-icon">👁</span> ' + frame.uiHint;
      uiHint.style.display = 'block';
    } else {
      uiHint.style.display = 'none';
    }

    const appFrame = document.getElementById('appFrame');
    if (frame.appState && appFrame && appFrame.contentWindow) {
      appFrame.contentWindow.postMessage({ type: 'codereel', ...frame.appState }, '*');
    }

    variables.innerHTML = '';
    Object.entries(frame.variables).forEach(([k, v]) => {
      const chip = document.createElement('div');
      chip.className = 'var-chip';
      chip.textContent = k + ' = ' + v;
      variables.appendChild(chip);
    });

    document.getElementById('dot-' + index).classList.add('active');
    progress.textContent = 'Step ' + (index + 1) + ' / ' + frames.length;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === frames.length - 1;
  }

  function next() {
    if (current < frames.length - 1) {
      current++;
      showFrame(current);
    } else {
      stopPlay();
    }
  }

  function prev() {
    if (current > 0) { current--; showFrame(current); }
  }

  function startPlay() {
    playing = true;
    playBtn.textContent = '⏸ Pause';
    if (current >= frames.length - 1) current = -1;
    timer = setInterval(() => {
      if (current < frames.length - 1) {
        current++;
        showFrame(current);
      } else {
        stopPlay();
      }
    }, 1800);
  }

  function stopPlay() {
    playing = false;
    clearInterval(timer);
    playBtn.textContent = '▶ Play';
  }

  playBtn.addEventListener('click', () => playing ? stopPlay() : startPlay());
  nextBtn.addEventListener('click', () => { stopPlay(); next(); });
  prevBtn.addEventListener('click', () => { stopPlay(); prev(); });
</script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

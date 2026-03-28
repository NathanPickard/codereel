import * as vscode from 'vscode';

export class CodeReelCodeLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];
    const text = document.getText();
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
      if (match) {
        const functionName = match[1];
        const startLine = i;
        const code = extractFunctionCode(lines, i);
        const range = new vscode.Range(startLine, 0, startLine, lines[i].length);
        lenses.push(
          new vscode.CodeLens(range, {
            title: '▶ Explain with CodeReel',
            command: 'codereel.explain',
            arguments: [{ code, functionName }],
          })
        );
      }
    }
    return lenses;
  }
}

function extractFunctionCode(lines: string[], startLine: number): string {
  let braceCount = 0;
  let started = false;
  const result: string[] = [];

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    result.push(line);
    for (const ch of line) {
      if (ch === '{') { braceCount++; started = true; }
      if (ch === '}') { braceCount--; }
    }
    if (started && braceCount === 0) break;
  }
  return result.join('\n');
}

import * as vscode from 'vscode';
import { CodeReelCodeLensProvider } from './codeLensProvider';
import { explainFunction } from './claude';
import { CodeReelPanel } from './webviewPanel';

export function activate(context: vscode.ExtensionContext) {
  const codeLensProvider = new CodeReelCodeLensProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      [
        { language: 'javascript' },
        { language: 'typescript' },
        { language: 'javascriptreact' },
        { language: 'typescriptreact' },
      ],
      codeLensProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codereel.explain', async (args: { code: string; functionName: string }) => {
      const apiKey =
        process.env.ANTHROPIC_API_KEY ||
        vscode.workspace.getConfiguration('codereel').get<string>('apiKey') ||
        '';

      if (!apiKey) {
        vscode.window.showErrorMessage(
          'CodeReel: No API key found. Set codereel.apiKey in VS Code settings.'
        );
        return;
      }

      const port = vscode.workspace.getConfiguration('codereel').get<number>('appPort') ?? 5173;
      const panel = CodeReelPanel.createOrShow(context.extensionUri, args.functionName, port);
      panel.showLoading();

      try {
        const storyboard = await explainFunction(apiKey, args.code, args.functionName);
        panel.render(storyboard, args.code);
      } catch (err: any) {
        panel.showError(err.message ?? 'Unknown error');
      }
    })
  );
}

export function deactivate() {}

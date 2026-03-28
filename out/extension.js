"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const codeLensProvider_1 = require("./codeLensProvider");
const claude_1 = require("./claude");
const webviewPanel_1 = require("./webviewPanel");
function activate(context) {
    const codeLensProvider = new codeLensProvider_1.CodeReelCodeLensProvider();
    context.subscriptions.push(vscode.languages.registerCodeLensProvider([
        { language: 'javascript' },
        { language: 'typescript' },
        { language: 'javascriptreact' },
        { language: 'typescriptreact' },
    ], codeLensProvider));
    context.subscriptions.push(vscode.commands.registerCommand('codereel.explain', async (args) => {
        const apiKey = process.env.ANTHROPIC_API_KEY ||
            vscode.workspace.getConfiguration('codereel').get('apiKey') ||
            '';
        if (!apiKey) {
            vscode.window.showErrorMessage('CodeReel: No API key found. Set codereel.apiKey in VS Code settings.');
            return;
        }
        const panel = webviewPanel_1.CodeReelPanel.createOrShow(context.extensionUri, args.functionName);
        panel.showLoading();
        try {
            const storyboard = await (0, claude_1.explainFunction)(apiKey, args.code, args.functionName);
            panel.render(storyboard, args.code);
        }
        catch (err) {
            panel.showError(err.message ?? 'Unknown error');
        }
    }));
}
function deactivate() { }

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
exports.CodeReelCodeLensProvider = void 0;
const vscode = __importStar(require("vscode"));
class CodeReelCodeLensProvider {
    provideCodeLenses(document) {
        const lenses = [];
        const text = document.getText();
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(/^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
            if (match) {
                const functionName = match[1];
                const startLine = i;
                const code = extractFunctionCode(lines, i);
                const range = new vscode.Range(startLine, 0, startLine, lines[i].length);
                lenses.push(new vscode.CodeLens(range, {
                    title: '▶ Explain with CodeReel',
                    command: 'codereel.explain',
                    arguments: [{ code, functionName }],
                }));
            }
        }
        return lenses;
    }
}
exports.CodeReelCodeLensProvider = CodeReelCodeLensProvider;
function extractFunctionCode(lines, startLine) {
    let braceCount = 0;
    let started = false;
    const result = [];
    for (let i = startLine; i < lines.length; i++) {
        const line = lines[i];
        result.push(line);
        for (const ch of line) {
            if (ch === '{') {
                braceCount++;
                started = true;
            }
            if (ch === '}') {
                braceCount--;
            }
        }
        if (started && braceCount === 0)
            break;
    }
    return result.join('\n');
}

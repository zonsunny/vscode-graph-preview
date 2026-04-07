// src/codelens-provider.ts
import * as vscode from 'vscode';
import { GraphBlock } from './types';
import { detectGraphBlocks } from './detector';

export class GraphCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    const blocks = detectGraphBlocks(document);
    const lenses: vscode.CodeLens[] = [];

    for (const block of blocks) {
      const range = new vscode.Range(
        block.fenceRange.start,
        new vscode.Position(block.fenceRange.start.line, Number.MAX_VALUE)
      );

      // Add "Preview" CodeLens
      lenses.push(
        new vscode.CodeLens(range, {
          title: '$(play) Preview',
          command: 'graph-preview.openPanel',
          tooltip: 'Open diagram in preview panel',
        })
      );

      // Add "Export SVG" CodeLens
      lenses.push(
        new vscode.CodeLens(range, {
          title: '$(export) Export',
          command: 'graph-preview.exportSVG',
          tooltip: 'Export diagram as SVG',
        })
      );
    }

    return lenses;
  }

  public refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }
}

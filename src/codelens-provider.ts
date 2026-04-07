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

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const range = new vscode.Range(
        block.fenceRange.start,
        new vscode.Position(block.fenceRange.start.line, Number.MAX_VALUE)
      );

      // Add "Preview" CodeLens - pass block data as arguments
      lenses.push(
        new vscode.CodeLens(range, {
          title: '$(play) Preview',
          command: 'graph-preview.renderBlock',
          arguments: [{
            id: block.id,
            language: block.language,
            code: block.code,
            range: [block.range.start.line, block.range.end.line],
            fenceRange: [block.fenceRange.start.line, block.fenceRange.end.line],
          }],
          tooltip: 'Open diagram in preview panel',
        })
      );

      // Add "Export SVG" CodeLens
      lenses.push(
        new vscode.CodeLens(range, {
          title: '$(export) SVG',
          command: 'graph-preview.exportSVG',
          arguments: [block],
          tooltip: 'Export diagram as SVG',
        })
      );

      // Add "Export PNG" CodeLens
      lenses.push(
        new vscode.CodeLens(range, {
          title: '$(file-media) PNG',
          command: 'graph-preview.exportPNG',
          arguments: [block],
          tooltip: 'Export diagram as PNG',
        })
      );
    }

    return lenses;
  }

  public refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }
}

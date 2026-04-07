// src/hover-provider.ts
import * as vscode from 'vscode';
import { GraphBlock, GraphLanguage } from './types';
import { detectGraphBlocks } from './detector';
import { PreviewPanel } from './preview-panel';

export class GraphHoverProvider implements vscode.HoverProvider {
  private previewPanel: PreviewPanel;

  constructor(previewPanel: PreviewPanel) {
    this.previewPanel = previewPanel;
  }

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    // Detect all graph blocks in the document
    const blocks = detectGraphBlocks(document);

    // Find the block at the current position
    const block = blocks.find(b => b.fenceRange.contains(position));

    if (!block) {
      return undefined;
    }

    // Create hover content
    const hoverContent = this.createHoverContent(block);

    return new vscode.Hover(hoverContent, block.fenceRange);
  }

  private createHoverContent(block: GraphBlock): vscode.MarkdownString {
    const md = new vscode.MarkdownString(undefined, true);
    md.isTrusted = true;
    md.supportHtml = true;

    // Add preview button
    const languageLabel = this.getLanguageLabel(block.language);
    md.appendMarkdown(`### 📊 ${languageLabel} Diagram Preview\n\n`);
    md.appendMarkdown(`[Open in Preview Panel](command:graph-preview.openPanel)\n\n`);
    md.appendMarkdown(`---\n\n`);

    // Add code preview (truncated)
    const codePreview = this.truncateCode(block.code);
    md.appendCodeblock(codePreview, block.language === 'dot' ? 'dot' : block.language);

    return md;
  }

  private getLanguageLabel(language: GraphLanguage): string {
    switch (language) {
      case 'mermaid':
        return 'Mermaid';
      case 'dot':
        return 'Graphviz DOT';
      case 'plantuml':
        return 'PlantUML';
    }
  }

  private truncateCode(code: string, maxLength: number = 200): string {
    const lines = code.split('\n');
    if (lines.length <= 6 && code.length <= maxLength) {
      return code;
    }

    const firstLines = lines.slice(0, 5).join('\n');
    const remaining = lines.length - 5;

    if (remaining > 0) {
      return `${firstLines}\n\n... (${remaining} more lines)`;
    }

    return firstLines;
  }
}

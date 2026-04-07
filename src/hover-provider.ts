// src/hover-provider.ts
import * as vscode from 'vscode';
import { GraphBlock, GraphLanguage } from './types';
import { detectGraphBlocks } from './detector';

export class GraphHoverProvider implements vscode.HoverProvider {
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

    // Create hover content with clickable link
    const md = new vscode.MarkdownString(undefined, true);
    md.isTrusted = true;
    md.supportHtml = true;

    const languageLabel = this.getLanguageLabel(block.language);
    md.appendMarkdown(`### 📊 ${languageLabel} Diagram\n\n`);

    // Add clickable command link
    md.appendMarkdown(`[▶ Preview in Panel](command:graph-preview.renderBlock?${encodeURIComponent(JSON.stringify([{
      id: block.id,
      language: block.language,
      code: block.code,
      range: [block.range.start.line, block.range.end.line],
      fenceRange: [block.fenceRange.start.line, block.fenceRange.end.line],
    }]))})\n\n`);

    // Add code preview (truncated)
    const codePreview = this.truncateCode(block.code);
    md.appendMarkdown(`**Preview:**\n\n`);
    md.appendCodeblock(codePreview, block.language === 'dot' ? 'dot' : block.language);

    return new vscode.Hover(md, block.fenceRange);
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

  private truncateCode(code: string, maxLength: number = 150): string {
    const lines = code.split('\n');
    if (lines.length <= 5 && code.length <= maxLength) {
      return code;
    }

    const firstLines = lines.slice(0, 5).join('\n');
    const remaining = lines.length - 5;

    if (remaining > 0) {
      return `${firstLines}\n... (${remaining} more lines)`;
    }

    return firstLines;
  }
}

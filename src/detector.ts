import * as vscode from 'vscode';
import { createHash } from 'crypto';
import { GraphBlock, GraphLanguage, ClipboardDetectionResult } from './types';
import { isValidGraphContent, normalizeLanguage, isValidMermaid, isValidDot, isValidPlantUml } from './validator';

const FENCE_PATTERN = /```(mermaid|dot|graphviz|plantuml|puml)\s*\n([\s\S]*?)```/g;

export function detectGraphBlocks(document: vscode.TextDocument): GraphBlock[] {
  const blocks: GraphBlock[] = [];
  const text = document.getText();

  let match;
  while ((match = FENCE_PATTERN.exec(text)) !== null) {
    const language = normalizeLanguage(match[1]);
    if (!language) continue;

    const code = match[2].trim();
    if (!isValidGraphContent(language, code)) continue;

    const startPos = document.positionAt(match.index);
    const endPos = document.positionAt(match.index + match[0].length);

    const codeStartLine = startPos.line + 1;
    const codeEndLine = endPos.line - 1;

    blocks.push({
      id: generateBlockId(code, language),
      language,
      code,
      range: new vscode.Range(
        new vscode.Position(codeStartLine, 0),
        new vscode.Position(codeEndLine, Number.MAX_VALUE)
      ),
      fenceRange: new vscode.Range(startPos, endPos),
    });
  }

  return blocks;
}

export function detectClipboardContent(text: string): ClipboardDetectionResult {
  // Format 1: Fenced code block
  const fencedMatch = text.match(/```(mermaid|dot|graphviz|plantuml|puml)\s*\n([\s\S]*?)```/);
  if (fencedMatch) {
    const language = normalizeLanguage(fencedMatch[1]);
    const code = fencedMatch[2].trim();
    if (language && isValidGraphContent(language, code)) {
      return { status: 'success', block: { language, code } };
    }
  }

  // Format 2: Pure code (try to infer language)
  const trimmed = text.trim();
  if (!trimmed) {
    return { status: 'invalid' };
  }

  const candidates: GraphLanguage[] = [];
  if (isValidMermaid(trimmed)) candidates.push('mermaid');
  if (isValidDot(trimmed)) candidates.push('dot');
  if (isValidPlantUml(trimmed)) candidates.push('plantuml');

  if (candidates.length === 1) {
    return { status: 'success', block: { language: candidates[0], code: trimmed } };
  }

  if (candidates.length > 1) {
    return { status: 'ambiguous', candidates };
  }

  return { status: 'invalid' };
}

export function getVisibleBlocks(
  blocks: GraphBlock[],
  visibleRange: vscode.Range
): GraphBlock[] {
  return blocks.filter(block => {
    const blockRange = block.fenceRange;
    return visibleRange.intersection(blockRange) !== undefined;
  });
}

export function findBlockAtPosition(
  blocks: GraphBlock[],
  position: vscode.Position
): GraphBlock | undefined {
  return blocks.find(block => block.fenceRange.contains(position));
}

function generateBlockId(code: string, language: GraphLanguage): string {
  return `${language}-${createHash('md5').update(code).digest('hex').slice(0, 8)}`;
}
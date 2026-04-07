// src/editor-watcher.ts
import * as vscode from 'vscode';
import { GraphBlock } from './types';
import { detectGraphBlocks, getVisibleBlocks, findBlockAtPosition } from './detector';
import { debounce } from './utils';
import { getConfig } from './config';

export class EditorWatcher {
  private disposables: vscode.Disposable[] = [];
  private currentBlocks: GraphBlock[] = [];
  private _onBlocksDetected?: (blocks: GraphBlock[]) => void;
  private _onVisibleBlocksChanged?: (blocks: GraphBlock[]) => void;

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    // Watch for active editor changes
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
          this.detectBlocks(editor.document);
        }
      })
    );

    // Watch for document changes
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
          this.debouncedDetect(event.document);
        }
      })
    );

    // Watch for visible range changes (scroll)
    this.disposables.push(
      vscode.window.onDidChangeTextEditorVisibleRanges(event => {
        if (event.visibleRanges.length > 0) {
          const blocks = getVisibleBlocks(this.currentBlocks, event.visibleRanges[0]);
          this._onVisibleBlocksChanged?.(blocks);
        }
      })
    );

    // Initial detection
    if (vscode.window.activeTextEditor) {
      this.detectBlocks(vscode.window.activeTextEditor.document);
    }
  }

  private debouncedDetect = debounce((document: vscode.TextDocument) => {
    this.detectBlocks(document);
  }, getConfig().debounceDelay);

  private detectBlocks(document: vscode.TextDocument): void {
    this.currentBlocks = detectGraphBlocks(document);
    this._onBlocksDetected?.(this.currentBlocks);
  }

  public getBlocks(): GraphBlock[] {
    return this.currentBlocks;
  }

  public getBlockAtPosition(position: vscode.Position): GraphBlock | undefined {
    return findBlockAtPosition(this.currentBlocks, position);
  }

  public onBlocksDetected(callback: (blocks: GraphBlock[]) => void): void {
    this._onBlocksDetected = callback;
  }

  public onVisibleBlocksChanged(callback: (blocks: GraphBlock[]) => void): void {
    this._onVisibleBlocksChanged = callback;
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}
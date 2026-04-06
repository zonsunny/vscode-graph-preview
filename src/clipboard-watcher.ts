import * as vscode from 'vscode';
import { GraphLanguage } from './types';
import { detectClipboardContent } from './detector';

export class ClipboardWatcher {
  private intervalId: ReturnType<typeof setInterval> | undefined;
  private lastContent: string = '';
  private onClipboardDetected?: (result: { language: GraphLanguage; code: string }) => void;
  private onAmbiguous?: (candidates: GraphLanguage[], code: string) => void;
  private enabled = true;

  constructor() {}

  public start(): void {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(async () => {
      if (!this.enabled) {
        return;
      }

      try {
        const text = await vscode.env.clipboard.readText();

        // Skip if same content
        if (text === this.lastContent) {
          return;
        }

        this.lastContent = text;

        const result = detectClipboardContent(text);

        if (result.status === 'success' && result.block) {
          this.onClipboardDetected?.(result.block);
        } else if (result.status === 'ambiguous' && result.candidates) {
          this.onAmbiguous?.(result.candidates, text.trim());
        }
      } catch (err) {
        // Ignore clipboard read errors
      }
    }, 500);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  public isRunning(): boolean {
    return this.intervalId !== undefined;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public onClipboardDetected(callback: (result: { language: GraphLanguage; code: string }) => void): void {
    this.onClipboardDetected = callback;
  }

  public onAmbiguous(callback: (candidates: GraphLanguage[], code: string) => void): void {
    this.onAmbiguous = callback;
  }

  public dispose(): void {
    this.stop();
  }
}
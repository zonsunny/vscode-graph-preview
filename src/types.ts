import * as vscode from 'vscode';

export type GraphLanguage = 'mermaid' | 'dot' | 'plantuml';

export interface GraphBlock {
  id: string;
  language: GraphLanguage;
  code: string;
  range: vscode.Range;
  fenceRange: vscode.Range;
}

export interface ClipboardDetectionResult {
  status: 'success' | 'ambiguous' | 'invalid';
  block?: { language: GraphLanguage; code: string };
  candidates?: GraphLanguage[];
}

// Extension → Webview messages
export interface RenderMessage {
  type: 'render';
  id: string;
  language: GraphLanguage;
  code: string;
  theme: 'light' | 'dark';
}

export interface ConfigMessage {
  type: 'config';
  plantumlServerUrl: string;
  mermaidTheme: string;
}

// Webview → Extension messages
export interface ReadyMessage {
  type: 'ready';
}

export interface RenderedMessage {
  type: 'rendered';
  id: string;
  success: boolean;
  error?: string;
}

export interface ExportMessage {
  type: 'export';
  id: string;
  format: 'svg' | 'png';
  data: string;
}

export type WebviewMessage = ReadyMessage | RenderedMessage | ExportMessage;
export type ExtensionMessage = RenderMessage | ConfigMessage;

export interface ExtensionConfig {
  autoOpen: boolean;
  watchClipboard: boolean;
  debounceDelay: number;
  plantumlServerUrl: string;
  mermaidTheme: string;
  largeDiagramThreshold: number;
  renderTimeout: number;
}
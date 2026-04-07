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

export interface DisableClipboardMessage {
  type: 'disableClipboard';
}

export interface ShowEmptyMessage {
  type: 'showEmpty';
}

export interface ShowErrorMessage {
  type: 'showError';
  message: string;
}

export interface LanguageSelectMessage {
  type: 'languageSelect';
  candidates: GraphLanguage[];
  code: string;
}

export interface ClipboardStateChangedMessage {
  type: 'clipboardStateChanged';
  enabled: boolean;
}

export interface SelectBlockMessage {
  type: 'selectBlock';
  index: number;
}

export type WebviewMessage = ReadyMessage | RenderedMessage | ExportMessage | DisableClipboardMessage | SelectBlockMessage;
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
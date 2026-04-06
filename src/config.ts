import * as vscode from 'vscode';
import { ExtensionConfig } from './types';

export function getConfig(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration('graph-preview');

  return {
    autoOpen: config.get('autoOpen', true),
    watchClipboard: config.get('watchClipboard', true),
    debounceDelay: config.get('debounceDelay', 300),
    plantumlServerUrl: config.get('plantuml.serverUrl', 'https://www.plantuml.com/plantuml'),
    mermaidTheme: config.get('mermaid.theme', 'default'),
    largeDiagramThreshold: config.get('largeDiagramThreshold', 500),
    renderTimeout: config.get('renderTimeout', 5000),
  };
}

export function getTheme(): 'light' | 'dark' {
  const currentTheme = vscode.window.activeColorTheme;
  return currentTheme.kind === vscode.ColorThemeKind.Dark ? 'dark' : 'light';
}
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { PreviewPanel } from './preview-panel';
import { EditorWatcher } from './editor-watcher';
import { ClipboardWatcher } from './clipboard-watcher';
import { GraphHoverProvider } from './hover-provider';
import { detectClipboardContent } from './detector';
import { getConfig } from './config';
import { showLanguageQuickPick } from './utils';
import { GraphLanguage } from './types';

let previewPanel: PreviewPanel;
let editorWatcher: EditorWatcher;
let clipboardWatcher: ClipboardWatcher;

export function activate(context: vscode.ExtensionContext) {
  previewPanel = new PreviewPanel(context.extensionUri);
  editorWatcher = new EditorWatcher();
  clipboardWatcher = new ClipboardWatcher();

  // Register commands
  const openPanelCommand = vscode.commands.registerCommand(
    'graph-preview.openPanel',
    () => {
      previewPanel.show();
    }
  );

  // Export SVG command
  const exportSVGCommand = vscode.commands.registerCommand(
    'graph-preview.exportSVG',
    async () => {
      previewPanel.requestExport('svg');
    }
  );

  // Export PNG command
  const exportPNGCommand = vscode.commands.registerCommand(
    'graph-preview.exportPNG',
    async () => {
      previewPanel.requestExport('png');
    }
  );

  // Register hover provider for supported languages
  const hoverProvider = new GraphHoverProvider(previewPanel);
  const hoverProviderDisposable = vscode.languages.registerHoverProvider(
    [
      { language: 'markdown', scheme: '*' },
      { language: 'plaintext', scheme: '*' },
    ],
    hoverProvider
  );

  const renderFromClipboardCommand = vscode.commands.registerCommand(
    'graph-preview.renderFromClipboard',
    async () => {
      const text = await vscode.env.clipboard.readText();
      const result = detectClipboardContent(text);

      if (result.status === 'success' && result.block) {
        previewPanel.show();
        previewPanel.render({
          id: `clipboard-${Date.now()}`,
          language: result.block.language,
          code: result.block.code,
          range: new vscode.Range(0, 0, 0, 0),
          fenceRange: new vscode.Range(0, 0, 0, 0),
        });
      } else if (result.status === 'ambiguous' && result.candidates) {
        previewPanel.show();
        previewPanel.showLanguageSelect(result.candidates, text.trim());
      } else {
        vscode.window.showWarningMessage('No valid diagram code detected in clipboard');
      }
    }
  );

  // Setup editor watcher callbacks
  editorWatcher.onBlocksDetected((blocks) => {
    const config = getConfig();

    if (blocks.length > 0 && config.autoOpen) {
      previewPanel.show();
      previewPanel.render(blocks[0]);
    } else if (blocks.length === 0) {
      previewPanel.showEmpty();
    }
  });

  // Setup clipboard watcher callbacks
  clipboardWatcher.onClipboardDetected((block) => {
    const config = getConfig();
    if (config.watchClipboard && previewPanel.isClipboardWatching()) {
      previewPanel.show();
      previewPanel.render({
        id: `clipboard-${Date.now()}`,
        language: block.language,
        code: block.code,
        range: new vscode.Range(0, 0, 0, 0),
        fenceRange: new vscode.Range(0, 0, 0, 0),
      });
    }
  });

  clipboardWatcher.onAmbiguous((candidates, code) => {
    const config = getConfig();
    if (config.watchClipboard && previewPanel.isClipboardWatching()) {
      previewPanel.show();
      previewPanel.showLanguageSelect(candidates, code);
    }
  });

  // Setup preview panel message handler
  previewPanel.onMessage(async (message) => {
    switch (message.type) {
      case 'languageSelected':
        // Handle language selection from webview
        break;

      case 'exportSVG':
        await saveFile(message.data, 'svg');
        break;

      case 'exportPNG':
        await saveFile(message.data, 'png');
        break;

      case 'exportError':
        vscode.window.showErrorMessage(`Export failed: ${message.error}`);
        break;
    }
  });

  async function saveFile(data: string, format: 'svg' | 'png') {
    const defaultPath = path.join(
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
      `diagram.${format}`
    );

    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(defaultPath),
      filters: {
        [format.toUpperCase()]: [format],
      },
    });

    if (uri) {
      let content: Buffer;
      if (format === 'png' && data.startsWith('data:image/png;base64,')) {
        content = Buffer.from(data.split(',')[1], 'base64');
      } else {
        content = Buffer.from(data, 'utf-8');
      }
      await fs.promises.writeFile(uri.fsPath, content);
      vscode.window.showInformationMessage(`Exported to ${uri.fsPath}`);
    }
  }

  // Start clipboard watcher if enabled
  const config = getConfig();
  if (config.watchClipboard) {
    clipboardWatcher.start();
  }

  // Watch for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('graph-preview.watchClipboard')) {
        const newConfig = getConfig();
        if (newConfig.watchClipboard) {
          clipboardWatcher.start();
        } else {
          clipboardWatcher.stop();
        }
      }
    })
  );

  // Register disposables
  context.subscriptions.push(
    openPanelCommand,
    exportSVGCommand,
    exportPNGCommand,
    renderFromClipboardCommand,
    hoverProviderDisposable,
    previewPanel,
    editorWatcher,
    clipboardWatcher
  );
}

export function deactivate() {
  previewPanel.dispose();
  editorWatcher.dispose();
  clipboardWatcher.dispose();
}

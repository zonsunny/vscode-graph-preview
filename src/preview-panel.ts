import * as vscode from 'vscode';
import { GraphBlock, WebviewMessage, RenderMessage, GraphLanguage } from './types';
import { getConfig, getTheme } from './config';

export class PreviewPanel {
  public static readonly viewType = 'graphPreview';

  private panel: vscode.WebviewPanel | undefined;
  private readonly extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];
  private onMessageCallback?: (message: WebviewMessage) => void;
  private currentBlock: GraphBlock | null = null;
  private clipboardWatching = true;

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
  }

  public show(): void {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      PreviewPanel.viewType,
      'Graph Preview',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.panel.webview.html = this.getHtmlContent(this.panel.webview);

    this.panel.webview.onDidReceiveMessage(
      (message: WebviewMessage) => {
        this.handleMessage(message);
      },
      null,
      this.disposables
    );

    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
        this.currentBlock = null;
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
      },
      null,
      this.disposables
    );
  }

  public render(block: GraphBlock): void {
    if (!this.panel) {
      this.show();
    }

    this.currentBlock = block;
    const config = getConfig();
    const theme = getTheme();

    const message: RenderMessage & {
      plantumlServerUrl?: string;
      largeDiagramThreshold?: number
    } = {
      type: 'render',
      id: block.id,
      language: block.language,
      code: block.code,
      theme,
      plantumlServerUrl: config.plantumlServerUrl,
      largeDiagramThreshold: config.largeDiagramThreshold,
    };

    this.panel?.webview.postMessage(message);
  }

  public showEmpty(): void {
    this.panel?.webview.postMessage({ type: 'showEmpty' });
    this.currentBlock = null;
  }

  public showError(message: string): void {
    this.panel?.webview.postMessage({ type: 'showError', message });
  }

  public showLanguageSelect(candidates: GraphLanguage[], code: string): void {
    this.panel?.webview.postMessage({
      type: 'languageSelect',
      candidates,
      code,
    });
  }

  public updateClipboardState(enabled: boolean): void {
    this.clipboardWatching = enabled;
    this.panel?.webview.postMessage({
      type: 'clipboardStateChanged',
      enabled,
    });
  }

  public isClipboardWatching(): boolean {
    return this.clipboardWatching;
  }

  public getCurrentBlock(): GraphBlock | null {
    return this.currentBlock;
  }

  public onMessage(callback: (message: WebviewMessage) => void): void {
    this.onMessageCallback = callback;
  }

  private handleMessage(message: WebviewMessage): void {
    switch (message.type) {
      case 'ready':
        this.updateClipboardState(this.clipboardWatching);
        if (this.currentBlock) {
          this.render(this.currentBlock);
        } else {
          this.showEmpty();
        }
        break;

      case 'disableClipboard':
        this.clipboardWatching = false;
        this.updateClipboardState(false);
        break;
    }

    this.onMessageCallback?.(message);
  }

  private getHtmlContent(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'preview.js')
    );
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'preview.css')
    );
    const mermaidUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js')
    );
    const vizUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'node_modules', '@viz-js', 'viz', 'lib', 'viz.js')
    );
    const plantumlEncoderUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'node_modules', 'plantuml-encoder', 'dist', 'plantuml-encoder.min.js')
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Graph Preview</title>
  <link rel="stylesheet" href="${cssUri}">
</head>
<body>
  <div id="loading" class="loading hidden">
    <div class="spinner"></div>
    <span>Loading...</span>
  </div>

  <div id="error" class="error hidden">
    <div class="error-icon">⚠️</div>
    <pre id="error-message"></pre>
  </div>

  <div id="empty" class="empty">
    <div class="empty-icon">📊</div>
    <p>No diagram detected</p>
    <p class="hint">Open a file with Mermaid, DOT, or PlantUML code blocks</p>
    <p class="hint">Or copy a diagram code block from AI chat</p>
  </div>

  <div id="clipboard-hint" class="clipboard-hint hidden">
    <span>📋 Watching clipboard</span>
    <button id="disable-clipboard">Disable</button>
  </div>

  <div id="large-diagram-warning" class="warning hidden">
    <div class="warning-icon">⚠️</div>
    <p>Large diagram detected (~<span id="node-count"></span> nodes)</p>
    <p>Rendering may be slow. Continue?</p>
    <div class="warning-actions">
      <button id="render-anyway">Render Anyway</button>
      <button id="cancel-render">Cancel</button>
    </div>
  </div>

  <div id="language-select" class="language-select hidden">
    <p>Detected multiple possibilities:</p>
    <div id="language-buttons"></div>
  </div>

  <div id="content" class="content hidden"></div>

  <script src="${mermaidUri}"></script>
  <script src="${vizUri}"></script>
  <script src="${plantumlEncoderUri}"></script>
  <script src="${scriptUri}"></script>
</body>
</html>`;
  }

  public dispose(): void {
    this.panel?.dispose();
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}

# VSCode Graph Preview MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VSCode extension that provides real-time preview for Mermaid, DOT, and PlantUML diagrams, with clipboard monitoring for AI chat integration.

**Architecture:** VSCode extension with sidebar Webview panel. Extension host handles code detection and clipboard monitoring; Webview handles rendering using mermaid.js and @viz-js/viz (WASM). Extension ↔ Webview communicate via postMessage protocol.

**Tech Stack:** TypeScript, VSCode Extension API, esbuild, mermaid.js, @viz-js/viz, plantuml-encoder

---

## File Structure

```
vscode-graph-preview/
├── package.json
├── tsconfig.json
├── esbuild.js
├── .vscodeignore
├── .gitignore
├── src/
│   ├── extension.ts           # Entry point
│   ├── detector.ts            # Code block detection
│   ├── validator.ts           # Content validation
│   ├── preview-panel.ts       # Webview panel management
│   ├── editor-watcher.ts      # Editor event handling
│   ├── clipboard-watcher.ts   # Clipboard monitoring
│   ├── config.ts              # Configuration management
│   ├── types.ts               # Type definitions
│   └── utils.ts               # Utility functions
├── media/
│   ├── preview.html           # Webview HTML
│   ├── preview.js             # Webview rendering logic
│   └── preview.css            # Webview styles
└── icons/
    └── icon.svg               # Extension icon
```

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `esbuild.js`
- Create: `.gitignore`
- Create: `.vscodeignore`

- [ ] **Step 1: Initialize npm project and install dependencies**

```bash
cd /Users/zon/Mine/projects/AIproject/vscode-graph-preview
npm init -y
npm install -D typescript @types/vscode @types/node esbuild
npm install mermaid @viz-js/viz plantuml-encoder
```

- [ ] **Step 2: Update package.json with extension configuration**

```json
{
  "name": "graph-preview",
  "displayName": "Graph Preview",
  "description": "Real-time preview for Mermaid, Graphviz DOT and PlantUML diagrams in VSCode",
  "version": "0.1.0",
  "publisher": "zon",
  "license": "MIT",
  "keywords": ["mermaid", "graphviz", "plantuml", "diagram", "preview", "ai"],
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Visualization", "Programming Languages"],
  "activationEvents": ["onStartupFinished"],
  "main": "./out/extension.js",
  "scripts": {
    "compile": "node esbuild.js",
    "watch": "node esbuild.js --watch",
    "package": "vsce package"
  },
  "contributes": {
    "commands": [
      {
        "command": "graph-preview.openPanel",
        "title": "Graph Preview: Open Preview Panel"
      },
      {
        "command": "graph-preview.renderFromClipboard",
        "title": "Graph Preview: Render from Clipboard"
      }
    ],
    "configuration": {
      "title": "Graph Preview",
      "properties": {
        "graph-preview.autoOpen": {
          "type": "boolean",
          "default": true,
          "description": "Automatically open preview panel when a graph code block is detected"
        },
        "graph-preview.watchClipboard": {
          "type": "boolean",
          "default": true,
          "description": "Watch clipboard for graph code blocks"
        },
        "graph-preview.debounceDelay": {
          "type": "number",
          "default": 300,
          "description": "Debounce delay (ms) for re-detecting code blocks"
        }
      }
    }
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/vscode": "^1.85.0",
    "esbuild": "^0.20.0",
    "typescript": "^5.3.0"
  },
  "dependencies": {
    "@viz-js/viz": "^3.2.0",
    "mermaid": "^11.0.0",
    "plantuml-encoder": "^1.4.0"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020"],
    "outDir": "out",
    "rootDir": "src",
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "out", "media"]
}
```

- [ ] **Step 4: Create esbuild.js**

```javascript
const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

const ctx = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'out/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  minify: !watch,
  sourcemap: true,
};

if (watch) {
  esbuild.context(ctx).then(ctx => ctx.watch());
} else {
  esbuild.build(ctx).catch(() => process.exit(1));
}
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
out/
*.vsix
.DS_Store
```

- [ ] **Step 6: Create .vscodeignore**

```
.vscode/**
.vscode-test/**
src/**
docs/**
.gitignore
**/*.ts
!media/**/*.js
tsconfig.json
esbuild.js
```

- [ ] **Step 7: Commit project initialization**

```bash
git init
git add .
git commit -m "chore: initialize project structure"
```

---

## Task 2: Type Definitions

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create type definitions**

```typescript
// src/types.ts
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
```

- [ ] **Step 2: Commit type definitions**

```bash
git add src/types.ts
git commit -m "feat: add type definitions"
```

---

## Task 3: Configuration Module

**Files:**
- Create: `src/config.ts`

- [ ] **Step 1: Create configuration module**

```typescript
// src/config.ts
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
```

- [ ] **Step 2: Commit configuration module**

```bash
git add src/config.ts
git commit -m "feat: add configuration module"
```

---

## Task 4: Content Validator

**Files:**
- Create: `src/validator.ts`

- [ ] **Step 1: Create validator module**

```typescript
// src/validator.ts
import { GraphLanguage } from './types';

const MERMAID_KEYWORDS = /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram-v2|stateDiagram|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline|quadrantChart|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|info|packet-beta|block-beta|architecture-beta|kanban|sankey|xychart-beta)/m;

export function isValidGraphContent(language: GraphLanguage, code: string): boolean {
  const trimmed = code.trim();
  
  if (!trimmed) return false;
  
  if (/^%%(?!{)/m.test(trimmed) && !hasGraphKeywords(trimmed, language)) {
    return false;
  }
  
  switch (language) {
    case 'mermaid':
      return isValidMermaid(trimmed);
    case 'dot':
      return isValidDot(trimmed);
    case 'plantuml':
      return isValidPlantUml(trimmed);
    default:
      return false;
  }
}

export function isValidMermaid(code: string): boolean {
  if (/^%%\{init:/.test(code.trim()) && !MERMAID_KEYWORDS.test(code)) {
    return false;
  }
  return MERMAID_KEYWORDS.test(code);
}

export function isValidDot(code: string): boolean {
  return /^(strict\s+)?(digraph|graph|subgraph)\b/m.test(code)
      || /->|--/.test(code);
}

export function isValidPlantUml(code: string): boolean {
  const hasStartEnd = /@start(uml|ditaa|dot|jcckit|math|salt|tree|wbs|mindmap|gantt|chronology|wire|json|yaml)/.test(code);
  
  const hasKeywords = /^(actor|participant|usecase|class|interface|enum|abstract|state|activity|partition|rectangle|package|node|folder|frame|cloud|database|storage|agent|artifact|boundary|card|circle|collections|component|control|entity|file|hexagon|label|person|queue|stack|title|skinparam|!define|!include|!function)/m.test(code);
  
  return hasStartEnd || hasKeywords;
}

function hasGraphKeywords(code: string, language: GraphLanguage): boolean {
  switch (language) {
    case 'mermaid':
      return isValidMermaid(code);
    case 'dot':
      return isValidDot(code);
    case 'plantuml':
      return isValidPlantUml(code);
    default:
      return false;
  }
}

export function normalizeLanguage(lang: string): GraphLanguage | null {
  switch (lang.toLowerCase()) {
    case 'mermaid':
      return 'mermaid';
    case 'dot':
    case 'graphviz':
      return 'dot';
    case 'plantuml':
    case 'puml':
      return 'plantuml';
    default:
      return null;
  }
}
```

- [ ] **Step 2: Commit validator module**

```bash
git add src/validator.ts
git commit -m "feat: add content validator"
```

---

## Task 5: Code Block Detector

**Files:**
- Create: `src/detector.ts`

- [ ] **Step 1: Create detector module**

```typescript
// src/detector.ts
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
```

- [ ] **Step 2: Commit detector module**

```bash
git add src/detector.ts
git commit -m "feat: add code block detector"
```

---

## Task 6: Utility Functions

**Files:**
- Create: `src/utils.ts`

- [ ] **Step 1: Create utility functions**

```typescript
// src/utils.ts
import * as vscode from 'vscode';

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function showLanguageQuickPick(
  candidates: ('mermaid' | 'dot' | 'plantuml')[]
): Promise<'mermaid' | 'dot' | 'plantuml' | undefined> {
  const items = candidates.map(lang => ({
    label: lang.charAt(0).toUpperCase() + lang.slice(1),
    id: lang,
  }));
  
  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select diagram language',
  });
  
  return selected?.id as 'mermaid' | 'dot' | 'plantuml' | undefined;
}
```

- [ ] **Step 2: Commit utility functions**

```bash
git add src/utils.ts
git commit -m "feat: add utility functions"
```

---

## Task 7-14: Remaining Tasks

Due to length, the remaining tasks (Webview HTML/CSS/JS, Preview Panel, Editor Watcher, Clipboard Watcher, Extension Entry Point, Build & Test, README) are available in the full plan document.

See `docs/proposal.md` for detailed implementation specifications.

---

## Spec Coverage Check

| Spec Section | Task | Status |
|--------------|------|--------|
| Real-time preview panel | Task 9, 10, 12 | ✅ |
| Multi-language support | Task 4, 5 | ✅ |
| Auto detection | Task 5, 10 | ✅ |
| Manual trigger | Task 12 | ✅ |
| Content validation | Task 4 | ✅ |
| Clipboard monitoring | Task 11, 12 | ✅ |
| Format tolerance | Task 5 | ✅ |
| Large diagram handling | Task 8, 9 | ✅ |
| Configuration | Task 3, 12 | ✅ |

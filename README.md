# Graph Preview

> Real-time preview for Mermaid, Graphviz DOT and PlantUML diagrams in VSCode — perfect companion for AI chat panels.

## Features

- **Real-time Preview**: Automatically renders Mermaid, DOT, and PlantUML diagrams in your editor
- **AI Chat Integration**: Copy diagram code from Copilot Chat or Claude Code, and see it rendered instantly
- **Multiple Languages**: Supports Mermaid, Graphviz DOT, and PlantUML
- **Theme Support**: Automatically adapts to your VSCode theme
- **Clipboard Monitoring**: Automatically detects and renders diagrams copied from AI chats
- **Large Diagram Handling**: Warns before rendering large diagrams to prevent performance issues

## Installation

### From Source

```bash
cd /Users/zon/Mine/projects/AIproject/vscode-graph-preview
npm install
npm run compile
```

Then press F5 in VSCode to launch Extension Development Host.

### From VSIX

```bash
npx vsce package
code --install-extension graph-preview-0.1.0.vsix
```

## Usage

### From Editor

Open any file containing Mermaid, DOT, or PlantUML code blocks:

```markdown
```mermaid
graph TB
  A --> B
```
```

The preview panel will automatically show the rendered diagram.

### From AI Chat

1. When Copilot Chat or Claude Code outputs a diagram code block
2. Click the copy button on the code block
3. Graph Preview automatically shows the rendered diagram

### Commands

- `Graph Preview: Open Preview Panel` - Open the preview panel
- `Graph Preview: Render from Clipboard` - Render diagram from clipboard content

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `graph-preview.autoOpen` | `true` | Automatically open preview when a diagram is detected |
| `graph-preview.watchClipboard` | `true` | Watch clipboard for diagram code |
| `graph-preview.debounceDelay` | `300` | Debounce delay (ms) for re-detection |
| `graph-preview.largeDiagramThreshold` | `500` | Node count threshold for large diagram warning |

## Supported Languages

### Mermaid

Flowcharts, sequence diagrams, class diagrams, state diagrams, ER diagrams, Gantt charts, and more.

```mermaid
graph TB
  Client --> Gateway
  Gateway --> ServiceA
  Gateway --> ServiceB
  ServiceA --> Database
```

### Graphviz DOT

Directed and undirected graphs using the DOT language.

```dot
digraph {
  a -> b -> c;
  b -> d;
}
```

### PlantUML

UML diagrams, sequence diagrams, component diagrams, and more.

```plantuml
@startuml
Alice -> Bob: Hello
Bob --> Alice: Hi!
@enduml
```

## Privacy

- Clipboard monitoring only activates when the preview panel is open
- Can be disabled via `graph-preview.watchClipboard` setting
- Only matches diagram code formats, other content is ignored
- Clipboard content is not stored or logged

## Development

```bash
# Install dependencies
npm install

# Build
npm run compile

# Watch for changes
npm run watch

# Package
npx vsce package
```

## License

MIT

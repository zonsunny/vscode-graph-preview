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
  // Must have graph/digraph/subgraph keyword, or edge definitions
  // Edge definitions in DOT: a -> b or a -- b (not ->> or -->> which are Mermaid)
  if (/^(strict\s+)?(digraph|graph|subgraph)\b/m.test(code)) {
    return true;
  }
  // Check for DOT-style edges (-> or -- but not ->> or -->>)
  // DOT edges: a -> b; a -- b;
  // Mermaid edges: a ->> b; a -->> b; a -->> b;
  if (/\s->\s/.test(code) && !/->>/.test(code)) {
    return true;
  }
  if (/\s--\s/.test(code) && !/-->>/.test(code)) {
    return true;
  }
  return false;
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
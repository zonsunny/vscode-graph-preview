import * as vscode from 'vscode';
import { GraphLanguage } from './types';

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
  candidates: GraphLanguage[]
): Promise<GraphLanguage | undefined> {
  const items = candidates.map(lang => ({
    label: lang.charAt(0).toUpperCase() + lang.slice(1),
    id: lang,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select diagram language',
  });

  return selected?.id as GraphLanguage | undefined;
}
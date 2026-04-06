// media/preview.js
(function() {
  'use strict';

  const vscode = acquireVsCodeApi();

  // State
  let state = {
    isClipboardWatching: false,
    pendingRender: null,
    vizInstance: null,
    currentId: null,
  };

  // DOM Elements
  const $ = id => document.getElementById(id);
  const elements = {
    loading: $('loading'),
    error: $('error'),
    errorMessage: $('error-message'),
    empty: $('empty'),
    clipboardHint: $('clipboard-hint'),
    largeDiagramWarning: $('large-diagram-warning'),
    nodeCount: $('node-count'),
    languageSelect: $('language-select'),
    languageButtons: $('language-buttons'),
    content: $('content'),
    disableClipboard: $('disable-clipboard'),
    renderAnyway: $('render-anyway'),
    cancelRender: $('cancel-render'),
  };

  // Initialize mermaid
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
  });

  // Signal ready
  vscode.postMessage({ type: 'ready' });

  // Event Listeners
  elements.disableClipboard?.addEventListener('click', () => {
    vscode.postMessage({ type: 'disableClipboard' });
  });

  elements.renderAnyway?.addEventListener('click', () => {
    if (state.pendingRender) {
      executeRender(state.pendingRender);
      state.pendingRender = null;
    }
    elements.largeDiagramWarning?.classList.add('hidden');
  });

  elements.cancelRender?.addEventListener('click', () => {
    state.pendingRender = null;
    elements.largeDiagramWarning?.classList.add('hidden');
  });

  // Render functions
  async function renderMermaid(code, id, theme) {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: theme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose'
      });
      const { svg } = await mermaid.render(`graph-${id}`, code);
      // Mermaid's render output is trusted SVG from the library
      elements.content.innerHTML = svg;
      showContent();
      vscode.postMessage({ type: 'rendered', id, success: true });
    } catch (err) {
      showError(err.message);
      vscode.postMessage({ type: 'rendered', id, success: false, error: err.message });
    }
  }

  async function renderDot(code, id) {
    try {
      if (!state.vizInstance) {
        state.vizInstance = await Viz.instance();
      }
      const svg = state.vizInstance.renderSVGElement(code);
      // Viz.js returns a trusted SVG element
      elements.content.innerHTML = '';
      elements.content.appendChild(svg);
      showContent();
      vscode.postMessage({ type: 'rendered', id, success: true });
    } catch (err) {
      showError(err.message);
      vscode.postMessage({ type: 'rendered', id, success: false, error: err.message });
    }
  }

  async function renderPlantUml(code, id, serverUrl) {
    try {
      const plantumlEncoder = window.plantumlEncoder;
      const encoded = plantumlEncoder.encode(code);
      const img = document.createElement('img');
      img.src = `${serverUrl}/svg/${encoded}`;
      img.alt = 'PlantUML Diagram';
      img.onload = () => {
        elements.content.innerHTML = '';
        elements.content.appendChild(img);
        showContent();
        vscode.postMessage({ type: 'rendered', id, success: true });
      };
      img.onerror = () => {
        showError('Failed to load PlantUML diagram');
        vscode.postMessage({ type: 'rendered', id, success: false, error: 'Failed to load' });
      };
    } catch (err) {
      showError(err.message);
      vscode.postMessage({ type: 'rendered', id, success: false, error: err.message });
    }
  }

  // UI helpers
  function showLoading() {
    hideAll();
    elements.loading?.classList.remove('hidden');
  }

  function showError(message) {
    hideAll();
    // Use textContent for user input to prevent XSS
    elements.errorMessage.textContent = message;
    elements.error?.classList.remove('hidden');
  }

  function showEmpty() {
    hideAll();
    elements.empty?.classList.remove('hidden');
  }

  function showContent() {
    hideAll();
    elements.content?.classList.remove('hidden');
  }

  function showLargeDiagramWarning(nodeCount) {
    elements.largeDiagramWarning?.classList.remove('hidden');
    // Use textContent for numeric value
    elements.nodeCount.textContent = nodeCount;
  }

  function showLanguageSelect(candidates, code) {
    hideAll();
    elements.languageSelect?.classList.remove('hidden');
    elements.languageButtons.innerHTML = '';

    candidates.forEach(lang => {
      const btn = document.createElement('button');
      // Use textContent for language names
      btn.textContent = lang.charAt(0).toUpperCase() + lang.slice(1);
      btn.addEventListener('click', () => {
        vscode.postMessage({
          type: 'languageSelected',
          language: lang,
          code: code,
        });
        elements.languageSelect?.classList.add('hidden');
      });
      elements.languageButtons.appendChild(btn);
    });
  }

  function hideAll() {
    elements.loading?.classList.add('hidden');
    elements.error?.classList.add('hidden');
    elements.empty?.classList.add('hidden');
    elements.content?.classList.add('hidden');
    elements.largeDiagramWarning?.classList.add('hidden');
    elements.languageSelect?.classList.add('hidden');
  }

  function updateClipboardHint(enabled) {
    state.isClipboardWatching = enabled;
    if (enabled) {
      elements.clipboardHint?.classList.remove('hidden');
    } else {
      elements.clipboardHint?.classList.add('hidden');
    }
  }

  function estimateNodeCount(code, language) {
    const patterns = {
      mermaid: /\b[A-Za-z][A-Za-z0-9_]*\b/g,
      dot: /\b[A-Za-z][A-Za-z0-9_]*\b/g,
      plantuml: /"[^"]*"|'[^\']*'/g,
    };
    const matches = code.match(patterns[language] || patterns.mermaid);
    return matches ? Math.min(matches.length, 1000) : 0;
  }

  async function executeRender(message) {
    const { id, language, code, theme, plantumlServerUrl } = message;

    showLoading();

    switch (language) {
      case 'mermaid':
        await renderMermaid(code, id, theme);
        break;
      case 'dot':
        await renderDot(code, id);
        break;
      case 'plantuml':
        await renderPlantUml(code, id, plantumlServerUrl || 'https://www.plantuml.com/plantuml');
        break;
      default:
        showError(`Unknown language: ${language}`);
    }
  }

  // Message handler
  window.addEventListener('message', async event => {
    const message = event.data;

    switch (message.type) {
      case 'render':
        const nodeCount = estimateNodeCount(message.code, message.language);
        if (nodeCount > 500 && message.largeDiagramThreshold > 0) {
          state.pendingRender = message;
          showLargeDiagramWarning(nodeCount);
        } else {
          await executeRender(message);
        }
        break;

      case 'showEmpty':
        showEmpty();
        break;

      case 'showError':
        showError(message.message);
        break;

      case 'clipboardStateChanged':
        updateClipboardHint(message.enabled);
        break;

      case 'languageSelect':
        showLanguageSelect(message.candidates, message.code);
        break;
    }
  });
})();

/**
 * Default editor options for Monaco Editor
 */
export function getEditorOptions(theme: 'light' | 'dark') {
  return {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 14,
    lineHeight: 1.6,
    padding: { top: 16, bottom: 16 },
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true,
    },
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    renderLineHighlight: "all" as const,
    cursorBlinking: "smooth" as const,
    cursorSmoothCaretAnimation: "on" as const,
    smoothScrolling: true,
    scrollbar: {
      verticalScrollbarSize: 12,
      horizontalScrollbarSize: 12,
      vertical: "visible" as const,
      horizontal: "visible" as const,
      useShadows: true,
      verticalHasArrows: false,
      horizontalHasArrows: false,
      alwaysConsumeMouseWheel: false,
      scrollByPage: false
    },
    tabSize: 2,
    automaticLayout: true,
    wordBasedSuggestions: "off" as const,
    quickSuggestions: false,
    occurrencesHighlight: "off" as const,
    renderWhitespace: "none" as const,
    renderControlCharacters: false
  };
}

/**
 * Get editor performance options to optimize rendering
 */
export function getEditorPerformanceOptions() {
  return {
    renderValidationDecorations: "off" as const,
    formatOnType: false,
    formatOnPaste: false,
    selectionHighlight: false,
    matchBrackets: "never" as const,
    contextmenu: false,
  };
} 
import { editor } from "monaco-editor";
import { IRange } from "monaco-editor";

/**
 * Adds a decoration to highlight text in the editor
 * @param editorInstance The Monaco editor instance
 * @param range The range to highlight
 * @param className Optional CSS class name for custom styling
 * @param options Optional decoration options
 * @returns An array of decoration IDs
 */
export const addHighlight = (
  editorInstance: editor.IStandaloneCodeEditor | null,
  range: IRange,
  className?: string,
  options?: editor.IModelDecorationOptions
): string[] => {
  if (!editorInstance) return [];

  const defaultOptions: editor.IModelDecorationOptions = {
    className: className || "highlight-text",
    inlineClassName: className || "highlight-text",
    stickiness: editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
    hoverMessage: { value: "" }
  };

  const decorationOptions = options || defaultOptions;
  
  return editorInstance.deltaDecorations(
    [], 
    [{ range, options: decorationOptions }]
  );
};

/**
 * Removes decorations from the editor
 * @param editorInstance The Monaco editor instance
 * @param decorationIds Array of decoration IDs to remove
 */
export const removeHighlights = (
  editorInstance: editor.IStandaloneCodeEditor | null,
  decorationIds: string[]
): void => {
  if (!editorInstance || !decorationIds.length) return;
  editorInstance.deltaDecorations(decorationIds, []);
};

/**
 * Highlights occurrences of a search term in the editor
 * @param editorInstance The Monaco editor instance
 * @param searchTerm The term to search for
 * @param isCaseSensitive Whether the search is case sensitive
 * @param className Optional CSS class name for custom styling
 * @returns An array of decoration IDs
 */
export const highlightSearchMatches = (
  editorInstance: editor.IStandaloneCodeEditor | null,
  searchTerm: string,
  isCaseSensitive: boolean = false,
  className?: string
): string[] => {
  if (!editorInstance || !searchTerm) return [];
  
  const model = editorInstance.getModel();
  if (!model) return [];
  
  const text = model.getValue();
  const decorations: { range: IRange; options: editor.IModelDecorationOptions }[] = [];
  const searchRegex = new RegExp(
    searchTerm.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 
    isCaseSensitive ? 'g' : 'gi'
  );

  let match;
  while ((match = searchRegex.exec(text)) !== null) {
    const startPos = model.getPositionAt(match.index);
    const endPos = model.getPositionAt(match.index + match[0].length);
    
    decorations.push({
      range: {
        startLineNumber: startPos.lineNumber,
        startColumn: startPos.column,
        endLineNumber: endPos.lineNumber,
        endColumn: endPos.column
      },
      options: {
        className: className || "search-highlight",
        inlineClassName: className || "search-highlight",
        stickiness: editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      }
    });
  }
  
  return editorInstance.deltaDecorations([], decorations);
};

/**
 * Creates a marker for error or warning indicators in the editor
 * @param editorInstance The Monaco editor instance
 * @param markers Array of marker data
 */
export const setMarkers = (
  editorInstance: editor.IStandaloneCodeEditor | null,
  markers: editor.IMarkerData[]
): void => {
  if (!editorInstance) return;
  
  const model = editorInstance.getModel();
  if (!model) return;
  
  editor.setModelMarkers(model, "owner", markers);
};

/**
 * Clears all markers from the editor
 * @param editorInstance The Monaco editor instance
 */
export const clearMarkers = (
  editorInstance: editor.IStandaloneCodeEditor | null
): void => {
  if (!editorInstance) return;
  
  const model = editorInstance.getModel();
  if (!model) return;
  
  editor.setModelMarkers(model, "owner", []);
}; 
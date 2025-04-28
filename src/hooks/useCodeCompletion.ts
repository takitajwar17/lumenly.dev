import { useState, useCallback, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Monaco } from "@monaco-editor/react";

interface UseCodeCompletionProps {
  typingTimeoutId: NodeJS.Timeout | null;
  setTypingTimeoutId: (timeoutId: NodeJS.Timeout | null) => void;
}

/**
 * Custom hook to manage code completion functionality
 */
export function useCodeCompletion({ 
  typingTimeoutId, 
  setTypingTimeoutId 
}: UseCodeCompletionProps) {
  const [isCompletionLoading, setIsCompletionLoading] = useState(false);
  const [completionSuggestion, setCompletionSuggestion] = useState<string | null>(null);
  
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  
  const getCodeCompletion = useAction(api.code.getCodeCompletion);

  // Add a custom code completion hook
  const triggerCodeCompletion = useCallback(async () => {
    if (!editorRef.current || !monacoRef.current) return;
    
    const workspace = editorRef.current.getModel()?._associatedResource?.workspace;
    if (!workspace) return;
    
    setIsCompletionLoading(true);
    
    try {
      const monaco = monacoRef.current;
      const editor = editorRef.current;
      const model = editor.getModel();
      const position = editor.getPosition();
      
      if (!model || !position) return;
      
      // Get current code and cursor position
      const code = model.getValue();
      const cursorPosition = {
        line: position.lineNumber,
        column: position.column
      };
      
      // Get completion from the server
      const result = await getCodeCompletion({
        code,
        language: workspace.language || 'javascript',
        cursorPosition,
        filename: workspace.name
      });
      
      if (result && result.completion && editor) {
        // Create the ghost text provider
        const suggestedText = result.completion;
        const suggestLineNumber = position.lineNumber;
        const suggestColumn = position.column;
        
        // Register a content provider for ghost text
        const provider = {
          provideInlineCompletions: (
            model: any, 
            position: any, 
            context: any, 
            token: any
          ) => {
            if (position.lineNumber !== suggestLineNumber || position.column !== suggestColumn) {
              return { items: [] };
            }
            
            return {
              items: [{
                insertText: suggestedText,
                range: {
                  startLineNumber: suggestLineNumber,
                  startColumn: suggestColumn,
                  endLineNumber: suggestLineNumber,
                  endColumn: suggestColumn
                }
              }]
            };
          },
          handleItemDidShow: () => {},
          handlePartialAccept: () => {},
          freeInlineCompletions: () => {}
        };
        
        // Register the ghost text provider
        const disposable = monaco.languages.registerInlineCompletionsProvider('*', provider);
        
        // Trigger ghost text to show
        editor.trigger('copilot', 'editor.action.inlineSuggest.trigger', {});
        
        // Setup a command to accept the suggestion with Tab
        editor.addCommand(monaco.KeyCode.Tab, () => {
          void editor.executeEdits('copilot', [{
            range: {
              startLineNumber: suggestLineNumber,
              startColumn: suggestColumn,
              endLineNumber: suggestLineNumber,
              endColumn: suggestColumn
            },
            text: suggestedText,
            forceMoveMarkers: true
          }]);
          
          // Clean up after accepting the suggestion
          disposable.dispose();
        }, 
        // Only enable when there's a suggestion
        () => !!suggestedText);
        
        // Set a timeout to automatically clean up if not accepted
        setTimeout(() => {
          disposable.dispose();
        }, 10000); // Suggestions disappear after 10 seconds if not accepted
      }
    } catch (error) {
      console.error("Code completion error:", error);
    } finally {
      setIsCompletionLoading(false);
    }
  }, [getCodeCompletion]);
  
  // Auto-trigger completions when the user stops typing
  const setupAutoCompletionTrigger = useCallback((editor: any) => {
    if (!editor) return { dispose: () => {} };
    
    // Add change content handler
    const disposable = editor.onDidChangeModelContent((e: any) => {
      // Reset any existing auto-completion timeout
      if (typingTimeoutId) {
        clearTimeout(typingTimeoutId);
      }
      
      // Auto-trigger completions after 1.5 seconds of inactivity
      const newTimeoutId = setTimeout(() => {
        const position = editor.getPosition();
        if (!position) return;
        
        const model = editor.getModel();
        if (!model) return;
        
        const line = model.getLineContent(position.lineNumber);
        const textBeforeCursor = line.substring(0, position.column - 1);
        
        // Only trigger after certain patterns that would benefit from completion
        const shouldTrigger = 
          // After dot operator (e.g., object.)
          textBeforeCursor.endsWith('.') || 
          // After opening parenthesis (e.g., function()
          textBeforeCursor.endsWith('(') ||
          // After opening brace (e.g., {)
          textBeforeCursor.endsWith('{') ||
          // After arrow in arrow functions (e.g., () =>)
          textBeforeCursor.endsWith('=>') ||
          // After equal sign (e.g., const x =)
          textBeforeCursor.endsWith('= ') ||
          // After keywords like return, if, for, while 
          /\b(return|if|for|while|switch)\s+$/.test(textBeforeCursor);
        
        if (shouldTrigger) {
          void triggerCodeCompletion();
        }
      }, 1500); // Wait 1.5 seconds after typing stops
      
      setTypingTimeoutId(newTimeoutId);
    });
    
    return disposable;
  }, [triggerCodeCompletion, typingTimeoutId, setTypingTimeoutId]);

  return {
    editorRef,
    monacoRef,
    isCompletionLoading,
    triggerCodeCompletion,
    setupAutoCompletionTrigger
  };
} 
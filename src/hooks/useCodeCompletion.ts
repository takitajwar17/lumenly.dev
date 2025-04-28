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
  const isRequestingCompletionRef = useRef(false);
  const completionDisposableRef = useRef<any>(null);
  
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  
  const getCodeCompletion = useAction(api.code.getCodeCompletion);

  // Cleanup any previous completion
  const cleanupPreviousCompletion = useCallback(() => {
    if (completionDisposableRef.current) {
      completionDisposableRef.current.dispose();
      completionDisposableRef.current = null;
    }
    setCompletionSuggestion(null);
  }, []);

  // Add a custom code completion hook
  const triggerCodeCompletion = useCallback(async () => {
    if (!editorRef.current || !monacoRef.current) return;
    
    // Get the current model and check if it exists
    const model = editorRef.current.getModel();
    if (!model) return;
    
    // Don't request if we're already waiting for a completion
    if (isRequestingCompletionRef.current) return;
    
    // Clean up any previous completions first
    cleanupPreviousCompletion();
    
    // Mark that we're requesting completion
    isRequestingCompletionRef.current = true;
    setIsCompletionLoading(true);
    
    try {
      const monaco = monacoRef.current;
      const editor = editorRef.current;
      const position = editor.getPosition();
      
      if (!model || !position) {
        isRequestingCompletionRef.current = false;
        setIsCompletionLoading(false);
        return;
      }
      
      // Get current code and cursor position
      const code = model.getValue();
      const cursorPosition = {
        line: position.lineNumber,
        column: position.column
      };
      
      // Get the workspace information from the model
      const language = model.getLanguageId() || 'javascript';
      
      // Get completion from the server
      const result = await getCodeCompletion({
        code,
        language,
        cursorPosition,
        filename: model.uri.toString()
      });
      
      // If we got a result and the editor still exists
      if (result && result.completion && editor) {
        const suggestedText = result.completion;
        setCompletionSuggestion(suggestedText);
        
        // Get the current position again (it might have changed)
        const currentPosition = editor.getPosition();
        if (!currentPosition) {
          isRequestingCompletionRef.current = false;
          setIsCompletionLoading(false);
          return;
        }
        
        const suggestLineNumber = currentPosition.lineNumber;
        const suggestColumn = currentPosition.column;
        
        // Register a content provider for ghost text
        const provider = {
          provideInlineCompletions: (
            model: any, 
            position: any, 
            context: any, 
            token: any
          ) => {
            // Only provide the suggestion at the exact position it was requested
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
        completionDisposableRef.current = disposable;
        
        // Trigger ghost text to show
        editor.trigger('ai-completion', 'editor.action.inlineSuggest.trigger', {});
        
        // Setup a command to accept the suggestion with Tab
        const commandDisposable = editor.addCommand(monaco.KeyCode.Tab, () => {
          void editor.executeEdits('ai-completion', [{
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
          cleanupPreviousCompletion();
          commandDisposable.dispose();
        }, 
        // Only enable when there's a suggestion
        () => !!suggestedText && editor.getPosition()?.lineNumber === suggestLineNumber && editor.getPosition()?.column === suggestColumn);
        
        // Set a timeout to automatically clean up if not accepted
        setTimeout(() => {
          cleanupPreviousCompletion();
        }, 15000); // Suggestions disappear after 15 seconds if not accepted
      }
    } catch (error) {
      console.error("Code completion error:", error);
    } finally {
      isRequestingCompletionRef.current = false;
      setIsCompletionLoading(false);
    }
  }, [getCodeCompletion, cleanupPreviousCompletion]);
  
  // Auto-trigger completions when the user stops typing
  const setupAutoCompletionTrigger = useCallback((editor: any) => {
    if (!editor) return { dispose: () => {} };
    
    // Track when user is typing to avoid overlapping triggers
    let isUserTyping = false;
    let lastAutoTriggerTime = 0;
    
    // Add change content handler
    const disposable = editor.onDidChangeModelContent((e: any) => {
      isUserTyping = true;
      
      // Reset any existing auto-completion timeout
      if (typingTimeoutId) {
        clearTimeout(typingTimeoutId);
      }
      
      // Auto-trigger completions after inactivity
      const newTimeoutId = setTimeout(() => {
        isUserTyping = false;
        
        // Don't trigger completions too frequently
        const now = Date.now();
        if (now - lastAutoTriggerTime < 5000) {
          return;
        }
        
        // Don't trigger if we're already waiting for a completion
        if (isRequestingCompletionRef.current) {
          return;
        }
        
        const position = editor.getPosition();
        if (!position) return;
        
        const model = editor.getModel();
        if (!model) return;
        
        // Get the current line content
        const line = model.getLineContent(position.lineNumber);
        const textBeforeCursor = line.substring(0, position.column - 1);
        
        // Check if we're in a good context to trigger completion
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
          /\b(return|if|for|while|switch)\s+$/.test(textBeforeCursor) ||
          // After typing a few letters of a word
          /\b\w{3,}$/.test(textBeforeCursor);
        
        if (shouldTrigger) {
          lastAutoTriggerTime = now;
          void triggerCodeCompletion();
        }
      }, 2000); // Wait 2 seconds after typing stops - longer to avoid conflict with cursor updates
      
      setTypingTimeoutId(newTimeoutId);
    });
    
    return {
      dispose: () => {
        disposable.dispose();
        cleanupPreviousCompletion();
      }
    };
  }, [triggerCodeCompletion, typingTimeoutId, setTypingTimeoutId, cleanupPreviousCompletion]);

  return {
    editorRef,
    monacoRef,
    isCompletionLoading,
    triggerCodeCompletion,
    setupAutoCompletionTrigger
  };
} 
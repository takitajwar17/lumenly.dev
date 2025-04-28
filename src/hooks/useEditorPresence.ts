import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { debounce } from "../utils/debounce";

interface UseEditorPresenceProps {
  roomId: Id<"rooms"> | null;
  lastTypingTime: number;
  typingTimeoutId: NodeJS.Timeout | null;
  setTypingTimeoutId: (timeoutId: NodeJS.Timeout | null) => void;
}

/**
 * Custom hook to manage editor presence updates
 */
export function useEditorPresence({
  roomId,
  lastTypingTime,
  typingTimeoutId,
  setTypingTimeoutId
}: UseEditorPresenceProps) {
  const updatePresence = useMutation(api.rooms.updatePresence);
  const editorRef = useRef<any>(null);

  // Debounced cursor update function
  const debouncedUpdatePresence = debounce(
    (position: { lineNumber: number; column: number }, selection?: any, isActive?: boolean) => {
      if (!roomId) return;
      
      const presenceData: any = {
        roomId,
        cursor: {
          line: position.lineNumber,
          column: position.column,
        },
        isActive,
      };
      
      // Add selection data if available
      if (selection && 
          selection.startLineNumber !== undefined && 
          selection.endLineNumber !== undefined) {
        presenceData.selection = {
          startLine: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLine: selection.endLineNumber,
          endColumn: selection.endColumn,
        };
      }
      
      void updatePresence(presenceData);
    }, 
    100 // 100ms debounce delay for cursor
  );

  // Update presence tracking effect for better performance
  useEffect(() => {
    if (!roomId || !editorRef.current) return;
    
    // Presence update interval - reduced frequency for better performance
    const intervalId = setInterval(() => {
      if (!editorRef.current) return;
      
      const now = Date.now();
      const isActivelyTyping = now - lastTypingTime < 1000;
      
      // Don't update presence during active typing
      if (!isActivelyTyping) {
        const position = editorRef.current.getPosition();
        const selection = editorRef.current.getSelection();
        
        if (position) {
          void updatePresence({
            roomId,
            cursor: {
              line: position.lineNumber,
              column: position.column,
            },
            selection: selection ? {
              startLine: selection.startLineNumber,
              startColumn: selection.startColumn,
              endLine: selection.endLineNumber,
              endColumn: selection.endColumn,
            } : undefined,
            isActive: false,
            isTyping: false
          });
        }
      }
    }, 10000); // Every 10 seconds for inactive updates
    
    // Minimal heartbeat ping
    const heartbeatId = setInterval(() => {
      const now = Date.now();
      const isUserActivelyTyping = now - lastTypingTime < 750; // Match the timeout used in handleEditorChange
      
      if (editorRef.current && roomId) {
        if (isUserActivelyTyping) {
          // During active typing, just refresh the typing status
          // but don't update cursor position to avoid UI issues
          void updatePresence({
            roomId,
            // Use the actual cursor position instead of a dummy one
            // but only update the isTyping flag, not the position itself
            cursor: editorRef.current.getPosition() 
              ? {
                  line: editorRef.current.getPosition().lineNumber,
                  column: editorRef.current.getPosition().column
                }
              : { line: 1, column: 1 },
            isActive: true,
            isTyping: true
          });
        } else {
          // For non-typing status, update everything
          const position = editorRef.current.getPosition();
          const selection = editorRef.current.getSelection();
          const hasSelection = selection && !selection.isEmpty();
          
          if (position) {
            void updatePresence({
              roomId,
              cursor: {
                line: position.lineNumber,
                column: position.column,
              },
              selection: hasSelection ? {
                startLine: selection.startLineNumber,
                startColumn: selection.startColumn,
                endLine: selection.endLineNumber,
                endColumn: selection.endColumn,
              } : undefined,
              isActive: true,
              isTyping: false
            });
          }
        }
      }
    }, 2000); // Reduced to 2 seconds for more responsive status updates
    
    // Clean up
    return () => {
      clearInterval(intervalId);
      clearInterval(heartbeatId);
      if (typingTimeoutId) {
        clearTimeout(typingTimeoutId);
      }
    };
  }, [roomId, updatePresence, typingTimeoutId, lastTypingTime]);

  // Setup selection tracking
  const setupSelectionTracking = (editor: any) => {
    if (!editor || !roomId) return () => {};
    
    // Add selection change listener
    const selectionChangeDisposable = editor.onDidChangeCursorSelection((e: any) => {
      // Only consider it a selection if text is actually selected
      const isTextSelected = e.selection && 
        (e.selection.startLineNumber !== e.selection.endLineNumber || 
         e.selection.startColumn !== e.selection.endColumn);
      
      if (isTextSelected) {
        // When selection changes, immediately update presence with selecting status
        const position = editor.getPosition();
        if (position) {
          void updatePresence({
            roomId,
            cursor: {
              line: position.lineNumber,
              column: position.column,
            },
            selection: {
              startLine: e.selection.startLineNumber,
              startColumn: e.selection.startColumn,
              endLine: e.selection.endLineNumber,
              endColumn: e.selection.endColumn,
            },
            isActive: true,
            isTyping: false // Not typing, just selecting
          });
        }
      } else if (e.source === 'mouse') {
        // If selection was cleared and it was from mouse, update to regular cursor state
        const position = editor.getPosition();
        if (position) {
          void updatePresence({
            roomId,
            cursor: {
              line: position.lineNumber,
              column: position.column,
            },
            selection: undefined,
            isActive: true,
            isTyping: false
          });
        }
      }
    });
    
    return () => selectionChangeDisposable.dispose();
  };

  // Setup cursor movement tracking
  const setupCursorTracking = (editor: any) => {
    if (!editor || !roomId) return () => {};
    
    const cursorPositionDisposable = editor.onDidChangeCursorPosition((e: any) => {
      // Only handle if this is just a cursor move, not a selection
      const selection = editor.getSelection();
      const isJustCursorMove = !selection || 
        (selection.startLineNumber === selection.endLineNumber && 
         selection.startColumn === selection.endColumn);
      
      // Only update cursor if it's not an event from typing (check against last typing time)
      const now = Date.now();
      const isFromTyping = now - lastTypingTime < 100;
      
      if (isJustCursorMove && !isFromTyping) {
        void updatePresence({
          roomId,
          cursor: {
            line: e.position.lineNumber,
            column: e.position.column,
          },
          selection: undefined,
          isActive: true,
          isTyping: false // Explicitly mark as not typing during cursor moves
        });
      }
    });
    
    return () => cursorPositionDisposable.dispose();
  };

  // Update typing status
  const updateTypingStatus = (position: any) => {
    if (!roomId) return;
    
    void updatePresence({
      roomId,
      cursor: {
        line: position.lineNumber,
        column: position.column,
      },
      isActive: true,
      isTyping: true // Immediately mark as typing
    });
  };

  return {
    editorRef,
    debouncedUpdatePresence,
    setupSelectionTracking,
    setupCursorTracking,
    updateTypingStatus
  };
} 
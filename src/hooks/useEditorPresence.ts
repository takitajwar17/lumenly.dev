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
  const lastCursorPositionRef = useRef<{lineNumber: number; column: number} | null>(null);
  const isTypingRef = useRef(false);
  const pendingUpdateRef = useRef(false);

  // Debounced cursor update function - with higher delay to prevent conflicts
  const debouncedUpdatePresence = debounce(
    (position: { lineNumber: number; column: number }, selection?: any, isActive?: boolean) => {
      if (!roomId) return;
      
      // Store the last cursor position to maintain its location
      if (!isTypingRef.current) {
        lastCursorPositionRef.current = position;
      }
      
      // Don't send updates if we're actively typing - this prevents cursor jumps
      if (isTypingRef.current) {
        pendingUpdateRef.current = true;
        return;
      }
      
      const presenceData: any = {
        roomId,
        cursor: {
          line: position.lineNumber,
          column: position.column,
        },
        isActive,
        isTyping: false
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
      pendingUpdateRef.current = false;
    }, 
    300 // Increased significantly to avoid interference with typing
  );

  // Update presence tracking effect for better performance
  useEffect(() => {
    if (!roomId || !editorRef.current) return;
    
    // Presence update interval for inactive users - very low frequency
    const intervalId = setInterval(() => {
      if (!editorRef.current) return;
      
      const now = Date.now();
      const isActivelyTyping = now - lastTypingTime < 1500; // Increased threshold
      
      // Update isTypingRef to track current typing state
      isTypingRef.current = isActivelyTyping;
      
      // Don't update presence during active typing at all
      if (!isActivelyTyping) {
        const position = editorRef.current.getPosition();
        
        if (position && !pendingUpdateRef.current) {
          // Only update if position has actually changed from the last known one
          if (!lastCursorPositionRef.current || 
              position.lineNumber !== lastCursorPositionRef.current.lineNumber || 
              position.column !== lastCursorPositionRef.current.column) {
            
            lastCursorPositionRef.current = position;
            
            const selection = editorRef.current.getSelection();
            
            void updatePresence({
              roomId,
              cursor: {
                line: position.lineNumber,
                column: position.column,
              },
              selection: selection && !selection.isEmpty() ? {
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
      }
    }, 15000); // Reduced frequency to once every 15 seconds for inactive updates
    
    // Typing indicator heartbeat - keeps typing status alive but doesn't change cursor position
    const typingHeartbeatId = setInterval(() => {
      if (!roomId || !editorRef.current) return;
      
      const now = Date.now();
      const isActivelyTyping = now - lastTypingTime < 1000;
      
      // Update isTypingRef to track current typing state
      isTypingRef.current = isActivelyTyping;
      
      // Update typing status for all users - whether typing or not
      if (lastCursorPositionRef.current) {
        void updatePresence({
          roomId,
          // Keep the last known position rather than getting current
          cursor: {
            line: lastCursorPositionRef.current.lineNumber,
            column: lastCursorPositionRef.current.column
          },
          isActive: true,
          isTyping: isActivelyTyping, // This ensures we update to false when not typing
          // Explicitly omit selection during typing
          selection: undefined
        });
      }
    }, 750);
    
    // Regular presence updates for non-typing users
    const presenceHeartbeatId = setInterval(() => {
      if (!roomId || !editorRef.current) return;
      
      const now = Date.now();
      const isActivelyTyping = now - lastTypingTime < 1000;
      
      // Update isTypingRef to track current typing state
      isTypingRef.current = isActivelyTyping;
      
      // Always send a presence update, even if position hasn't changed
      // This prevents users from disappearing due to inactivity
      const position = editorRef.current.getPosition();
      
      if (position) {
        // Save the current position
        lastCursorPositionRef.current = position;
        
        const selection = editorRef.current.getSelection();
        const hasSelection = selection && !selection.isEmpty();
        
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
          isTyping: isActivelyTyping
        });
      }
    }, 2000); // Every 2 seconds (reduced from 3) for more reliable presence updates
    
    // Clean up
    return () => {
      clearInterval(intervalId);
      clearInterval(typingHeartbeatId);
      clearInterval(presenceHeartbeatId);
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
      // Only update if not currently typing - critical to preserve cursor
      if (isTypingRef.current) {
        // Just update our local ref and return
        const position = editor.getPosition();
        if (position) {
          lastCursorPositionRef.current = position;
        }
        return;
      }
      
      // Record selection change but don't immediately push to server unless mouse-driven
      const isTextSelected = e.selection && 
        (e.selection.startLineNumber !== e.selection.endLineNumber || 
         e.selection.startColumn !== e.selection.endColumn);
      
      // Only immediately update for explicit selection or mouse-driven changes
      if ((isTextSelected || e.source === 'mouse') && !pendingUpdateRef.current) {
        const position = editor.getPosition();
        if (position) {
          lastCursorPositionRef.current = position;
          
          void updatePresence({
            roomId,
            cursor: {
              line: position.lineNumber,
              column: position.column,
            },
            selection: isTextSelected ? {
              startLine: e.selection.startLineNumber,
              startColumn: e.selection.startColumn,
              endLine: e.selection.endLineNumber,
              endColumn: e.selection.endColumn,
            } : undefined,
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
      // Always record position locally
      if (e.position) {
        lastCursorPositionRef.current = e.position;
      }
      
      // Don't send updates if we're actively typing or a pending update exists
      const now = Date.now();
      const isFromTyping = now - lastTypingTime < 500;  // Increased significantly
      isTypingRef.current = isFromTyping;
      
      if (isFromTyping || pendingUpdateRef.current) {
        return;
      }
      
      // Only handle if this is just a cursor move, not typing or selection
      const selection = editor.getSelection();
      const isJustCursorMove = !selection || 
        (selection.startLineNumber === selection.endLineNumber && 
         selection.startColumn === selection.endColumn);
      
      // Only process deliberate cursor movements, not typing-related ones
      if (isJustCursorMove && e.source === 'mouse') {
        void updatePresence({
          roomId,
          cursor: {
            line: e.position.lineNumber,
            column: e.position.column,
          },
          selection: undefined,
          isActive: true,
          isTyping: false
        });
      }
    });
    
    return () => cursorPositionDisposable.dispose();
  };

  // Update typing status - only called during active typing
  const updateTypingStatus = (position: any) => {
    if (!roomId) return;
    
    // Always save current cursor position for reference
    if (position) {
      lastCursorPositionRef.current = position;
    }
    
    // Mark as typing and block other updates
    isTypingRef.current = true;
    
    // Only update typing status intermittently to avoid network spam
    // This is handled by the typing heartbeat now
  };

  return {
    editorRef,
    debouncedUpdatePresence,
    setupSelectionTracking,
    setupCursorTracking,
    updateTypingStatus
  };
} 
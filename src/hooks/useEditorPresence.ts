import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { debounce } from "../utils/debounce";

// Update source types to establish clear priority
type UpdateSource = 'selection' | 'mouse' | 'typing' | 'heartbeat';

interface CursorUpdate {
  position: { lineNumber: number; column: number };
  timestamp: number;
  source: UpdateSource;
}

interface UseEditorPresenceProps {
  roomId: Id<"rooms"> | null;
  lastTypingTime: number;
  typingTimeoutId: NodeJS.Timeout | null;
  setTypingTimeoutId: (timeoutId: NodeJS.Timeout | null) => void;
}

/**
 * Custom hook to manage editor presence updates with improved
 * conflict resolution and cursor stability
 */
export function useEditorPresence({
  roomId,
  lastTypingTime,
  typingTimeoutId,
  setTypingTimeoutId
}: UseEditorPresenceProps) {
  const updatePresence = useMutation(api.rooms.updatePresence);
  const editorRef = useRef<any>(null);
  
  // Track latest cursor position with metadata
  const lastCursorUpdateRef = useRef<CursorUpdate | null>(null);
  
  // Enhanced typing state with locking mechanism
  const isTypingRef = useRef(false);
  const isProcessingUpdateRef = useRef(false);
  
  // Track active selections separately
  const activeSelectionRef = useRef<any>(null);
  
  // Queue for ordered updates
  const pendingUpdatesRef = useRef<Array<() => void>>([]);
  
  // Process pending updates in order
  const processPendingUpdates = () => {
    if (isProcessingUpdateRef.current || pendingUpdatesRef.current.length === 0) {
      return;
    }
    
    isProcessingUpdateRef.current = true;
    const nextUpdate = pendingUpdatesRef.current.shift();
    
    if (nextUpdate) {
      nextUpdate();
      // Allow next update after a small delay
      setTimeout(() => {
        isProcessingUpdateRef.current = false;
        processPendingUpdates();
      }, 50);
    } else {
      isProcessingUpdateRef.current = false;
    }
  };
  
  // Update cursor with source priority
  const updateCursorPosition = (
    position: { lineNumber: number; column: number }, 
    selection: any,
    source: UpdateSource,
    isActive: boolean = true,
    isTyping: boolean = false
  ) => {
    if (!roomId) return;
    
    const now = Date.now();
    
    // Skip if this is a lower priority update than our last one and it's recent
    // Priority: selection > mouse > typing > heartbeat
    const priorityMap: Record<UpdateSource, number> = {
      'selection': 4,
      'mouse': 3,
      'typing': 2,
      'heartbeat': 1
    };
    
    const lastUpdate = lastCursorUpdateRef.current;
    const currentPriority = priorityMap[source];
    
    if (lastUpdate) {
      const lastPriority = priorityMap[lastUpdate.source];
      const isVeryRecent = now - lastUpdate.timestamp < 200;
      
      // Skip lower priority updates that would conflict with higher priority recent updates
      if (currentPriority < lastPriority && isVeryRecent) {
        return;
      }
      
      // Skip same-priority updates if position hasn't changed
      if (currentPriority === lastPriority && 
          lastUpdate.position.lineNumber === position.lineNumber && 
          lastUpdate.position.column === position.column) {
        return;
      }
    }
    
    // Create cursor update metadata
    const cursorUpdate: CursorUpdate = {
      position,
      timestamp: now,
      source
    };
    
    // Store as our latest update
    lastCursorUpdateRef.current = cursorUpdate;
    
    // For typing-related updates, set typing flag
    if (source === 'typing') {
      isTypingRef.current = true;
    }
    
    // Create presence update payload
    const presenceData: any = {
      roomId,
      cursor: {
        line: position.lineNumber,
        column: position.column,
      },
      timestamp: now,
      isActive,
      isTyping
    };
    
    // Add selection data if available
    if (selection && 
        selection.startLineNumber !== undefined && 
        selection.endLineNumber !== undefined &&
        (selection.startLineNumber !== selection.endLineNumber || 
         selection.startColumn !== selection.endColumn)) {
      presenceData.selection = {
        startLine: selection.startLineNumber,
        startColumn: selection.startColumn,
        endLine: selection.endLineNumber,
        endColumn: selection.endColumn,
      };
      activeSelectionRef.current = selection;
    } else {
      activeSelectionRef.current = null;
    }
    
    // Add update to queue with priority
    pendingUpdatesRef.current.push(() => {
      void updatePresence(presenceData);
    });
    
    // Process updates
    processPendingUpdates();
  };
  
  // Debounced cursor update for non-critical movements
  const debouncedUpdatePresence = debounce(
    (position: { lineNumber: number; column: number }, selection?: any, isActive?: boolean) => {
      if (isTypingRef.current) return; // Avoid interrupting typing
      updateCursorPosition(position, selection, 'mouse', isActive, false);
    }, 
    200
  );

  // Unified presence management
  useEffect(() => {
    if (!roomId || !editorRef.current) return;
    
    // Heartbeat for keeping presence alive without changing cursor
    const presenceHeartbeatId = setInterval(() => {
      if (!roomId || !editorRef.current) return;
      
      const now = Date.now();
      const isActivelyTyping = now - lastTypingTime < 750;
      
      // Only update if we have a valid position
      if (lastCursorUpdateRef.current?.position) {
        const lastPosition = lastCursorUpdateRef.current.position;
        updateCursorPosition(
          lastPosition, 
          activeSelectionRef.current,
          'heartbeat',
          true, 
          isActivelyTyping
        );
      }
    }, 3000); // Less frequent heartbeat to reduce network traffic
    
    // Clean up
    return () => {
      clearInterval(presenceHeartbeatId);
      if (typingTimeoutId) {
        clearTimeout(typingTimeoutId);
      }
    };
  }, [roomId, updatePresence, typingTimeoutId, lastTypingTime]);

  // Setup selection tracking with improved priority
  const setupSelectionTracking = (editor: any) => {
    if (!editor || !roomId) return () => {};
    
    const selectionChangeDisposable = editor.onDidChangeCursorSelection((e: any) => {
      const position = editor.getPosition();
      if (!position) return;
      
      const isTextSelected = e.selection && 
        (e.selection.startLineNumber !== e.selection.endLineNumber || 
         e.selection.startColumn !== e.selection.endColumn);
      
      // Only explicitly update for selection changes to avoid competing with typing
      if (isTextSelected || e.source === 'mouse') {
        updateCursorPosition(position, e.selection, 'selection', true, isTypingRef.current);
      }
    });
    
    return () => selectionChangeDisposable.dispose();
  };

  // Setup cursor tracking with improved source detection
  const setupCursorTracking = (editor: any) => {
    if (!editor || !roomId) return () => {};
    
    const cursorPositionDisposable = editor.onDidChangeCursorPosition((e: any) => {
      if (!e.position) return;
      
      const now = Date.now();
      const isFromTyping = now - lastTypingTime < 300;
      
      // Skip updates during active typing to avoid jumps
      if (isFromTyping) {
        return;
      }
      
      // Only process deliberate cursor movements
      if (e.source === 'mouse') {
        const selection = editor.getSelection();
        updateCursorPosition(e.position, selection, 'mouse', true, false);
      }
    });
    
    return () => cursorPositionDisposable.dispose();
  };

  // Update typing status with cursor position
  const updateTypingStatus = (position: any) => {
    if (!roomId || !position) return;
    
    // When typing, immediately update with typing source
    updateCursorPosition(position, undefined, 'typing', true, true);
    
    // Set a timeout to clear typing status
    if (typingTimeoutId) {
      clearTimeout(typingTimeoutId);
    }
    
    const newTimeoutId = setTimeout(() => {
      isTypingRef.current = false;
      
      // After typing stops, update final position
      if (editorRef.current) {
        const finalPosition = editorRef.current.getPosition();
        const finalSelection = editorRef.current.getSelection();
        
        if (finalPosition) {
          updateCursorPosition(finalPosition, finalSelection, 'mouse', true, false);
        }
      }
    }, 1000);
    
    setTypingTimeoutId(newTimeoutId);
  };

  return {
    editorRef,
    debouncedUpdatePresence,
    setupSelectionTracking,
    setupCursorTracking,
    updateTypingStatus
  };
} 
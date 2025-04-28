import { useMemo, useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

/**
 * Custom hook to manage code synchronization with the server
 */
export function useCodeSync(roomId: Id<"rooms"> | null) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const updateCode = useMutation(api.rooms.updateCode);
  
  // Debounced server update function with pending update tracking
  const debouncedUpdateCode = useMemo(() => {
    // Create a simple but effective debounce implementation
    let timeoutId: NodeJS.Timeout | null = null;
    
    return (value: string) => {
      if (!roomId) return;
      
      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Set a new timeout
      timeoutId = setTimeout(() => {
        void updateCode({ roomId, code: value })
          .then(() => {
            setLastSaved(new Date());
          })
          .catch(error => {
            console.error("Failed to update code:", error);
          });
      }, 300); // 300ms debounce
    };
  }, [roomId, updateCode]);

  // A function to handle leaving the room
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const handleLeaveRoom = useCallback(async () => {
    if (roomId) {
      try {
        await leaveRoom({ roomId });
        return true;
      } catch (error) {
        console.error("Failed to leave room:", error);
        return false;
      }
    }
    return true;
  }, [roomId, leaveRoom]);

  return {
    lastSaved,
    debouncedUpdateCode,
    handleLeaveRoom
  };
} 
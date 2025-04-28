import { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ActivityLogEntry {
  type: 'join' | 'leave' | 'system';
  user: any;
  timestamp: number;
  message?: string;
}

/**
 * Custom hook to manage editor collaboration features
 */
export function useEditorCollaboration(roomId: Id<"rooms"> | null) {
  // Fetch presence data
  const presence = useQuery(
    api.rooms.getPresence, 
    roomId ? { roomId } : "skip"
  );
  
  // Track presence changes to show notifications
  const [previousPresence, setPreviousPresence] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  
  // UI state for mobile
  const [showMobileCollaborators, setShowMobileCollaborators] = useState(false);
  
  // Check for new collaborators joining or leaving
  useEffect(() => {
    if (!presence) {
      setPreviousPresence([]);
      return;
    }
    
    if (previousPresence.length > 0) {
      // Find new collaborators (in current presence but not in previous)
      const joiners = presence.filter(
        current => !previousPresence.some(prev => prev._id === current._id)
      );
      
      // Find collaborators who left (in previous but not in current)
      const leavers = previousPresence.filter(
        prev => !presence.some(current => current._id === prev._id)
      );
      
      // Add to activity log
      const newActivities = [
        ...joiners.map(user => ({
          type: 'join' as const,
          user,
          timestamp: Date.now()
        })),
        ...leavers.map(user => ({
          type: 'leave' as const,
          user,
          timestamp: Date.now()
        }))
      ];
      
      if (newActivities.length > 0) {
        setActivityLog(prev => [...newActivities, ...prev].slice(0, 10));
      }
    } else if (presence.length > 0) {
      // Initial activity when component mounts and there are users
      setActivityLog([{
        type: 'system',
        user: null,
        timestamp: Date.now(),
        message: `${presence.length} collaborator${presence.length !== 1 ? 's' : ''} online`
      }]);
    }
    
    // Keep track of previous presence
    setPreviousPresence(presence);
  }, [presence]);

  const handleClearActivityLog = useCallback(() => {
    setActivityLog([]);
  }, []);

  const toggleMobileCollaborators = useCallback(() => {
    setShowMobileCollaborators(prev => !prev);
  }, []);

  return {
    presence,
    activityLog,
    showMobileCollaborators,
    handleClearActivityLog,
    toggleMobileCollaborators
  };
} 
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import CodeEditor from "./CodeEditor";

/**
 * Component to handle the workspace/:roomCode route
 * Manages workspace joining and validation
 */
export default function RoomRouteHandler() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState<Id<"rooms"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const joinRoomByCode = useMutation(api.rooms.joinByCode);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  
  // Load workspace by code
  useEffect(() => {
    async function loadRoom() {
      if (!roomCode) {
        void navigate('/workspace');
        return;
      }
      
      setIsLoading(true);
      try {
        const roomId = await joinRoomByCode({ code: roomCode });
        setRoomId(roomId);
      } catch (error) {
        toast.error("Invalid workspace code or workspace not found");
        void navigate('/workspace');
      } finally {
        setIsLoading(false);
      }
    }
    
    void loadRoom();
  }, [roomCode, joinRoomByCode, navigate]);
  
  // Handle navigation back to /workspace
  const handleBack = useCallback(() => {
    // If we have a workspace ID, make sure to leave it first
    if (roomId) {
      void leaveRoom({ roomId }).then(() => {
        void navigate('/workspace');
      });
    } else {
      void navigate('/workspace');
    }
  }, [navigate, roomId, leaveRoom]);
  
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900 transition-colors">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-t-2 border-b-2 border-indigo-400 animate-spin-reverse" style={{ animationDuration: '1.5s' }}></div>
            <div className="absolute inset-6 rounded-full border-t-2 border-indigo-300 animate-spin" style={{ animationDuration: '2s' }}></div>
          </div>
          <p className="text-lg font-medium text-gray-800 dark:text-gray-200 transition-colors">Loading workspace...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">Connecting to {roomCode}</p>
        </div>
      </div>
    );
  }
  
  return <CodeEditor initialRoomId={roomId} onBack={handleBack} />;
} 
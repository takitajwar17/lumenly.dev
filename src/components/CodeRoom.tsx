import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useTheme } from "../ThemeContext";
import { toast } from "sonner";

// Popular programming languages for quick selection
const POPULAR_LANGUAGES = [
  { id: "javascript", name: "JavaScript", icon: "JS" },
  { id: "typescript", name: "TypeScript", icon: "TS" },
  { id: "python", name: "Python", icon: "PY" },
  { id: "java", name: "Java", icon: "JV" },
  { id: "cpp", name: "C++", icon: "C++" },
  { id: "csharp", name: "C#", icon: "C#" },
];

/**
 * Component for room listing, creation and joining
 */
export default function CodeRoom() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomLanguage, setNewRoomLanguage] = useState("javascript");
  const [isLoading, setIsLoading] = useState(false);
  const [languages, setLanguages] = useState<any[]>([]);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  
  const navigate = useNavigate();
  const rooms = useQuery(api.rooms.list);
  const createRoom = useMutation(api.rooms.create);
  const joinRoomByCode = useMutation(api.rooms.joinByCode);
  const { theme } = useTheme();
  
  // Fetch available languages
  useEffect(() => {
    void fetch("https://emkc.org/api/v2/piston/runtimes")
      .then((r) => r.json())
      .then(setLanguages)
      .catch(err => console.error("Failed to fetch languages:", err));
  }, []);
  
  const handleCreateRoomClick = useCallback(() => {
    setIsCreateModalOpen(true);
    setNewRoomName("");
    setNewRoomLanguage("javascript");
    setShowAllLanguages(false);
  }, []);
  
  const handleCloseModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);
  
  const handleCreateRoom = useCallback(async () => {
    if (!newRoomName.trim()) {
      toast.error("Room name cannot be empty");
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await createRoom({ 
        name: newRoomName.trim(), 
        language: newRoomLanguage 
      });
      
      // Navigate directly to the room using the returned code
      void navigate(`/room/${result.code}`);
      
      setIsCreateModalOpen(false);
      toast.success("Room created successfully!");
    } catch (error) {
      toast.error("Failed to create room");
    } finally {
      setIsLoading(false);
    }
  }, [newRoomName, newRoomLanguage, createRoom, navigate]);
  
  const handleJoinRoom = useCallback(async () => {
    if (joinCode.length !== 6) {
      toast.error("Room code should be 6 characters");
      return;
    }
    
    setIsLoading(true);
    try {
      // Just validate that the room exists
      await joinRoomByCode({ code: joinCode });
      
      // Navigate to the room
      void navigate(`/room/${joinCode}`);
      
      toast.success("Joined room successfully!");
    } catch (error) {
      toast.error("Failed to join room. Invalid code.");
      setIsLoading(false);
    }
  }, [joinCode, joinRoomByCode, navigate]);
  
  const handleSelectRoom = useCallback((roomCode: string) => {
    if (roomCode) {
      // Note: We don't need to call leaveRoom here because we're not in a room yet,
      // we're just moving to another one. The RoomRouteHandler will handle any cleanup.
      void navigate(`/room/${roomCode}`);
    }
  }, [navigate]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700 transition-colors">
            <h2 className="text-xl font-semibold mb-5 text-gray-900 dark:text-white transition-colors">Create New Room</h2>
            
            <div className="space-y-5">
              <div>
                <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Room Name
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name"
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                  Programming Language
                </label>
                
                {!showAllLanguages ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {POPULAR_LANGUAGES.map(lang => (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => setNewRoomLanguage(lang.id)}
                          className={`p-2 rounded-lg border transition-all ${newRoomLanguage === lang.id 
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/70 text-gray-700 dark:text-gray-300'}`}
                        >
                          <div className="flex flex-col items-center">
                            <div className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg mb-1.5 text-xs font-semibold">
                              {lang.icon}
                            </div>
                            <span className="text-xs">{lang.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAllLanguages(true)}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                    >
                      Show all languages
                    </button>
                  </>
                ) : (
                  <>
                    <select
                      value={newRoomLanguage}
                      onChange={(e) => setNewRoomLanguage(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors"
                      disabled={isLoading}
                    >
                      {languages.length > 0 ? (
                        languages.map((lang) => (
                          <option key={lang.language} value={lang.language}>
                            {lang.language}
                          </option>
                        ))
                      ) : (
                        POPULAR_LANGUAGES.map(lang => (
                          <option key={lang.id} value={lang.id}>
                            {lang.name}
                          </option>
                        ))
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowAllLanguages(false)}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mt-2 transition-colors"
                    >
                      Show popular languages
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="mt-7 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreateRoom()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    
      <div className="flex h-full w-full">
        {/* Left side - Create/Join */}
        <div className="w-1/2 p-8 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-colors">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-4 transition-colors">Collaborative Coding</h1>
            <p className="text-gray-600 dark:text-gray-400 transition-colors">Create or join a room to start coding together</p>
          </div>
          
          <div className="space-y-8 flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
            <button
              onClick={handleCreateRoomClick}
              className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl px-5 py-4 text-lg font-medium transition-colors shadow-md"
            >
              Create a Room
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700 transition-colors"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 transition-colors">OR</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="Enter 6-character room code"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-4 py-3.5 text-center text-lg tracking-widest uppercase text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors"
                maxLength={6}
              />
              <button
                onClick={() => void handleJoinRoom()}
                className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-xl px-4 py-3.5 text-lg font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={joinCode.length !== 6 || isLoading}
              >
                {isLoading ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Right side - Recent Rooms */}
        <div className="w-1/2 p-8 bg-gray-50 dark:bg-gray-900/30 transition-colors">
          <h2 className="text-xl font-semibold mb-5 text-gray-900 dark:text-white transition-colors">Your Recent Rooms</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 dark:border-indigo-400 transition-colors"></div>
            </div>
          ) : rooms && rooms.length > 0 ? (
            <div className="space-y-3 overflow-auto max-h-[500px] pr-2 pb-4">
              {rooms.map((room) => (
                <button
                  key={room._id}
                  onClick={() => void handleSelectRoom(room.code)}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all shadow-sm hover:shadow flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white transition-colors">{room.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">{room.language}</p>
                  </div>
                  <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium transition-colors">Open</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
              <p className="text-gray-600 dark:text-gray-400 transition-colors">No recent rooms found</p>
              <p className="text-sm mt-1 text-gray-500 dark:text-gray-500 transition-colors">Create a new room to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
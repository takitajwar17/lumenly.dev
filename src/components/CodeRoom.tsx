import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useTheme } from "../ThemeContext";
import { toast } from "sonner";
import { 
  SiJavascript, 
  SiTypescript, 
  SiPython,
  SiCplusplus,
  SiC,
  SiSharp,
  SiGo,
  SiRust,
  SiSwift,
  SiKotlin,
  SiPhp
} from "react-icons/si";
import { FaJava } from "react-icons/fa";
import { FiCode, FiUsers, FiPlus, FiHash } from "react-icons/fi";
import { getSupportedLanguages, getLanguageDisplayName } from "../../convex/languageMap";

// Popular programming languages for quick selection
const POPULAR_LANGUAGES = [
  { id: "javascript", name: "JavaScript", icon: SiJavascript, color: "#F7DF1E" },
  { id: "typescript", name: "TypeScript", icon: SiTypescript, color: "#3178C6" },
  { id: "python", name: "Python", icon: SiPython, color: "#3776AB" },
  { id: "java", name: "Java", icon: FaJava, color: "#007396" },
  { id: "c++", name: "C++", icon: SiCplusplus, color: "#00599C" },
  { id: "c", name: "C", icon: SiC, color: "#A8B9CC" },
  { id: "csharp.net", name: "C#", icon: SiSharp, color: "#239120" },
  { id: "go", name: "Go", icon: SiGo, color: "#00ADD8" },
  { id: "rust", name: "Rust", icon: SiRust, color: "#000000" },
  { id: "swift", name: "Swift", icon: SiSwift, color: "#FA7343" },
  { id: "kotlin", name: "Kotlin", icon: SiKotlin, color: "#7F52FF" },
  { id: "php", name: "PHP", icon: SiPhp, color: "#777BB4" },
];

// Get all supported languages
const ALL_LANGUAGES = getSupportedLanguages().map(langId => ({
  id: langId,
  name: getLanguageDisplayName(langId)
}));

/**
 * Component for room listing, creation and joining
 */
export default function CodeRoom() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomLanguage, setNewRoomLanguage] = useState("javascript");
  const [isLoading, setIsLoading] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [mounted, setMounted] = useState(false);
  
  const navigate = useNavigate();
  const rooms = useQuery(api.rooms.list);
  const createRoom = useMutation(api.rooms.create);
  const joinRoomByCode = useMutation(api.rooms.joinByCode);
  const { theme } = useTheme();
  
  // Animation trigger after mount
  useEffect(() => {
    setMounted(true);
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
    } catch (_error) {
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
    } catch (_error) {
      toast.error("Failed to join room. Invalid code.");
      setIsLoading(false);
    }
  }, [joinCode, joinRoomByCode, navigate]);
  
  const handleSelectRoom = useCallback((roomCode: string) => {
    if (roomCode) {
      void navigate(`/room/${roomCode}`);
    }
  }, [navigate]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors bg-noise">
      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-3 xs:p-4 sm:p-6 w-full max-w-[340px] sm:max-w-md shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 transform ${mounted ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}`}>
            <div className="relative mb-3 xs:mb-4 sm:mb-6">
              <div className="absolute inset-0 -z-10 bg-gradient-radial from-indigo-100/50 to-transparent dark:from-indigo-900/20 dark:to-transparent opacity-70 blur-xl rounded-xl"></div>
              <h2 className="text-base xs:text-lg sm:text-xl font-semibold text-gray-900 dark:text-white transition-colors flex items-center">
                <div className="mr-2 xs:mr-2 sm:mr-3 w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 flex items-center justify-center shadow-md">
                  <FiPlus className="text-white w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                </div>
                Create New Room
              </h2>
            </div>
            
            <div className="space-y-3 xs:space-y-4 sm:space-y-5">
              <div>
                <label htmlFor="roomName" className="block text-xs xs:text-sm sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 xs:mb-2 sm:mb-2 transition-colors">
                  Room Name
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name"
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-1.5 xs:py-2 sm:py-2.5 text-sm xs:text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-xs xs:text-sm sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 xs:mb-2 sm:mb-2 transition-colors">
                  Programming Language
                </label>
                
                {!showAllLanguages ? (
                  <>
                    <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-1 xs:gap-1.5 sm:gap-2 mb-2 xs:mb-3 sm:mb-3">
                      {POPULAR_LANGUAGES.map(lang => {
                        const IconComponent = lang.icon;
                        return (
                          <button
                            key={lang.id}
                            type="button"
                            onClick={() => setNewRoomLanguage(lang.id)}
                            className={`p-1 xs:p-1.5 sm:p-2 rounded-lg border transition-all hover-float ${newRoomLanguage === lang.id 
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/70 text-gray-700 dark:text-gray-300'}`}
                          >
                            <div className="flex flex-col items-center">
                              <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-9 sm:h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg mb-0.5 xs:mb-1 sm:mb-1.5">
                                <IconComponent 
                                  className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" 
                                  color={lang.color}
                                />
                              </div>
                              <span className="text-[10px] xs:text-xs sm:text-xs truncate w-full text-center">{lang.name}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAllLanguages(true)}
                      className="text-xs xs:text-sm sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                    >
                      Show all languages
                    </button>
                  </>
                ) : (
                  <>
                    <select
                      value={newRoomLanguage}
                      onChange={(e) => setNewRoomLanguage(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-1.5 xs:py-2 sm:py-2.5 text-sm xs:text-sm sm:text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors"
                      disabled={isLoading}
                    >
                      {ALL_LANGUAGES.map(lang => (
                        <option key={lang.id} value={lang.id}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowAllLanguages(false)}
                      className="text-xs xs:text-sm sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mt-2 transition-colors"
                    >
                      Show popular languages
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="mt-4 xs:mt-5 sm:mt-7 flex justify-end space-x-2 xs:space-x-3 sm:space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium transition-colors text-xs xs:text-sm sm:text-base"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreateRoom()}
                className="px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-400 dark:hover:to-purple-400 text-white rounded-lg font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-xs xs:text-sm sm:text-base"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    
      <div className="flex flex-col md:flex-row h-full w-full overflow-auto">
        {/* Left side - Create/Join */}
        <div className="w-full md:w-1/2 p-4 md:p-8 flex flex-col bg-white dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 transition-colors relative">
          {/* Background decorative elements */}
          <div className="absolute inset-0 -z-10 bg-gradient-radial from-indigo-100/30 to-transparent dark:from-indigo-900/10 dark:to-transparent opacity-70 pointer-events-none"></div>
          <div className="absolute inset-0 -z-20 bg-gradient-to-b from-purple-100/10 via-transparent to-indigo-100/10 dark:from-purple-900/10 dark:via-transparent dark:to-indigo-900/10 blur-2xl pointer-events-none"></div>
          
          <div className={`text-center mb-6 md:mb-10 transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="flex items-center justify-center mb-4 md:mb-6">
              <div className="w-16 h-16 md:w-20 md:h-20 relative subtle-rotation">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 rounded-full blur-md opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 rounded-full overflow-hidden border border-indigo-200 dark:border-indigo-700/50 flex items-center justify-center shadow-lg hover-float">
                  <FiCode className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                {/* Floating dots decoration */}
                <div className="absolute w-2 h-2 rounded-full bg-indigo-400 dark:bg-indigo-300 floating-dot" style={{ top: '-4px', right: '2px' }}></div>
                <div className="absolute w-1.5 h-1.5 rounded-full bg-purple-400 dark:bg-purple-300 floating-dot" style={{ bottom: '0px', left: '2px', animationDelay: '1s' }}></div>
              </div>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2 md:mb-3 transition-colors relative">
              <span className="relative">
                <span className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300 bg-clip-text text-transparent">Collaborative Coding</span>
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300 bg-clip-text text-transparent blur-[2px] opacity-30 -z-10 translate-y-[1px] translate-x-[0.5px]">Collaborative Coding</span>
              </span>
            </h1>
            
            {/* Ornamental divider with animation */}
            <div className="relative h-px w-32 mx-auto my-3 md:my-4 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/70 dark:via-indigo-400/70 to-transparent"></div>
              <div className="absolute inset-0 logo-shimmer"></div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 transition-colors text-sm md:text-base">
              Create or join a room to start coding <span className="inline-block italic font-normal bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">together</span>
            </p>
          </div>
          
          <div className={`space-y-6 md:space-y-8 flex-1 flex flex-col justify-center max-w-md mx-auto w-full transition-all duration-700 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <button
              onClick={handleCreateRoomClick}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-400 dark:hover:to-purple-400 text-white rounded-xl px-4 py-3 md:px-5 md:py-4 text-base md:text-lg font-medium transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] flex items-center justify-center"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-white/20 flex items-center justify-center mr-2 md:mr-3">
                  <FiPlus className="text-white" />
                </div>
                <span>Create a Room</span>
              </div>
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
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-green-500/10 to-indigo-500/10 dark:from-green-400/20 dark:to-indigo-400/20 flex items-center justify-center">
                    <FiHash className="h-4 w-4 md:h-5 md:w-5 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="Enter 6-character room code"
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl pl-12 md:pl-14 pr-4 py-3 md:py-3.5 text-center text-xs sm:text-sm md:text-base lg:text-lg tracking-widest uppercase text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors shadow-sm"
                  maxLength={6}
                />
                <div className="absolute inset-0 -z-10 rounded-xl opacity-0 transition-opacity duration-300 bg-gradient-to-r from-green-500/50 to-indigo-500/50 blur-lg group-focus-within:opacity-70"></div>
              </div>
              <button
                onClick={() => void handleJoinRoom()}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-400 dark:hover:to-emerald-400 text-white rounded-xl px-4 py-3 md:py-3.5 text-base md:text-lg font-medium transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
                disabled={joinCode.length !== 6 || isLoading}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-white/20 flex items-center justify-center mr-2 md:mr-3">
                    <FiUsers className="text-white" />
                  </div>
                  <span>{isLoading ? 'Joining...' : 'Join Room'}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Right side - Recent Rooms */}
        <div className="w-full md:w-1/2 p-4 md:p-8 bg-gray-50 dark:bg-gray-900/30 transition-colors overflow-auto flex flex-col items-center">
          <div className="w-full max-w-md lg:max-w-[80%] xl:max-w-[80%]">
            <h2 className={`text-lg md:text-xl font-semibold mb-4 md:mb-5 text-gray-900 dark:text-white transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} flex items-center`}>
              <div className="mr-2 w-6 h-6 md:w-7 md:h-7 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                <FiCode className="text-gray-500 dark:text-gray-400" />
              </div>
              Your Recent Rooms
            </h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-48 md:h-64">
                <div className="relative w-12 h-12 md:w-16 md:h-16">
                  <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-t-2 border-b-2 border-indigo-400 animate-spin-reverse" style={{ animationDuration: '1.5s' }}></div>
                  <div className="absolute inset-4 rounded-full border-t-2 border-indigo-300 animate-spin" style={{ animationDuration: '2s' }}></div>
                  <div className="absolute inset-6 rounded-full border-t-2 border-indigo-200 animate-spin-reverse" style={{ animationDuration: '2.5s' }}></div>
                </div>
              </div>
            ) : rooms && rooms.length > 0 ? (
              <div className={`overflow-auto max-h-[calc(100vh-160px)] md:max-h-[500px] pr-2 pb-4 transition-all duration-1000 delay-300 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <div className="space-y-3">
                  {rooms.map((room, index) => {
                    // Find the language icon if available
                    const language = POPULAR_LANGUAGES.find(lang => lang.id === room.language);
                    const IconComponent = language?.icon;
                    
                    return (
                      <button
                        key={room._id}
                        onClick={() => void handleSelectRoom(room.code)}
                        className="w-full text-left p-3 md:p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all shadow-sm hover:shadow-md hover:scale-[1.01] flex justify-between items-center"
                        style={{ 
                          transitionDelay: `${50 * (index % 10)}ms`,
                          opacity: mounted ? 1 : 0,
                          transform: mounted ? 'translateY(0)' : 'translateY(8px)'
                        }}
                      >
                        <div className="flex items-center">
                          {IconComponent ? (
                            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-lg mr-2 md:mr-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                              <IconComponent size={20} className="md:text-2xl" color={language.color} />
                            </div>
                          ) : (
                            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-lg mr-2 md:mr-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                              <FiCode size={18} className="md:text-xl text-gray-500 dark:text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white transition-colors text-sm md:text-base">{room.name}</p>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 transition-colors">
                              {getLanguageDisplayName(room.language)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 text-indigo-600 dark:text-indigo-400 py-1 px-2 md:py-1.5 md:px-3 rounded-full transition-colors">
                            {room.code}
                          </span>
                          <span className="ml-2 md:ml-3 text-indigo-600 dark:text-indigo-400 text-xs md:text-sm font-medium transition-colors">→</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className={`text-center py-10 md:py-16 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-1000 delay-300 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 md:mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-full blur-md opacity-70"></div>
                  <div className="absolute inset-0 flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                    <FiCode className="w-6 h-6 md:w-8 md:h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 transition-colors font-medium text-sm md:text-base">No recent rooms found</p>
                <p className="text-xs md:text-sm mt-2 text-gray-500 dark:text-gray-500 transition-colors">Create a new room to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
import { Authenticated, Unauthenticated, useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster, toast } from "sonner";
import Editor from "@monaco-editor/react";
import { useCallback, useEffect, useState, useMemo } from "react";
import { Id } from "../convex/_generated/dataModel";
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import AIReviewPanel from "./AIReviewPanel";
import { AIReview } from "./AIReviewPanel";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { FiMoon, FiSun, FiChevronLeft, FiPlay, FiCode, FiCpu, FiUsers, FiClipboard, FiTrash2, FiCopy } from "react-icons/fi";
import FileUploadButton from "./FileUploadButton";

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <BrowserRouter>
      <div className={`h-screen w-screen flex flex-col overflow-hidden ${theme === 'dark' ? 'dark' : ''}`}>
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 backdrop-blur-sm p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">CodeCuisine</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <>
                  <FiSun className="w-4 h-4" />
                  <span className="text-sm font-medium">Light</span>
                </>
              ) : (
                <>
                  <FiMoon className="w-4 h-4" />
                  <span className="text-sm font-medium">Dark</span>
                </>
              )}
            </button>
          <SignOutButton />
          </div>
        </header>
        <main className="flex-1 flex overflow-hidden w-full">
          <Authenticated>
            <Routes>
              <Route path="/" element={<Navigate to="/room" replace />} />
              <Route path="/room" element={<div className="w-full h-full"><CodeRoom /></div>} />
              <Route path="/room/:roomCode" element={<div className="w-full h-full"><RoomRouteHandler /></div>} />
              <Route path="*" element={<Navigate to="/room" replace />} />
            </Routes>
          </Authenticated>
          <Unauthenticated>
            <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900 transition-colors">
              <div className="w-full max-w-md mx-auto">
                <div className="text-center mb-8">
                  <h1 className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-4 transition-colors">CodeCuisine</h1>
                  <p className="text-xl text-slate-600 dark:text-slate-400 transition-colors">Sign in to start coding</p>
                </div>
                <SignInForm />
              </div>
            </div>
          </Unauthenticated>
        </main>
        <Toaster theme={theme} />
      </div>
    </BrowserRouter>
  );
}

// Helper component to handle the room/:roomCode route
function RoomRouteHandler() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState<Id<"rooms"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const joinRoomByCode = useMutation(api.rooms.joinByCode);
  
  // Load room by code
  useEffect(() => {
    async function loadRoom() {
      if (!roomCode) {
        void navigate('/room');
        return;
      }
      
      setIsLoading(true);
      try {
        const roomId = await joinRoomByCode({ code: roomCode });
        setRoomId(roomId);
      } catch (error) {
        toast.error("Invalid room code or room not found");
        void navigate('/room');
      } finally {
        setIsLoading(false);
      }
    }
    
    void loadRoom();
  }, [roomCode, joinRoomByCode, navigate]);
  
  // Handle navigation back to /room
  const handleBack = useCallback(() => {
    void navigate('/room');
  }, [navigate]);
  
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900 transition-colors">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-t-2 border-b-2 border-indigo-400 animate-spin-reverse" style={{ animationDuration: '1.5s' }}></div>
            <div className="absolute inset-6 rounded-full border-t-2 border-indigo-300 animate-spin" style={{ animationDuration: '2s' }}></div>
          </div>
          <p className="text-lg font-medium text-gray-800 dark:text-gray-200 transition-colors">Loading room...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">Connecting to {roomCode}</p>
        </div>
      </div>
    );
  }
  
  return <CodeEditor initialRoomId={roomId} onBack={handleBack} />;
}

const POPULAR_LANGUAGES = [
  { id: "javascript", name: "JavaScript", icon: "JS" },
  { id: "typescript", name: "TypeScript", icon: "TS" },
  { id: "python", name: "Python", icon: "PY" },
  { id: "java", name: "Java", icon: "JV" },
  { id: "cpp", name: "C++", icon: "C++" },
  { id: "csharp", name: "C#", icon: "C#" },
];

function CodeRoom() {
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

function CodeEditor({ initialRoomId, onBack }: { 
  initialRoomId: Id<"rooms"> | null, 
  onBack: () => void
}) {
  const [selectedRoomId, setSelectedRoomId] = useState<Id<"rooms"> | null>(initialRoomId);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [isGettingReview, setIsGettingReview] = useState(false);
  const [localCode, setLocalCode] = useState("");
  const [activeTab, setActiveTab] = useState<'editor' | 'output' | 'review'>('editor');
  const [review, setReview] = useState<AIReview | null>(null);
  const [executionTimestamp, setExecutionTimestamp] = useState<Date | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);
  
  const navigate = useNavigate();
  const { theme } = useTheme();
  const rooms = useQuery(api.rooms.list);
  const room = useQuery(
    api.rooms.get,
    selectedRoomId ? { roomId: selectedRoomId } : "skip"
  );
  const presence = useQuery(api.rooms.getPresence, 
    selectedRoomId ? { roomId: selectedRoomId } : "skip"
  );
  
  const updateCode = useMutation(api.rooms.updateCode);
  const updateLanguage = useMutation(api.rooms.updateLanguage);
  const updatePresence = useMutation(api.rooms.updatePresence);
  const executeCode = useAction(api.code.executeCode);
  const getAIAssistance = useAction(api.code.getAIAssistance);
  
  // Set code when room changes
  useEffect(() => {
    if (room) {
      const newCode = room.content || room.code || "";
      setCode(newCode);
      setLocalCode(newCode);
      setLastSaved(new Date()); // Set initial save time
    }
  }, [room]);
  
  // Redirect if room not found
  useEffect(() => {
    if (selectedRoomId && !isLoading && room === null) {
      toast.error("Room not found");
      void navigate('/room');
    }
  }, [selectedRoomId, room, isLoading, navigate]);
  
  // Debounced server update function
  const debouncedUpdateCode = useMemo(
    () =>
      debounce((value: string) => {
        if (!selectedRoomId) return;
        void updateCode({ roomId: selectedRoomId, code: value });
        setLastSaved(new Date());
      }, 500), // 500ms debounce delay
    [selectedRoomId, updateCode]
  );

  // Debounced cursor update function
  const debouncedUpdatePresence = useMemo(
    () =>
      debounce((position: { lineNumber: number; column: number }) => {
        if (!selectedRoomId) return;
        void updatePresence({
          roomId: selectedRoomId,
          cursor: {
            line: position.lineNumber,
            column: position.column,
          },
        });
      }, 100), // 100ms debounce delay for cursor
    [selectedRoomId, updatePresence]
  );

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (!value) return;
    setLocalCode(value); // Update local state immediately
    setCode(value);
    // Calculate word count
    const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
    setWordCount(wordCount);
    debouncedUpdateCode(value); // Debounced server update
  }, [debouncedUpdateCode]);

  const handleCursorChange = useCallback((editor: any) => {
    if (!selectedRoomId) return;
    const position = editor.getPosition();
    setCursorPosition({
      line: position.lineNumber,
      column: position.column
    });
    debouncedUpdatePresence(position);
  }, [selectedRoomId, debouncedUpdatePresence]);

  // Update word count on initial load
  useEffect(() => {
    if (localCode) {
      const wordCount = localCode.trim() ? localCode.trim().split(/\s+/).length : 0;
      setWordCount(wordCount);
    }
  }, [localCode]);

  // Enhanced editor options
  const editorOptions = useMemo(() => ({
    minimap: { enabled: false },
    fontSize: 14,
    wordWrap: 'on' as const,
    smoothScrolling: true,
    cursorSmoothCaretAnimation: 'on' as const,
    cursorBlinking: 'smooth' as const,
    renderWhitespace: 'selection' as const,
    formatOnPaste: true,
    formatOnType: true,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    renderLineHighlight: 'all' as const,
    tabSize: 2,
  }), []);

  const handleRunCode = useCallback(async () => {
    if (!code || !room) return;
    setIsRunningCode(true);
    setActiveTab('output');
    try {
      const result = await executeCode({ language: room.language, code });
      setOutput(result.run.output);
      setExecutionTimestamp(new Date());
      setExecutionTime(result.run.time);
    } catch (error) {
      setOutput("Error executing code");
      toast.error("Failed to execute code");
    } finally {
      setIsRunningCode(false);
    }
  }, [code, executeCode, room]);

  const handleAIAssist = useCallback(async () => {
    if (!code || !room) return;
    setIsGettingReview(true);
    setActiveTab('review');
    try {
      const response = await getAIAssistance({ code, language: room.language });
      // The response is already a JSON string from the backend
      setReview(JSON.parse(response));
    } catch (error) {
      toast.error("Failed to get AI assistance");
      setReview(null);
    } finally {
      setIsGettingReview(false);
    }
  }, [code, getAIAssistance, room]);
  
  const handleSelectRoom = useCallback((roomCode: string) => {
    if (roomCode) {
      void navigate(`/room/${roomCode}`);
    }
  }, [navigate]);

  const handleCopyCode = useCallback(() => {
    void navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  }, [code]);

  const handleClearCode = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all code?")) {
      setLocalCode("");
      setCode("");
      debouncedUpdateCode("");
      toast.info("Code cleared");
    }
  }, [debouncedUpdateCode]);

  const handleUploadCode = useCallback((content: string) => {
    setLocalCode(content);
    setCode(content);
    debouncedUpdateCode(content);
    toast.success("File uploaded successfully");
  }, [debouncedUpdateCode]);

  const handleLanguageChange = useCallback(async (language: string) => {
    if (!selectedRoomId || !room || room.language === language) return;
    
    setIsUpdatingLanguage(true);
    try {
      await updateLanguage({ roomId: selectedRoomId, language });
      toast.success(`Language updated to ${language}`);
    } catch (error) {
      toast.error("Failed to update language");
      console.error("Language update error:", error);
    } finally {
      setIsUpdatingLanguage(false);
    }
  }, [selectedRoomId, room, updateLanguage]);

  // Wrapper function that doesn't return a promise (for FileUploadButton)
  const handleDetectedLanguage = useCallback((language: string) => {
    void handleLanguageChange(language);
  }, [handleLanguageChange]);

  if (isLoading && !room) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900 transition-colors">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-t-2 border-b-2 border-indigo-400 animate-spin-reverse" style={{ animationDuration: '1.5s' }}></div>
            <div className="absolute inset-6 rounded-full border-t-2 border-indigo-300 animate-spin" style={{ animationDuration: '2s' }}></div>
          </div>
          <p className="text-lg font-medium text-gray-800 dark:text-gray-200 transition-colors">Loading room...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex overflow-hidden bg-white dark:bg-gray-900 transition-colors">
      {/* Left Sidebar - Room List */}
      <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-colors">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 transition-colors">
          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <FiChevronLeft className="w-4 h-4" />
            <span className="font-medium">Back to Main Menu</span>
          </button>
        </div>
        
        {room && (
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/20 transition-colors">
            <div className="text-center">
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400 mb-1.5 transition-colors">Room Code</p>
              <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-indigo-200 dark:border-indigo-700 px-3 py-2 transition-colors">
                <p className="text-xl tracking-wider font-mono font-semibold text-indigo-600 dark:text-indigo-400 transition-colors">
              {room.code}
            </p>
              </div>
              <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-2 transition-colors">Share this code with collaborators</p>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 transition-colors">Your Past Rooms</h3>
          <div className="space-y-2">
            {rooms?.map((room) => (
              <button
                key={room._id}
                onClick={() => void handleSelectRoom(room.code)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedRoomId === room._id
                      ? "bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-700"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <span className={`block font-medium truncate ${
                    selectedRoomId === room._id ? "text-indigo-700 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300"
                  } transition-colors`}>
                    {room.name}
                  </span>
                  <span className={`block text-xs mt-0.5 ${
                    selectedRoomId === room._id ? "text-indigo-500 dark:text-indigo-300" : "text-gray-500 dark:text-gray-400"
                  } transition-colors`}>
                    {room.language}
                  </span>
              </button>
            ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {selectedRoomId && room ? (
          <>
            {/* Header */}
            <div className="flex-none border-b border-gray-200 dark:border-gray-700 transition-colors">
              {/* Top bar with file info and actions */}
              <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">{room.name}</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors">Language:</span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 transition-colors">
                        {room.language}
                      </span>
                      {isUpdatingLanguage && (
                        <div className="ml-2 w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <FileUploadButton 
                    onFileContent={handleUploadCode} 
                    onLanguageDetected={handleDetectedLanguage}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  />
                  <button
                    onClick={handleCopyCode}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Copy code"
                  >
                    <FiCopy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleClearCode}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Clear code"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Action toolbar */}
              <div className="flex items-center justify-between px-6 py-2 bg-gray-50/80 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => void handleRunCode()}
                    disabled={isRunningCode}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                      isRunningCode
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-400 dark:text-blue-300 cursor-not-allowed'
                        : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 active:bg-blue-800 dark:active:bg-blue-700'
                    } transition-colors`}
                  >
                    {isRunningCode ? (
                      <>
                        <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Running Code...</span>
                      </>
                    ) : (
                      <>
                        <FiPlay className="w-4 h-4 mr-2" />
                        <span>Run Code</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => void handleAIAssist()}
                    disabled={isGettingReview}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                      isGettingReview
                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-400 dark:text-purple-300 cursor-not-allowed'
                        : 'bg-purple-600 dark:bg-purple-500 text-white hover:bg-purple-700 dark:hover:bg-purple-600 active:bg-purple-800 dark:active:bg-purple-700'
                    } transition-colors`}
                  >
                    {isGettingReview ? (
                      <>
                        <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Analyzing Code...</span>
                      </>
                    ) : (
                      <>
                        <FiCpu className="w-4 h-4 mr-2" />
                        <span>AI Review</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 transition-colors">
                  <button
                    onClick={() => setActiveTab('editor')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === 'editor'
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    <FiCode className="w-4 h-4" />
                    <span>Editor</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('output')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === 'output'
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600'
                    } relative`}
                  >
                    <FiPlay className="w-4 h-4" />
                    <span>Output</span>
                    {output && activeTab !== 'output' && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('review')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === 'review'
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600'
                    } relative`}
                  >
                    <FiCpu className="w-4 h-4" />
                    <span>Review</span>
                    {review && activeTab !== 'review' && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 relative overflow-hidden">
              {activeTab === 'editor' && (
                <div className="absolute inset-0">
                  <Editor
                    height="100%"
                    language={room.language}
                    value={localCode}
                    onChange={handleEditorChange}
                    onMount={(editor) => {
                      editor.onDidChangeCursorPosition(() => {
                        const position = editor.getPosition();
                        if (position) {
                          setCursorPosition({
                            line: position.lineNumber,
                            column: position.column
                          });
                          debouncedUpdatePresence(position);
                        }
                      });
                      // Set initial cursor position
                      const position = editor.getPosition();
                      if (position) {
                      setCursorPosition({
                        line: position.lineNumber,
                        column: position.column
                      });
                      }
                    }}
                    options={{
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      fontSize: 14,
                      lineHeight: 1.6,
                      padding: { top: 16, bottom: 16 },
                      bracketPairColorization: { enabled: true },
                      guides: {
                        bracketPairs: true,
                        indentation: true,
                      },
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      renderLineHighlight: 'all',
                      cursorBlinking: 'smooth',
                      cursorSmoothCaretAnimation: 'on',
                      smoothScrolling: true,
                      theme: theme === 'dark' ? "vs-dark" : "vs-light",
                      automaticLayout: true,
                      tabSize: 2,
                    }}
                  />
                </div>
              )}

              {activeTab === 'output' && (
                <div className="absolute inset-0">
                  <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-auto font-mono text-sm bg-gray-50 dark:bg-gray-950 transition-colors">
                      {output ? (
                        <div className="p-6">
                          <pre className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-100 transition-colors">
                            {output}
                          </pre>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">
                          <div className="text-center">
                            <FiPlay className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600 transition-colors" />
                            <p className="text-lg font-medium">No Output Yet</p>
                            <p className="text-sm mt-1">Run your code to see the output here</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {executionTimestamp && (
                      <div className="flex items-center justify-between px-6 py-3 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-500 text-xs border-t border-gray-200 dark:border-gray-800 transition-colors">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Executed at {executionTimestamp.toLocaleTimeString()}</span>
                          </div>
                        {executionTime && (
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span>Duration: {executionTime}ms</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span>{room.language}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'review' && (
                <div className="absolute inset-0">
                  <AIReviewPanel review={review} />
                </div>
              )}

              {isLoading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 relative">
                      <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-indigo-500 dark:border-indigo-400 animate-spin"></div>
                      <div className="absolute inset-2 rounded-full border-t-2 border-b-2 border-indigo-400 dark:border-indigo-300 animate-spin-reverse"></div>
                      <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-indigo-300 dark:border-indigo-200 animate-spin"></div>
                    </div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white transition-colors">Loading room...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">Please wait</p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between h-8 px-6 bg-gray-50 dark:bg-gray-800 text-xs border-t border-gray-200 dark:border-gray-700 transition-colors">
                <div className="flex items-center divide-x divide-gray-300 dark:divide-gray-600 transition-colors">
                  {activeTab === 'editor' && (
                    <>
                      <div className="pr-4 text-gray-600 dark:text-gray-400 transition-colors">
                        Ln {cursorPosition.line}, Col {cursorPosition.column}
                      </div>
                      <div className="px-4 text-gray-600 dark:text-gray-400 transition-colors">{wordCount} words</div>
                      <div className="px-4 font-medium text-gray-700 dark:text-gray-300 transition-colors">{room.language}</div>
                      {lastSaved && (
                        <div className="pl-4 text-gray-500 dark:text-gray-400 transition-colors">
                          Last saved: {lastSaved.toLocaleTimeString()}
                        </div>
                      )}
                    </>
                  )}
                  
                  {activeTab === 'output' && executionTimestamp && (
                    <>
                      <div className="pr-4 text-gray-600 dark:text-gray-400 transition-colors">{room.language}</div>
                      <div className="px-4 text-gray-600 dark:text-gray-400 transition-colors">
                        Executed: {executionTimestamp.toLocaleTimeString()}
                      </div>
                          {executionTime && (
                        <div className="pl-4 text-gray-600 dark:text-gray-400 transition-colors">
                          Duration: {executionTime}ms
                        </div>
                      )}
                    </>
                  )}
                  
                  {activeTab === 'review' && review && (
                    <>
                      <div className="pr-4 text-gray-600 dark:text-gray-400 transition-colors">
                        Issues: {review.issues.length}
                      </div>
                      <div className="px-4 text-gray-600 dark:text-gray-400 transition-colors">
                        Suggestions: {review.suggestions.length}
                      </div>
                      <div className="px-4 text-gray-600 dark:text-gray-400 transition-colors">
                        Improvements: {review.improvements.length}
                      </div>
                      {review.issues.length > 0 && (
                        <div className="pl-4 flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400 transition-colors">Severity:</span>
                          {review.issues.some(i => i.severity === 'high') && (
                            <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-[10px] font-medium transition-colors">
                              High
                            </span>
                          )}
                          {review.issues.some(i => i.severity === 'medium') && (
                            <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-[10px] font-medium transition-colors">
                              Medium
                            </span>
                          )}
                          {review.issues.some(i => i.severity === 'low') && (
                            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-[10px] font-medium transition-colors">
                              Low
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400 transition-colors">
                  {activeTab === 'review' && review?._metadata ? (
                    <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <FiCpu className="w-3.5 h-3.5" />
                        <span>{review._metadata.model}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                          <span>{new Date(review._metadata.created * 1000).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div>{new Date().toLocaleTimeString()}</div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800 transition-colors">
            <div className="text-center max-w-md mx-auto px-6">
              <svg className="w-16 h-16 mx-auto mb-6 text-gray-400 dark:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors">Select a Room</h3>
              <p className="text-gray-600 dark:text-gray-400 transition-colors">
                Choose a room from the sidebar to start coding or create a new one from the main menu
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Collaborators */}
      <div className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-colors">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 transition-colors">
          <h3 className="font-semibold text-gray-900 dark:text-white transition-colors flex items-center">
            <FiUsers className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
            Collaborators
          </h3>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {presence && presence.length > 0 ? (
            <div className="space-y-3">
              {presence.map((user) => (
                <div 
                  key={user._id} 
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center transition-colors">
                      <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300 transition-colors">
                        {user.name.charAt(0).toUpperCase()}
                  </span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 dark:bg-green-500 border-2 border-white dark:border-gray-800 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate transition-colors">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                      Line {user.cursor.line}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiUsers className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600 transition-colors" />
              <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">No active collaborators</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 transition-colors">
                Share the room code to invite others
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
    <BrowserRouter>
      <div className="h-screen w-screen flex flex-col overflow-hidden">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
          <h2 className="text-xl font-semibold accent-text">CodeCuisine</h2>
          <SignOutButton />
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
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-md mx-auto">
                <div className="text-center mb-8">
                  <h1 className="text-5xl font-bold accent-text mb-4">CodeCuisine</h1>
                  <p className="text-xl text-slate-600">Sign in to start coding</p>
                </div>
                <SignInForm />
              </div>
            </div>
          </Unauthenticated>
        </main>
        <Toaster />
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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading room...</p>
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
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Room</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Programming Language
                </label>
                
                {!showAllLanguages ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {POPULAR_LANGUAGES.map(lang => (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => setNewRoomLanguage(lang.id)}
                          className={`p-2 rounded border ${newRoomLanguage === lang.id 
                            ? 'bg-indigo-100 border-indigo-300 text-indigo-700' 
                            : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded mb-1">
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
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Show all languages
                    </button>
                  </>
                ) : (
                  <>
                    <select
                      value={newRoomLanguage}
                      onChange={(e) => setNewRoomLanguage(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                      className="text-sm text-indigo-600 hover:text-indigo-800 mt-1"
                    >
                      Show popular languages
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreateRoom()}
                className="px-4 py-2 bg-indigo-500 text-white rounded-md"
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
        <div className="w-1/2 p-8 flex flex-col">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold accent-text mb-4">Collaborative Coding</h1>
            <p className="text-gray-600">Create or join a room to start coding together</p>
          </div>
          
          <div className="space-y-8 flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
            <button
              onClick={handleCreateRoomClick}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-4 text-lg font-medium transition-colors"
            >
              Create a Room
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="Enter 6-character room code"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-lg tracking-widest uppercase"
                maxLength={6}
              />
              <button
                onClick={() => void handleJoinRoom()}
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-3 text-lg font-medium transition-colors"
                disabled={joinCode.length !== 6 || isLoading}
              >
                {isLoading ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Right side - Recent Rooms */}
        <div className="w-1/2 border-l p-8 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Your Recent Rooms</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : rooms && rooms.length > 0 ? (
            <div className="space-y-2 overflow-auto max-h-[500px] pr-2">
              {rooms.map((room) => (
                <button
                  key={room._id}
                  onClick={() => void handleSelectRoom(room.code)}
                  className="w-full text-left p-4 rounded border bg-white hover:bg-indigo-50 transition-colors flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{room.name}</p>
                    <p className="text-sm text-gray-500">{room.language}</p>
                  </div>
                  <span className="text-indigo-500 text-sm font-medium">Open</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No recent rooms found</p>
              <p className="text-sm mt-1">Create a new room to get started</p>
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
  
  const navigate = useNavigate();
  const rooms = useQuery(api.rooms.list);
  const room = useQuery(
    api.rooms.get,
    selectedRoomId ? { roomId: selectedRoomId } : "skip"
  );
  const presence = useQuery(api.rooms.getPresence, 
    selectedRoomId ? { roomId: selectedRoomId } : "skip"
  );
  
  const updateCode = useMutation(api.rooms.updateCode);
  const updatePresence = useMutation(api.rooms.updatePresence);
  const executeCode = useAction(api.code.executeCode);
  const getAIAssistance = useAction(api.code.getAIAssistance);
  
  // Set code when room changes
  useEffect(() => {
    if (room) {
      const newCode = room.content || room.code || "";
      setCode(newCode);
      setLocalCode(newCode);
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
    debouncedUpdateCode(value); // Debounced server update
  }, [debouncedUpdateCode]);

  const handleCursorChange = useCallback((editor: any) => {
    if (!selectedRoomId) return;
    const position = editor.getPosition();
    debouncedUpdatePresence(position);
  }, [selectedRoomId, debouncedUpdatePresence]);

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
    try {
      const result = await executeCode({ language: room.language, code });
      setOutput(result.run.output);
      setExecutionTimestamp(new Date());
      setExecutionTime(result.run.time);
      setActiveTab('output');
    } catch (error) {
      setOutput("Error executing code");
    } finally {
      setIsRunningCode(false);
    }
  }, [code, executeCode, room]);

  const handleAIAssist = useCallback(async () => {
    if (!code || !room) return;
    setIsGettingReview(true);
    try {
      const response = await getAIAssistance({ code, language: room.language });
      // The response is already a JSON string from the backend
      setReview(JSON.parse(response));
      setActiveTab('review');
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

  if (isLoading && !room) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* Left Sidebar - Room List */}
      <div className="w-64 border-r flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <button
            onClick={onBack}
            className="w-full border border-gray-300 text-gray-700 rounded px-4 py-2 hover:bg-gray-50"
          >
            Back to Main Menu
          </button>
        </div>
        
        {room && (
          <div className="p-4 bg-indigo-50 border-b border-indigo-100">
            <p className="font-semibold mb-1">Room Code:</p>
            <p className="text-xl tracking-wide font-mono text-center bg-white p-1 rounded border">
              {room.code}
            </p>
            <p className="text-xs text-center mt-1 text-gray-500">Share this code with collaborators</p>
          </div>
        )}
        
        <div className="flex-1 overflow-auto p-4">
          <p className="font-semibold mb-2 text-sm text-gray-500">Your Past Rooms:</p>
          <div className="space-y-2">
            {rooms?.map((room) => (
              <button
                key={room._id}
                onClick={() => void handleSelectRoom(room.code)}
                className={`w-full text-left p-2 rounded ${
                  selectedRoomId === room._id
                    ? "bg-indigo-100"
                    : "hover:bg-gray-100"
                }`}
              >
                <span className="block font-medium truncate">{room.name}</span>
                <span className="block text-xs text-gray-500">{room.language}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedRoomId && room ? (
          <>
            {/* Header */}
            <div className="border-b border-gray-200">
              {/* Top bar with file info and actions */}
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
                <div className="flex items-center space-x-4">
                  <h2 className="font-medium">{room.name}</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Language:</span>
                    <span className="text-sm font-medium">{room.language}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      void navigator.clipboard.writeText(code);
                      toast.success("Code copied to clipboard");
                    }}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    title="Copy code"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setLocalCode("")}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    title="Clear code"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Action toolbar */}
              <div className="flex items-center justify-between px-4 py-2 bg-gray-100/50">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => void handleRunCode()}
                    disabled={isRunningCode}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      isRunningCode
                        ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isRunningCode ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Run Code</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => void handleAIAssist()}
                    disabled={isGettingReview}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      isGettingReview
                        ? 'bg-purple-100 text-purple-400 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {isGettingReview ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>AI Review</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center rounded-lg bg-white/80 p-1">
                  <button
                    onClick={() => setActiveTab('editor')}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      activeTab === 'editor'
                        ? 'bg-gray-200 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>Editor</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('output')}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      activeTab === 'output'
                        ? 'bg-gray-200 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>Output</span>
                    {output && activeTab !== 'output' && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('review')}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      activeTab === 'review'
                        ? 'bg-gray-200 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>Review</span>
                    {review && activeTab !== 'review' && (
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 relative">
              {activeTab === 'editor' && (
                <Editor
                  height="100%"
                  language={room.language}
                  value={localCode}
                  onChange={handleEditorChange}
                  onMount={(editor) => {
                    editor.onDidChangeCursorPosition(() => handleCursorChange(editor));
                  }}
                  options={{
                    fontFamily: "'Fira Code', monospace",
                    bracketPairColorization: { enabled: true },
                    ...editorOptions
                  }}
                />
              )}

              {activeTab === 'output' && (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-auto p-4 font-mono bg-gray-900 text-gray-100">
                {output || "Run your code to see the output here..."}
                  </div>
                  {executionTimestamp && (
                    <div className="p-2 bg-gray-800 text-gray-400 text-xs border-t border-gray-700">
                      <span>Executed at: {executionTimestamp.toLocaleTimeString()}</span>
                      {executionTime && (
                        <span className="ml-4">Duration: {executionTime}ms</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'review' && (
                <div className="h-full overflow-hidden">
                  <AIReviewPanel review={review} />
                </div>
              )}

              {isLoading && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-700">Loading room...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 h-6 bg-gray-50 text-gray-600 text-xs border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <div>Ln {cursorPosition.line}, Col {cursorPosition.column}</div>
                <div>{wordCount} words</div>
                <div>{room.language}</div>
              </div>
              <div className="flex items-center space-x-4">
                {lastSaved && (
                  <div>Last saved: {lastSaved.toLocaleTimeString()}</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl mb-4">Select a room from the sidebar</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Collaborators */}
      <div className="w-64 border-l flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Collaborators</h3>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {presence && presence.length > 0 ? (
            <div className="space-y-2">
              {presence.map((user) => (
                <div key={user._id} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>{user.name}</span>
                  <span className="text-xs text-gray-500">
                    Line {user.cursor.line}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active collaborators</p>
          )}
        </div>
      </div>
    </div>
  );
}

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
    <div className="w-full h-full flex overflow-hidden bg-gray-50">
      {/* Left Sidebar - Room List */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Main Menu</span>
          </button>
        </div>
        
        {room && (
          <div className="p-4 bg-indigo-50/50 border-b border-indigo-100">
            <div className="text-center">
              <p className="text-sm font-medium text-indigo-700 mb-1.5">Room Code</p>
              <div className="bg-white rounded-lg border-2 border-indigo-200 px-3 py-2">
                <p className="text-xl tracking-wider font-mono font-semibold text-indigo-600">
              {room.code}
            </p>
              </div>
              <p className="text-xs text-indigo-600/70 mt-2">Share this code with collaborators</p>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Past Rooms</h3>
          <div className="space-y-2">
            {rooms?.map((room) => (
              <button
                key={room._id}
                onClick={() => void handleSelectRoom(room.code)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedRoomId === room._id
                      ? "bg-indigo-50 border-2 border-indigo-200"
                      : "hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  <span className={`block font-medium truncate ${
                    selectedRoomId === room._id ? "text-indigo-700" : "text-gray-700"
                  }`}>
                    {room.name}
                  </span>
                  <span className={`block text-xs mt-0.5 ${
                    selectedRoomId === room._id ? "text-indigo-500" : "text-gray-500"
                  }`}>
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
            <div className="flex-none border-b border-gray-200">
              {/* Top bar with file info and actions */}
              <div className="flex items-center justify-between px-6 py-3 bg-white">
                <div className="flex items-center space-x-6">
                  <h2 className="text-lg font-semibold text-gray-900">{room.name}</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Language:</span>
                    <span className="text-sm font-medium px-2 py-1 bg-gray-100 rounded-md text-gray-700">
                      {room.language}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      void navigator.clipboard.writeText(code);
                      toast.success("Code copied to clipboard");
                    }}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copy code"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setLocalCode("")}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Clear code"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Action toolbar */}
              <div className="flex items-center justify-between px-6 py-2 bg-gray-50/80 border-t border-gray-100">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => void handleRunCode()}
                    disabled={isRunningCode}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                      isRunningCode
                        ? 'bg-blue-50 text-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                    }`}
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
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                      isGettingReview
                        ? 'bg-purple-50 text-purple-400 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800'
                    }`}
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
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>AI Review</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
                  <button
                    onClick={() => setActiveTab('editor')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === 'editor'
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span>Editor</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('output')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === 'output'
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Output</span>
                    {output && activeTab !== 'output' && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('review')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === 'review'
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>Review</span>
                    {review && activeTab !== 'review' && (
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
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
                      theme: "vs-dark",
                      automaticLayout: true,
                      tabSize: 2,
                    }}
                  />
                </div>
              )}

              {activeTab === 'output' && (
                <div className="absolute inset-0">
                  <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-auto font-mono text-sm bg-gray-900">
                      {output ? (
                        <div className="p-6">
                          <pre className="whitespace-pre-wrap break-words text-gray-100">
                            {output}
                          </pre>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-lg font-medium">No Output Yet</p>
                            <p className="text-sm mt-1">Run your code to see the output here</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {executionTimestamp && (
                      <div className="flex items-center justify-between px-6 py-3 bg-gray-800 text-gray-400 text-xs border-t border-gray-700">
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
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 relative">
                      <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
                      <div className="absolute inset-2 rounded-full border-t-2 border-b-2 border-indigo-400 animate-spin-reverse"></div>
                      <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-indigo-300 animate-spin"></div>
                    </div>
                    <p className="text-lg font-medium text-gray-900">Loading room...</p>
                    <p className="text-sm text-gray-500 mt-1">Please wait</p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between h-8 px-6 bg-gray-50 text-xs border-t border-gray-200">
                <div className="flex items-center divide-x divide-gray-300">
                  {activeTab === 'editor' && (
                    <>
                      <div className="pr-4 text-gray-600">
                        Ln {cursorPosition.line}, Col {cursorPosition.column}
                      </div>
                      <div className="px-4 text-gray-600">{wordCount} words</div>
                      <div className="px-4 font-medium text-gray-700">{room.language}</div>
                      {lastSaved && (
                        <div className="pl-4 text-gray-500">
                          Last saved: {lastSaved.toLocaleTimeString()}
                        </div>
                      )}
                    </>
                  )}
                  
                  {activeTab === 'output' && executionTimestamp && (
                    <>
                      <div className="pr-4 text-gray-600">{room.language}</div>
                      <div className="px-4 text-gray-600">
                        Executed: {executionTimestamp.toLocaleTimeString()}
                      </div>
                          {executionTime && (
                        <div className="pl-4 text-gray-600">
                          Duration: {executionTime}ms
                        </div>
                      )}
                    </>
                  )}
                  
                  {activeTab === 'review' && review && (
                    <>
                      <div className="pr-4 text-gray-600">
                        Issues: {review.issues.length}
                      </div>
                      <div className="px-4 text-gray-600">
                        Suggestions: {review.suggestions.length}
                      </div>
                      <div className="px-4 text-gray-600">
                        Improvements: {review.improvements.length}
                      </div>
                      {review.issues.length > 0 && (
                        <div className="pl-4 flex items-center gap-2">
                          <span className="text-gray-600">Severity:</span>
                          {review.issues.some(i => i.severity === 'high') && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-medium">
                              High
                            </span>
                          )}
                          {review.issues.some(i => i.severity === 'medium') && (
                            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] font-medium">
                              Medium
                            </span>
                          )}
                          {review.issues.some(i => i.severity === 'low') && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                              Low
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-gray-500">
                  {activeTab === 'review' && review?._metadata ? (
                    <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
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
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md mx-auto px-6">
              <svg className="w-16 h-16 mx-auto mb-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Room</h3>
              <p className="text-gray-600">
                Choose a room from the sidebar to start coding or create a new one from the main menu
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Collaborators */}
      <div className="w-64 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Collaborators</h3>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {presence && presence.length > 0 ? (
            <div className="space-y-3">
              {presence.map((user) => (
                <div 
                  key={user._id} 
                  className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-200"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-700">
                        {user.name.charAt(0).toUpperCase()}
                  </span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Line {user.cursor.line}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            <p className="text-sm text-gray-500">No active collaborators</p>
              <p className="text-xs text-gray-400 mt-1">
                Share the room code to invite others
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

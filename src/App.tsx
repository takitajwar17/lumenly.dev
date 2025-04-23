import { Authenticated, Unauthenticated, useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster, toast } from "sonner";
import Editor from "@monaco-editor/react";
import { useCallback, useEffect, useState } from "react";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold accent-text">CodeCuisine</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 flex">
        <Authenticated>
          <CodeRoom />
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
  );
}

function CodeRoom() {
  const [view, setView] = useState<"selection" | "editor">("selection");
  const [selectedRoomId, setSelectedRoomId] = useState<Id<"rooms"> | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomLanguage, setNewRoomLanguage] = useState("javascript");
  const [isLoading, setIsLoading] = useState(false);
  const [languages, setLanguages] = useState<any[]>([]);
  
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
  }, []);
  
  const handleCloseModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setNewRoomName("");
  }, []);
  
  const handleCreateRoom = useCallback(async () => {
    if (!newRoomName.trim()) {
      toast.error("Room name cannot be empty");
      return;
    }
    
    setIsLoading(true);
    try {
      const roomId = await createRoom({ 
        name: newRoomName.trim(), 
        language: newRoomLanguage 
      });
      setSelectedRoomId(roomId);
      setView("editor");
      setIsCreateModalOpen(false);
      toast.success("Room created successfully!");
    } catch (error) {
      toast.error("Failed to create room");
    } finally {
      setIsLoading(false);
    }
  }, [newRoomName, newRoomLanguage, createRoom]);
  
  const handleJoinRoom = useCallback(async () => {
    if (joinCode.length !== 6) {
      toast.error("Room code should be 6 characters");
      return;
    }
    
    setIsLoading(true);
    try {
      const roomId = await joinRoomByCode({ code: joinCode });
      setSelectedRoomId(roomId);
      setView("editor");
      toast.success("Joined room successfully!");
    } catch (error) {
      toast.error("Failed to join room. Invalid code.");
    } finally {
      setIsLoading(false);
    }
  }, [joinCode, joinRoomByCode]);
  
  const handleSelectRoom = useCallback((roomId: Id<"rooms">) => {
    setSelectedRoomId(roomId);
    setView("editor");
  }, []);

  if (view === "selection") {
    return (
      <div className="flex-1 flex flex-col">
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
                  />
                </div>
                
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                    Programming Language
                  </label>
                  <select
                    id="language"
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
                      <option value="javascript">JavaScript</option>
                    )}
                  </select>
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
      
        <div className="flex h-full">
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
                    onClick={() => handleSelectRoom(room._id)}
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
  
  return (
    <CodeEditor 
      initialRoomId={selectedRoomId} 
      onBack={() => setView("selection")} 
    />
  );
}

function CodeEditor({ initialRoomId, onBack }: { 
  initialRoomId: Id<"rooms"> | null, 
  onBack: () => void
}) {
  const [selectedRoomId, setSelectedRoomId] = useState<Id<"rooms"> | null>(initialRoomId);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [languages, setLanguages] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [isLoading, setIsLoading] = useState(false);

  const rooms = useQuery(api.rooms.list);
  const room = useQuery(
    api.rooms.get,
    selectedRoomId ? { roomId: selectedRoomId } : "skip"
  );
  const presence = useQuery(api.rooms.getPresence, 
    selectedRoomId ? { roomId: selectedRoomId } : "skip"
  );
  
  const createRoom = useMutation(api.rooms.create);
  const updateCode = useMutation(api.rooms.updateCode);
  const updatePresence = useMutation(api.rooms.updatePresence);
  const executeCode = useAction(api.code.executeCode);
  const getAIAssistance = useAction(api.code.getAIAssistance);

  useEffect(() => {
    void fetch("https://emkc.org/api/v2/piston/runtimes")
      .then((r) => r.json())
      .then(setLanguages)
      .catch(err => console.error("Failed to fetch languages:", err));
  }, []);
  
  // Set code when room changes
  useEffect(() => {
    if (room) {
      // Handle both new rooms with content field and old rooms without it
      setCode(room.content || room.code || "");
      setSelectedLanguage(room.language);
    }
  }, [room]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (!value || !selectedRoomId) return;
    setCode(value);
    void updateCode({ roomId: selectedRoomId, code: value });
  }, [selectedRoomId, updateCode]);

  const handleCursorChange = useCallback((editor: any) => {
    if (!selectedRoomId) return;
    const position = editor.getPosition();
    void updatePresence({
      roomId: selectedRoomId,
      cursor: {
        line: position.lineNumber,
        column: position.column,
      },
    });
  }, [selectedRoomId, updatePresence]);

  const handleCreateRoom = useCallback(async () => {
    const name = prompt("Enter room name:");
    if (!name) return;
    setIsLoading(true);
    try {
      const roomId = await createRoom({ name, language: selectedLanguage });
      setSelectedRoomId(roomId);
      toast.success(`Room created! Share code: ${room?.code || "Loading..."}`);
    } catch (error) {
      toast.error("Failed to create room");
    } finally {
      setIsLoading(false);
    }
  }, [createRoom, selectedLanguage, room?.code]);

  const handleRunCode = useCallback(async () => {
    if (!code) return;
    setIsLoading(true);
    try {
      const result = await executeCode({ language: selectedLanguage, code });
      setOutput(result.run.output);
    } catch (error) {
      setOutput("Error executing code");
    } finally {
      setIsLoading(false);
    }
  }, [code, executeCode, selectedLanguage]);

  const handleAIAssist = useCallback(async () => {
    if (!code) return;
    setIsLoading(true);
    try {
      const suggestion = await getAIAssistance({ code, language: selectedLanguage });
      toast.info(suggestion);
    } catch (error) {
      toast.error("Failed to get AI assistance");
    } finally {
      setIsLoading(false);
    }
  }, [code, getAIAssistance, selectedLanguage]);
  
  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);

  if (isLoading && !selectedRoomId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Left Sidebar - Room List */}
      <div className="w-64 border-r p-4 flex flex-col">
        <div className="mb-4 flex flex-col gap-2">
          <button
            onClick={handleBack}
            className="w-full border border-gray-300 text-gray-700 rounded px-4 py-2"
          >
            Back to Main Menu
          </button>
          <button
            onClick={() => void handleCreateRoom()}
            className="w-full bg-indigo-500 text-white rounded px-4 py-2"
          >
            New Room
          </button>
        </div>
        
        {room && (
          <div className="mb-4 p-3 bg-indigo-50 rounded border border-indigo-100">
            <p className="font-semibold mb-1">Room Code:</p>
            <p className="text-xl tracking-wide font-mono text-center bg-white p-1 rounded border">
              {room.code}
            </p>
            <p className="text-xs text-center mt-1 text-gray-500">Share this code with collaborators</p>
          </div>
        )}
        
        <div className="flex-1 overflow-auto">
          <p className="font-semibold mb-2 text-sm text-gray-500">Your Rooms:</p>
          {rooms?.map((room) => (
            <button
              key={room._id}
              onClick={() => setSelectedRoomId(room._id)}
              className={`w-full text-left p-2 rounded mb-2 ${
                selectedRoomId === room._id
                  ? "bg-indigo-100"
                  : "hover:bg-gray-100"
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {selectedRoomId ? (
          <>
            <div className="flex-1">
              <Editor
                height="100%"
                language={selectedLanguage}
                value={code}
                onChange={handleEditorChange}
                onMount={(editor) => {
                  editor.onDidChangeCursorPosition(() => handleCursorChange(editor));
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                }}
              />
            </div>
            
            {/* Bottom Toolbar */}
            <div className="border-t p-4 flex items-center gap-4">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="border rounded px-2 py-1"
              >
                {languages.map((lang) => (
                  <option key={lang.language} value={lang.language}>
                    {lang.language}
                  </option>
                ))}
              </select>
              <button
                onClick={() => void handleRunCode()}
                className="bg-green-500 text-white rounded px-4 py-1"
                disabled={isLoading}
              >
                Run
              </button>
              <button
                onClick={() => void handleAIAssist()}
                className="bg-purple-500 text-white rounded px-4 py-1"
                disabled={isLoading}
              >
                AI Assist
              </button>
            </div>
            
            {/* Output Panel */}
            <div className="h-32 border-t overflow-auto p-4 font-mono whitespace-pre">
              {output}
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

      {/* Right Sidebar - Presence */}
      <div className="w-64 border-l p-4">
        <h3 className="font-semibold mb-4">Collaborators</h3>
        <div className="space-y-2">
          {presence?.map((user) => (
            <div key={user._id} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>{user.name}</span>
              <span className="text-xs text-gray-500">
                Line {user.cursor.line}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useTheme } from "../ThemeContext";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import { FiChevronLeft } from "react-icons/fi";
import FileUploadButton from "../FileUploadButton";
import AIReviewPanel, { AIReview } from "../AIReviewPanel";
import CollaboratorsPanel from "./collaboration/CollaboratorsPanel";
import EditorToolbar from "./editor/EditorToolbar";
import CodeOutput from "./editor/CodeOutput";
import EditorFooter from "./editor/EditorFooter";
import { debounce } from "../utils/debounce";

interface CodeEditorProps {
  initialRoomId: Id<"rooms"> | null;
  onBack: () => void;
}

export default function CodeEditor({ initialRoomId, onBack }: CodeEditorProps) {
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
  const [lastTypingTime, setLastTypingTime] = useState<number>(0);
  const [typingTimeoutId, setTypingTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
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
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const executeCode = useAction(api.code.executeCode);
  const getAIAssistance = useAction(api.code.getAIAssistance);
  
  // Track presence changes to show notifications
  const [previousPresence, setPreviousPresence] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<{
    type: 'join' | 'leave' | 'system';
    user: any;
    timestamp: number;
    message?: string;
  }[]>([]);
  
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
  
  // Set code when room changes
  useEffect(() => {
    if (room) {
      const newCode = room.content || room.code || "";
      setCode(newCode);
      setLocalCode(newCode);
      setLastSaved(new Date()); // Set initial save time
    }
  }, [room]);
  
  // Handle room leaving - this is crucial for cleaning up presence
  useEffect(() => {
    if (!selectedRoomId) return;

    // Function to handle room leaving
    const handleLeaveRoom = () => {
      if (selectedRoomId) {
        void leaveRoom({ roomId: selectedRoomId });
      }
    };

    // Set up event listener for page unload
    window.addEventListener('beforeunload', handleLeaveRoom);

    // Clean up function
    return () => {
      window.removeEventListener('beforeunload', handleLeaveRoom);
      // Also call handleLeaveRoom when the component unmounts
      handleLeaveRoom();
    };
  }, [selectedRoomId, leaveRoom]);
  
  // Handle back button click with proper cleanup
  const handleBackWithCleanup = useCallback(() => {
    if (selectedRoomId) {
      void leaveRoom({ roomId: selectedRoomId }).then(() => {
        onBack(); // Only navigate back after cleanup
      });
    } else {
      onBack();
    }
  }, [selectedRoomId, leaveRoom, onBack]);
  
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
      debounce((position: { lineNumber: number; column: number }, selection?: any, isActive?: boolean) => {
        if (!selectedRoomId) return;
        
        const presenceData: any = {
          roomId: selectedRoomId,
          cursor: {
            line: position.lineNumber,
            column: position.column,
          },
          isActive,
        };
        
        // Add selection data if available
        if (selection && 
            selection.startLineNumber !== undefined && 
            selection.endLineNumber !== undefined) {
          presenceData.selection = {
            startLine: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLine: selection.endLineNumber,
            endColumn: selection.endColumn,
          };
        }
        
        void updatePresence(presenceData);
      }, 100), // 100ms debounce delay for cursor
    [selectedRoomId, updatePresence]
  );

  // Update presence tracking effect
  useEffect(() => {
    if (!selectedRoomId || !editorRef.current) return;
    
    // Update presence in intervals to ensure consistent visibility
    const intervalId = setInterval(() => {
      const position = editorRef.current.getPosition();
      const selection = editorRef.current.getSelection();
      
      if (position) {
        // For interval updates, always set isTyping to false
        void updatePresence({
          roomId: selectedRoomId,
          cursor: {
            line: position.lineNumber,
            column: position.column,
          },
          selection: selection ? {
            startLine: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLine: selection.endLineNumber,
            endColumn: selection.endColumn,
          } : undefined,
          isActive: false,
          isTyping: false
        });
      }
    }, 5000); // Update every 5 seconds
    
    // Add a more frequent heartbeat ping (every 3 seconds)
    const heartbeatId = setInterval(() => {
      if (editorRef.current) {
        const position = editorRef.current.getPosition();
        if (position && selectedRoomId) {
          void updatePresence({
            roomId: selectedRoomId,
            cursor: {
              line: position.lineNumber,
              column: position.column,
            },
            isActive: true
          });
        }
      }
    }, 3000);
    
    // Clean up
    return () => {
      clearInterval(intervalId);
      clearInterval(heartbeatId);
      if (typingTimeoutId) {
        clearTimeout(typingTimeoutId);
      }
    };
  }, [selectedRoomId, updatePresence, typingTimeoutId]);
  
  // Store editor instance reference
  const editorRef = useRef<any>(null);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (!value || !selectedRoomId) return;
    setLocalCode(value); // Update local state immediately
    setCode(value);
    
    // Calculate word count
    const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
    setWordCount(wordCount);
    debouncedUpdateCode(value); // Debounced server update
    
    // Update typing timestamp
    setLastTypingTime(Date.now());
    
    // User is actively typing
    if (editorRef.current) {
      const position = editorRef.current.getPosition();
      const selection = editorRef.current.getSelection();
      
      if (position && selectedRoomId) {
        // Set both isActive and isTyping to true for actual text changes
        void updatePresence({
          roomId: selectedRoomId,
          cursor: {
            line: position.lineNumber,
            column: position.column,
          },
          selection: selection ? {
            startLine: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLine: selection.endLineNumber,
            endColumn: selection.endColumn,
          } : undefined,
          isActive: true,
          isTyping: true
        });
        
        // Clear any existing typing timeout
        if (typingTimeoutId) {
          clearTimeout(typingTimeoutId);
        }
        
        // Set a new timeout to turn off the typing flag after 500ms
        const timeoutId = setTimeout(() => {
          if (editorRef.current && selectedRoomId) {
            const currentPosition = editorRef.current.getPosition();
            const currentSelection = editorRef.current.getSelection();
            
            if (currentPosition) {
              void updatePresence({
                roomId: selectedRoomId,
                cursor: {
                  line: currentPosition.lineNumber,
                  column: currentPosition.column,
                },
                selection: currentSelection ? {
                  startLine: currentSelection.startLineNumber,
                  startColumn: currentSelection.startColumn,
                  endLine: currentSelection.endLineNumber,
                  endColumn: currentSelection.endColumn,
                } : undefined,
                isActive: true,
                isTyping: false // Turn off typing status
              });
            }
          }
        }, 500);
        
        setTypingTimeoutId(timeoutId);
      }
    }
  }, [selectedRoomId, updatePresence, debouncedUpdateCode, typingTimeoutId]);

  // Add an additional handler for selection changes
  useEffect(() => {
    if (!editorRef.current || !selectedRoomId) return;
    
    // Add selection change listener
    const editor = editorRef.current;
    const selectionChangeDisposable = editor.onDidChangeCursorSelection((e: any) => {
      // Only consider it a selection if text is actually selected
      const isTextSelected = e.selection && 
        (e.selection.startLineNumber !== e.selection.endLineNumber || 
         e.selection.startColumn !== e.selection.endColumn);
      
      // When selection changes, update presence
      const position = editor.getPosition();
      if (position) {
        void updatePresence({
          roomId: selectedRoomId,
          cursor: {
            line: position.lineNumber,
            column: position.column,
          },
          selection: isTextSelected ? {
            startLine: e.selection.startLineNumber,
            startColumn: e.selection.startColumn,
            endLine: e.selection.endLineNumber,
            endColumn: e.selection.endColumn,
          } : undefined,
          isActive: true,
        });
      }
    });
    
    // Clean up
    return () => {
      selectionChangeDisposable.dispose();
    };
  }, [selectedRoomId, updatePresence]);
  
  // Cursor movement without typing
  useEffect(() => {
    if (!editorRef.current || !selectedRoomId) return;
    
    const editor = editorRef.current;
    const cursorPositionDisposable = editor.onDidChangeCursorPosition((e: any) => {
      // Only handle if this is just a cursor move, not a selection
      const selection = editor.getSelection();
      const isJustCursorMove = !selection || 
        (selection.startLineNumber === selection.endLineNumber && 
         selection.startColumn === selection.endColumn);
      
      if (isJustCursorMove) {
        void updatePresence({
          roomId: selectedRoomId,
          cursor: {
            line: e.position.lineNumber,
            column: e.position.column,
          },
          selection: undefined,
          isActive: true,
        });
      }
    });
    
    return () => {
      cursorPositionDisposable.dispose();
    };
  }, [selectedRoomId, updatePresence]);

  // Update word count on initial load
  useEffect(() => {
    if (localCode) {
      const wordCount = localCode.trim() ? localCode.trim().split(/\s+/).length : 0;
      setWordCount(wordCount);
    }
  }, [localCode]);

  // Editor options
  const editorOptions = useMemo(() => ({
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
    tabSize: 2,
    automaticLayout: true,
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
    setLocalCode("");
    setCode("");
    debouncedUpdateCode("");
    toast.info("Code cleared");
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

  // Non-promise wrapper
  const handleDetectedLanguage = useCallback((language: string) => {
    void handleLanguageChange(language);
  }, [handleLanguageChange]);

  const handleClearActivityLog = useCallback(() => {
    setActivityLog([]);
  }, []);

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
            onClick={handleBackWithCleanup}
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
            {/* Header with toolbar */}
            <EditorToolbar 
              room={room}
              activeTab={activeTab}
              isRunningCode={isRunningCode}
              isGettingReview={isGettingReview}
              output={output}
              review={review}
              onRunCode={handleRunCode}
              onAIAssist={handleAIAssist}
              onTabChange={setActiveTab}
              onCopyCode={handleCopyCode}
              onClearCode={handleClearCode}
              onUploadCode={handleUploadCode}
              onLanguageDetected={handleDetectedLanguage}
              isUpdatingLanguage={isUpdatingLanguage}
              presence={presence}
            />

            {/* Main Content */}
            <div className="flex-1 relative overflow-hidden">
              {activeTab === 'editor' && (
                <div className="absolute inset-0">
                  <Editor
                    height="100%"
                    language={room.language}
                    value={localCode}
                    onChange={handleEditorChange}
                    onMount={(editor, monaco) => {
                      // Store editor reference
                      editorRef.current = editor;
                      
                      editor.onDidChangeCursorPosition(() => {
                        const position = editor.getPosition();
                        const selection = editor.getSelection();
                        if (position) {
                          setCursorPosition({
                            line: position.lineNumber,
                            column: position.column
                          });
                          debouncedUpdatePresence(position, selection, true);
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
                      ...editorOptions,
                      theme: theme === 'dark' ? "vs-dark" : "vs-light",
                    }}
                  />
                </div>
              )}

              {activeTab === 'output' && (
                <div className="absolute inset-0">
                  <CodeOutput 
                    output={output}
                    executionTimestamp={executionTimestamp}
                    executionTime={executionTime}
                    language={room.language}
                  />
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

              {/* Footer with stats */}
              <EditorFooter
                activeTab={activeTab}
                cursorPosition={cursorPosition}
                wordCount={wordCount}
                language={room.language}
                lastSaved={lastSaved}
                executionTimestamp={executionTimestamp}
                executionTime={executionTime}
                review={review}
              />
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
      <CollaboratorsPanel 
        presence={presence || []} 
        activityLog={activityLog}
        onClearActivityLog={handleClearActivityLog}
      />
    </div>
  );
} 
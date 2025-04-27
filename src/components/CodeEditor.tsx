import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useTheme } from "../ThemeContext";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import { FiChevronLeft, FiCopy, FiX } from "react-icons/fi";
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
  const [isMobileView, setIsMobileView] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showMobileCollaborators, setShowMobileCollaborators] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const rooms = useQuery(api.rooms.list);
  const workspace = useQuery(
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
  
  // Set code when workspace changes
  useEffect(() => {
    if (workspace) {
      const newCode = workspace.content || workspace.code || "";
      setCode(newCode);
      setLocalCode(newCode);
      setLastSaved(new Date()); // Set initial save time
    }
  }, [workspace]);
  
  // Handle workspace leaving - this is crucial for cleaning up presence
  useEffect(() => {
    if (!selectedRoomId) return;

    // Function to handle workspace leaving
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
  
  // Redirect if workspace not found
  useEffect(() => {
    if (selectedRoomId && !isLoading && workspace === null) {
      toast.error("Workspace not found");
      void navigate('/workspace');
    }
  }, [selectedRoomId, workspace, isLoading, navigate]);
  
  // Debounced server update function with pending update tracking
  const debouncedUpdateCode = useMemo(
    () => 
      debounce((value: string) => {
        if (!selectedRoomId) return;
        void updateCode({ roomId: selectedRoomId, code: value });
        setLastSaved(new Date());
      }, 300), // 300ms debounce delay
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

  // Check for mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768); // Consider screens below 768px as mobile
    };
    
    // Check initially
    checkMobileView();
    
    // Add resize listener
    window.addEventListener('resize', checkMobileView);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);

  // Function to copy workspace link
  const copyWorkspaceLink = useCallback(() => {
    const url = window.location.origin + location.pathname;
    void navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      toast.success("Workspace link copied to clipboard");
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    });
  }, [location.pathname]);

  // Update presence tracking effect for better performance
  useEffect(() => {
    if (!selectedRoomId || !editorRef.current) return;
    
    // Presence update interval - reduced frequency for better performance
    const intervalId = setInterval(() => {
      if (!editorRef.current) return;
      
      const now = Date.now();
      const isActivelyTyping = now - lastTypingTime < 1000;
      
      // Skip presence updates during active typing
      if (!isActivelyTyping) {
        const position = editorRef.current.getPosition();
        const selection = editorRef.current.getSelection();
        
        if (position) {
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
      }
    }, 10000); // Reduced frequency to 10 seconds for better network performance
    
    // Minimal heartbeat ping
    const heartbeatId = setInterval(() => {
      const now = Date.now();
      const isUserActivelyTyping = now - lastTypingTime < 2000;
      
      if (editorRef.current && selectedRoomId) {
        if (isUserActivelyTyping) {
          // During active typing, don't update cursor position
          // This is crucial to prevent disappearing characters
          void updatePresence({
            roomId: selectedRoomId,
            // Dummy cursor position to satisfy API requirements
            cursor: { line: 1, column: 1 },
            isActive: true,
            isTyping: true
          });
        } else {
          const position = editorRef.current.getPosition();
          if (position) {
            void updatePresence({
              roomId: selectedRoomId,
              cursor: {
                line: position.lineNumber,
                column: position.column,
              },
              isActive: true,
              isTyping: false
            });
          }
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
  }, [selectedRoomId, updatePresence, typingTimeoutId, lastTypingTime]);
  
  // Store editor instance reference
  const editorRef = useRef<any>(null);

  // Improved editor change handler with optimized performance
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (!value || !selectedRoomId) return;
    
    // Immediately update local state to ensure UI is responsive
    setLocalCode(value);
    setCode(value);
    
    // Calculate word count
    const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
    setWordCount(wordCount);
    
    // Track typing time for presence updates
    setLastTypingTime(Date.now());
    
    // Use a standard debounced update instead of the complex version with potential bugs
    debouncedUpdateCode(value);
    
    // Optimize cursor presence during active typing
    if (editorRef.current) {
      const position = editorRef.current.getPosition();
      const selection = editorRef.current.getSelection();
      
      if (position && selectedRoomId) {
        // Clear any existing typing timeout
        if (typingTimeoutId) {
          clearTimeout(typingTimeoutId);
        }
        
        // Set active typing state with minimal updates
        // Skip sending cursor updates during active typing to prevent disappearing characters
        const now = Date.now();
        const shouldUpdatePresence = now - lastTypingTime > 300; // Only update presence periodically during typing
        
        if (shouldUpdatePresence) {
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
        }
        
        // Set a timeout to mark the end of typing
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
        }, 800); // Increased timeout for better fast typing handling
        
        setTypingTimeoutId(timeoutId);
      }
    }
  }, [selectedRoomId, updatePresence, debouncedUpdateCode, typingTimeoutId, lastTypingTime]);

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

  // Enhanced Editor options for better performance
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
    cursorBlinking: 'smooth' as 'smooth',
    cursorSmoothCaretAnimation: 'on' as 'on',
    smoothScrolling: true,
    scrollbar: {
      verticalScrollbarSize: 12,
      horizontalScrollbarSize: 12,
      vertical: 'visible' as 'visible',
      horizontal: 'visible' as 'visible',
      useShadows: true,
      verticalHasArrows: false,
      horizontalHasArrows: false,
      alwaysConsumeMouseWheel: false,
      scrollByPage: false
    },
    tabSize: 2,
    automaticLayout: true,
    wordBasedSuggestions: 'off' as 'off',
    quickSuggestions: false,
    occurrencesHighlight: 'off' as 'off',
    renderWhitespace: 'none' as 'none',
    renderControlCharacters: false
  }), []);

  const handleRunCode = useCallback(async () => {
    if (!code || !workspace) return;
    setIsRunningCode(true);
    setActiveTab('output');
    try {
      const result = await executeCode({ language: workspace.language, code });
      setOutput(result.run.output);
      setExecutionTimestamp(new Date());
      setExecutionTime(result.run.time);
    } catch (error) {
      setOutput("Error executing code");
      toast.error("Failed to execute code");
    } finally {
      setIsRunningCode(false);
    }
  }, [code, executeCode, workspace]);

  const handleAIAssist = useCallback(async () => {
    if (!code || !workspace) return;
    setIsGettingReview(true);
    setActiveTab('review');
    try {
      const response = await getAIAssistance({ code, language: workspace.language });
      // The response is already a JSON string from the backend
      setReview(JSON.parse(response));
    } catch (error) {
      toast.error("Failed to get AI assistance");
      setReview(null);
    } finally {
      setIsGettingReview(false);
    }
  }, [code, getAIAssistance, workspace]);
  
  const handleSelectRoom = useCallback((roomCode: string) => {
    if (roomCode) {
      void navigate(`/workspace/${roomCode}`);
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
    if (!selectedRoomId || !workspace || workspace.language === language) return;
    
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
  }, [selectedRoomId, workspace, updateLanguage]);

  // Non-promise wrapper
  const handleDetectedLanguage = useCallback((language: string) => {
    void handleLanguageChange(language);
  }, [handleLanguageChange]);

  const handleClearActivityLog = useCallback(() => {
    setActivityLog([]);
  }, []);

  const toggleMobileCollaborators = useCallback(() => {
    setShowMobileCollaborators(prev => !prev);
  }, []);

  const toggleSidebar = useCallback(() => {
    setShowSidebar(prev => !prev);
  }, []);

  const handleRunCodeWrapper = useCallback(() => {
    void handleRunCode();
  }, [handleRunCode]);

  const handleAIAssistWrapper = useCallback(() => {
    void handleAIAssist();
  }, [handleAIAssist]);

  if (isLoading && !workspace) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900 transition-colors">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-t-2 border-b-2 border-indigo-400 animate-spin-reverse" style={{ animationDuration: '1.5s' }}></div>
            <div className="absolute inset-6 rounded-full border-t-2 border-indigo-300 animate-spin" style={{ animationDuration: '2s' }}></div>
          </div>
          <p className="text-lg font-medium text-gray-800 dark:text-gray-200 transition-colors">Loading workspace...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">Please wait</p>
        </div>
      </div>
    );
  }

  // For mobile devices, show a message instead of the full workspace
  if (isMobileView) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900 text-center">
        <svg className="w-24 h-24 mx-auto mb-6 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Desktop Experience Required</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Our collaborative IDE is optimized for desktop devices. Please open this workspace on a larger screen for the best experience.
        </p>
        {workspace && (
          <div className="mb-6 max-w-xs mx-auto">
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400 mb-2 transition-colors">Workspace Code:</p>
            <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-indigo-200 dark:border-indigo-700 px-3 py-2 transition-colors">
              <p className="text-xl tracking-wider font-mono font-semibold text-indigo-600 dark:text-indigo-400 transition-colors break-all">
                {workspace.code}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={copyWorkspaceLink}
          className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 mx-auto"
        >
          <span>{isCopied ? "Copied!" : "Copy Workspace Link"}</span>
          <FiCopy className="w-5 h-5 ml-2" />
        </button>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline transition-colors"
        >
          Back to Main Menu
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-white dark:bg-gray-900 transition-colors">
      {/* Left Sidebar - Workspace List - Hidden below 1200px */}
      <div className="hidden 2xl:flex w-72 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col overflow-hidden transition-colors h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 transition-colors">
          <button
            onClick={handleBackWithCleanup}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <FiChevronLeft className="w-4 h-4" />
            <span className="font-medium">Back to Main Menu</span>
          </button>
        </div>
        
        {workspace && (
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/20 transition-colors">
            <div className="text-center">
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400 mb-1.5 transition-colors">Workspace Code</p>
              <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-indigo-200 dark:border-indigo-700 px-3 py-2 transition-colors">
                <p className="text-xl tracking-wider font-mono font-semibold text-indigo-600 dark:text-indigo-400 transition-colors break-all">
                  {workspace.code}
                </p>
              </div>
              <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-2 transition-colors">Share this code with collaborators</p>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 transition-colors">Your Past Workspaces</h3>
            <div className="space-y-2">
              {rooms?.map((workspace) => (
                <button
                  key={workspace._id}
                  onClick={() => void handleSelectRoom(workspace.code)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedRoomId === workspace._id
                      ? "bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-700"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <span className={`block font-medium truncate ${
                    selectedRoomId === workspace._id ? "text-indigo-700 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300"
                  } transition-colors`}>
                    {workspace.name}
                  </span>
                  <span className={`block text-xs mt-0.5 ${
                    selectedRoomId === workspace._id ? "text-indigo-500 dark:text-indigo-300" : "text-gray-500 dark:text-gray-400"
                  } transition-colors`}>
                    {workspace.language}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating sidebar for medium screens (md) when toggled */}
      {showSidebar && (
        <div className="fixed inset-0 z-40 2xl:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30 dark:bg-black/50" 
            onClick={toggleSidebar}
          ></div>
          
          {/* Sidebar */}
          <div className="absolute top-0 left-0 bottom-0 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 transition-colors flex justify-between items-center">
              <button
                onClick={handleBackWithCleanup}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <FiChevronLeft className="w-4 h-4" />
                <span className="font-medium">Back to Main Menu</span>
              </button>
              <button
                onClick={toggleSidebar}
                className="ml-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            {workspace && (
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/20 transition-colors">
                <div className="text-center">
                  <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400 mb-1.5 transition-colors">Workspace Code</p>
                  <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-indigo-200 dark:border-indigo-700 px-3 py-2 transition-colors">
                    <p className="text-xl tracking-wider font-mono font-semibold text-indigo-600 dark:text-indigo-400 transition-colors break-all">
                      {workspace.code}
                    </p>
                  </div>
                  <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-2 transition-colors">Share this code with collaborators</p>
                </div>
              </div>
            )}
            
            <div className="flex-1 overflow-auto">
              <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 transition-colors">Your Past Workspaces</h3>
                <div className="space-y-2">
                  {rooms?.map((workspace) => (
                    <button
                      key={workspace._id}
                      onClick={() => {
                        void handleSelectRoom(workspace.code);
                        toggleSidebar();
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedRoomId === workspace._id
                          ? "bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-700"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <span className={`block font-medium truncate ${
                        selectedRoomId === workspace._id ? "text-indigo-700 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300"
                      } transition-colors`}>
                        {workspace.name}
                      </span>
                      <span className={`block text-xs mt-0.5 ${
                        selectedRoomId === workspace._id ? "text-indigo-500 dark:text-indigo-300" : "text-gray-500 dark:text-gray-400"
                      } transition-colors`}>
                        {workspace.language}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {selectedRoomId && workspace ? (
          <>
            {/* Header with toolbar */}
            <EditorToolbar 
              workspace={workspace}
              activeTab={activeTab}
              isRunningCode={isRunningCode}
              isGettingReview={isGettingReview}
              output={output}
              review={review}
              onRunCode={handleRunCodeWrapper}
              onAIAssist={handleAIAssistWrapper}
              onTabChange={setActiveTab}
              onCopyCode={handleCopyCode}
              onClearCode={handleClearCode}
              onUploadCode={handleUploadCode}
              onLanguageDetected={handleDetectedLanguage}
              isUpdatingLanguage={isUpdatingLanguage}
              presence={presence}
              onToggleCollaborators={toggleMobileCollaborators}
              onToggleSidebar={toggleSidebar}
            />

            {/* Mobile Collaborators Drawer - Only visible when toggled */}
            {showMobileCollaborators && (
              <div className="2xl:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
                <div className="absolute right-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-xl">
                  <CollaboratorsPanel 
                    presence={presence || []} 
                    activityLog={activityLog}
                    onClearActivityLog={handleClearActivityLog}
                    onClose={toggleMobileCollaborators}
                    isDrawer={true}
                  />
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 relative overflow-hidden">
              {activeTab === 'editor' && (
                <div className="absolute inset-0">
                  <Editor
                    height="100%"
                    defaultLanguage={workspace.language || "javascript"}
                    language={workspace.language || "javascript"}
                    value={localCode}
                    onChange={handleEditorChange}
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    options={editorOptions}
                    onMount={(editor, monaco) => {
                      // Store editor reference
                      editorRef.current = editor;
                      
                      // Configure for better performance
                      monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'light');
                      
                      // Optimize editor for performance
                      editor.updateOptions({
                        renderValidationDecorations: 'off' as 'off',
                        lightbulb: { enabled: 'off' },
                        formatOnType: false,
                        formatOnPaste: false,
                        selectionHighlight: false,
                        matchBrackets: 'never' as 'never',
                        contextmenu: false,
                      });
                      
                      // Throttled cursor position handler
                      let lastCursorUpdateTime = 0;
                      editor.onDidChangeCursorPosition((e) => {
                        const now = Date.now();
                        
                        // Limit cursor updates to prevent UI lag
                        if (now - lastCursorUpdateTime > 100) {
                          lastCursorUpdateTime = now;
                          
                          const position = editor.getPosition();
                          const selection = editor.getSelection();
                          
                          if (position) {
                            setCursorPosition({
                              line: position.lineNumber,
                              column: position.column
                            });
                            
                            // Only update cursor presence if not actively typing
                            if (now - lastTypingTime > 500) {
                              debouncedUpdatePresence(position, selection, true);
                            }
                          }
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
                  />
                </div>
              )}

              {activeTab === 'output' && (
                <div className="absolute inset-0">
                  <CodeOutput 
                    output={output}
                    executionTimestamp={executionTimestamp}
                    executionTime={executionTime}
                    language={workspace.language}
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
                    <p className="text-lg font-medium text-gray-900 dark:text-white transition-colors">Loading workspace...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">Please wait</p>
                  </div>
                </div>
              )}

              {/* Footer with stats */}
              <EditorFooter
                activeTab={activeTab}
                cursorPosition={cursorPosition}
                wordCount={wordCount}
                language={workspace.language}
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
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors">Select a Workspace</h3>
              <p className="text-gray-600 dark:text-gray-400 transition-colors">
                Choose a workspace from the sidebar to start coding or create a new one from the main menu
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Collaborators - Hidden on smaller screens, visible on 2xl and above */}
      <div className="hidden 2xl:block w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <CollaboratorsPanel 
          presence={presence || []} 
          activityLog={activityLog}
          onClearActivityLog={handleClearActivityLog}
        />
      </div>
    </div>
  );
} 
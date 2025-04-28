import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useTheme } from "../ThemeContext";
import { toast } from "sonner";
import { OnMount } from "@monaco-editor/react";
import { FiChevronLeft, FiCopy, FiX } from "react-icons/fi";
import FileUploadButton from "../FileUploadButton";
import AIReviewPanel from "../AIReviewPanel";
import CollaboratorsPanel from "./collaboration/CollaboratorsPanel";
import EditorToolbar from "./editor/EditorToolbar";
import CodeOutput from "./editor/CodeOutput";
import EditorFooter from "./editor/EditorFooter";
import EditorSetup from "./editor/components/EditorSetup";
import MobileView from "./editor/components/MobileView";
import { useEditorPresence } from "../hooks/useEditorPresence";
import { useCodeCompletion } from "../hooks/useCodeCompletion";
import { useCodeSync } from "../hooks/useCodeSync";
import { useEditorActions } from "../hooks/useEditorActions";
import { useEditorCollaboration } from "../hooks/useEditorCollaboration";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { highlightSearchMatches } from "./editor/utils/highlightUtils";

interface CodeEditorProps {
  initialRoomId: Id<"rooms"> | null;
  onBack: () => void;
}

export default function CodeEditor({ initialRoomId, onBack }: CodeEditorProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<Id<"rooms"> | null>(initialRoomId);
  const [code, setCode] = useState("");
  const [localCode, setLocalCode] = useState("");
  const [activeTab, setActiveTab] = useState<'editor' | 'output' | 'review'>('editor');
  const [wordCount, setWordCount] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);
  const [lastTypingTime, setLastTypingTime] = useState<number>(0);
  const [typingTimeoutId, setTypingTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  // Fetch data
  const rooms = useQuery(api.rooms.list);
  const workspace = useQuery(
    api.rooms.get,
    selectedRoomId ? { roomId: selectedRoomId } : "skip"
  );
  
  // Utility hooks
  const { lastSaved, debouncedUpdateCode, handleLeaveRoom } = useCodeSync(selectedRoomId);
  
  const { 
    output, review, isRunningCode, isGettingReview,
    executionTimestamp, executionTime, 
    handleRunCode, handleAIAssist 
  } = useEditorActions({
    code,
    language: workspace?.language || "javascript",
    setActiveTab
  });
  
  const {
    presence, activityLog, showMobileCollaborators,
    handleClearActivityLog, toggleMobileCollaborators
  } = useEditorCollaboration(selectedRoomId);
  
  const {
    isMobileView, isCopied, showSidebar,
    copyWorkspaceLink, toggleSidebar
  } = useResponsiveLayout();
  
  const {
    editorRef: presenceEditorRef,
    debouncedUpdatePresence,
    setupSelectionTracking,
    setupCursorTracking,
    updateTypingStatus
  } = useEditorPresence({
    roomId: selectedRoomId,
    lastTypingTime,
    typingTimeoutId,
    setTypingTimeoutId
  });
  
  const {
    editorRef: completionEditorRef,
    monacoRef,
    isCompletionLoading,
    triggerCodeCompletion,
    setupAutoCompletionTrigger
  } = useCodeCompletion({
    typingTimeoutId,
    setTypingTimeoutId
  });
  
  // Combined editor ref for the utility hooks
  const combineRefs = (editor: any, monaco: any) => {
    presenceEditorRef.current = editor;
    completionEditorRef.current = editor;
    monacoRef.current = monaco;
  };
  
  // Additional mutations
  const updateLanguage = useMutation(api.rooms.updateLanguage);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  
  // Set code when workspace changes
  useEffect(() => {
    if (workspace) {
      const newCode = workspace.content || workspace.code || "";
      setCode(newCode);
      setLocalCode(newCode);
    }
  }, [workspace]);
  
  // Handle workspace leaving - this is crucial for cleaning up presence
  useEffect(() => {
    if (!selectedRoomId) return;

    // Function to handle workspace leaving
    const handleLeaveWorkspace = () => {
      if (selectedRoomId) {
        void leaveRoom({ roomId: selectedRoomId });
      }
    };

    // Set up event listener for page unload
    window.addEventListener('beforeunload', handleLeaveWorkspace);

    // Clean up function
    return () => {
      window.removeEventListener('beforeunload', handleLeaveWorkspace);
      // Also call handleLeaveWorkspace when the component unmounts
      handleLeaveWorkspace();
    };
  }, [selectedRoomId, leaveRoom]);
  
  // Handle back button click with proper cleanup
  const handleBackWithCleanup = useCallback(() => {
    if (selectedRoomId) {
      void handleLeaveRoom().then(() => {
        onBack(); // Only navigate back after cleanup
      });
    } else {
      onBack();
    }
  }, [selectedRoomId, handleLeaveRoom, onBack]);
  
  // Redirect if workspace not found
  useEffect(() => {
    if (selectedRoomId && !isLoading && workspace === null) {
      toast.error("Workspace not found");
      void navigate('/workspace');
    }
  }, [selectedRoomId, workspace, isLoading, navigate]);

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

  const handleRunCodeWrapper = useCallback(() => {
    void handleRunCode();
  }, [handleRunCode]);

  const handleAIAssistWrapper = useCallback(() => {
    void handleAIAssist();
  }, [handleAIAssist]);

  const triggerCodeCompletionWrapper = useCallback(() => {
    void triggerCodeCompletion();
  }, [triggerCodeCompletion]);
  
  // Setup editor keyboard shortcuts and event handlers
  const handleEditorMount: OnMount = (editor, monaco) => {
    // Set up combined refs
    combineRefs(editor, monaco);
    
    // Configure theme
    monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'light');
    
    // Set initial cursor position
    const position = editor.getPosition();
    if (position) {
      setCursorPosition({
        line: position.lineNumber,
        column: position.column
      });
    }
    
    // Set up auto-completion
    const completionDisposable = setupAutoCompletionTrigger(editor);
    
    // Set up selection tracking
    const selectionDisposable = setupSelectionTracking(editor);
    
    // Set up cursor tracking
    const cursorDisposable = setupCursorTracking(editor);
    
    // Add model content change handler for word count
    editor.onDidChangeModelContent(() => {
      // Calculate word count
      const text = editor.getValue();
      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(wordCount);
    });
    
    // Register keyboard shortcut for manual code completion (Ctrl+Space)
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space,
      () => void triggerCodeCompletion()
    );
    
    // Clean up function
    return () => {
      completionDisposable.dispose();
      selectionDisposable();
      cursorDisposable();
    };
  };

  // Improved editor change handler with optimized performance
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (!value || !selectedRoomId) return;
    
    // Always update local state immediately for responsive UI
    setLocalCode(value);
    setCode(value);
    
    // Calculate word count
    const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
    setWordCount(wordCount);
    
    // Record the typing time
    const now = Date.now();
    setLastTypingTime(now);
    
    // IMPORTANT: During active typing, just track the position without sending full updates
    // This prevents cursor jumps while typing
    if (presenceEditorRef.current && selectedRoomId) {
      const position = presenceEditorRef.current.getPosition();
      if (position) {
        // Only update typing status, position gets tracked separately
        updateTypingStatus(position);
      }
    }
    
    // Debounce server updates to avoid overwhelming the network
    debouncedUpdateCode(value);
    
    // Clear any existing typing timeout
    if (typingTimeoutId) {
      clearTimeout(typingTimeoutId);
    }
    
    // Set a timeout to indicate when typing has stopped
    const timeoutId = setTimeout(() => {
      if (presenceEditorRef.current && selectedRoomId) {
        // CRITICAL: Must get position AFTER typing has stopped
        // This ensures we have the correct final cursor position
        const currentPosition = presenceEditorRef.current.getPosition();
        const currentSelection = presenceEditorRef.current.getSelection();
        
        if (currentPosition) {
          // Send cursor position after typing has stopped, with a longer delay
          // to ensure the editor has settled
          setTimeout(() => {
            // Double-check that we still have a valid editor reference
            if (presenceEditorRef.current) {
              const finalPosition = presenceEditorRef.current.getPosition();
              const finalSelection = presenceEditorRef.current.getSelection();
              if (finalPosition) {
                debouncedUpdatePresence(finalPosition, finalSelection, true);
              }
            }
          }, 100);
        }
      }
    }, 1500); // Increased significantly for better handling of rapid typing
    
    setTypingTimeoutId(timeoutId);
  }, [selectedRoomId, debouncedUpdateCode, typingTimeoutId, updateTypingStatus, debouncedUpdatePresence]);

  // Example of search highlight feature usage
  const handleSearchHighlight = useCallback((searchTerm: string) => {
    if (!completionEditorRef.current) return;
    return highlightSearchMatches(completionEditorRef.current, searchTerm);
  }, []);

  const copyWorkspaceCode = useCallback((code: string) => {
    void navigator.clipboard.writeText(code).then(() => {
      toast.success('Workspace code copied to clipboard');
    });
  }, []);

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
      <MobileView 
        workspaceCode={workspace?.code}
        isCopied={isCopied}
        onCopyLink={copyWorkspaceLink}
        onBack={onBack}
      />
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
              <button
                onClick={() => copyWorkspaceCode(workspace.code)}
                className="bg-white dark:bg-gray-800 rounded-lg border-2 border-indigo-200 dark:border-indigo-700 px-3 py-2 transition-colors w-full flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-indigo-400"
                title="Click to copy code"
                type="button"
              >
                <span className="text-xl tracking-wider font-mono font-semibold text-indigo-600 dark:text-indigo-400 transition-colors break-all select-all">
                  {workspace.code}
                </span>
                <FiCopy className={`ml-2 w-5 h-5 transition-opacity ${isCopied ? 'opacity-100 text-green-500' : 'opacity-60 group-hover:opacity-100 text-indigo-400'}`} />
                {isCopied && <span className="ml-2 text-xs text-green-500 font-medium">Copied!</span>}
              </button>
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

        {/* Keyboard shortcuts guide - Very visible at bottom */}
        <div className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/30 p-3">
          <div className="rounded-lg bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800/50 p-2 shadow-sm">
            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 mb-1.5">AI Code Completion</p>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 dark:text-gray-400">Trigger:</span>
                <div className="flex items-center space-x-1">
                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs font-medium rounded border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">CTRL</span>
                  <span className="text-gray-500 dark:text-gray-500">·</span>
                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs font-medium rounded border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">SPACE</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 dark:text-gray-400">Accept:</span>
                <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-xs font-medium rounded border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300">TAB</span>
              </div>
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
          
          {/* Sidebar content */}
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
                  <button
                    onClick={() => copyWorkspaceCode(workspace.code)}
                    className="bg-white dark:bg-gray-800 rounded-lg border-2 border-indigo-200 dark:border-indigo-700 px-3 py-2 transition-colors w-full flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    title="Click to copy code"
                    type="button"
                  >
                    <span className="text-xl tracking-wider font-mono font-semibold text-indigo-600 dark:text-indigo-400 transition-colors break-all select-all">
                      {workspace.code}
                    </span>
                    <FiCopy className={`ml-2 w-5 h-5 transition-opacity ${isCopied ? 'opacity-100 text-green-500' : 'opacity-60 group-hover:opacity-100 text-indigo-400'}`} />
                    {isCopied && <span className="ml-2 text-xs text-green-500 font-medium">Copied!</span>}
                  </button>
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

            {/* Keyboard shortcuts guide for floating sidebar */}
            <div className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/30 p-3">
              <div className="rounded-lg bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800/50 p-2 shadow-sm">
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 mb-1.5">AI Code Completion</p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">Trigger:</span>
                    <div className="flex items-center space-x-1">
                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs font-medium rounded border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">CTRL</span>
                      <span className="text-gray-500 dark:text-gray-500">·</span>
                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs font-medium rounded border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">SPACE</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">Accept:</span>
                    <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-xs font-medium rounded border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300">TAB</span>
                  </div>
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
              isCompletionLoading={isCompletionLoading}
              onRequestCompletion={triggerCodeCompletionWrapper}
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
                  <EditorSetup
                    code={localCode}
                    language={workspace.language || "javascript"}
                    theme={theme}
                    onEditorChange={handleEditorChange}
                    onMount={handleEditorMount}
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
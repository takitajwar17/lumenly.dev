import React, { useState } from "react";
import { Doc } from "../../../convex/_generated/dataModel";
import { FiPlay, FiCopy, FiTrash2, FiCode, FiCpu, FiUsers } from "react-icons/fi";
import { detectLanguage } from "../../utils/languageDetection";
import { supportedLanguages } from "../../utils/supportedLanguages";
import FileUploadButton from "../../FileUploadButton";
import ConfirmModal from "../../ConfirmModal";
import { useTheme } from "../../ThemeContext";

// Define a proper type for user presence
interface UserPresence {
  _id: string;
  name: string;
  color?: string;
  isCurrentUser?: boolean;
  isAnonymous?: boolean;
  nickname?: string;
}

interface EditorToolbarProps {
  room: Doc<"rooms">;
  activeTab: string;
  isRunningCode: boolean;
  isGettingReview: boolean;
  output: string | null;
  review: Record<string, any> | null;
  onRunCode: () => void;
  onAIAssist: () => void;
  onTabChange: (tab: "editor" | "output" | "review") => void;
  onCopyCode: () => void;
  onClearCode: () => void;
  onUploadCode: (code: string) => void;
  onLanguageDetected: (language: string) => void;
  isUpdatingLanguage: boolean;
  presence?: UserPresence[];
}

export default function EditorToolbar({
  room,
  activeTab,
  isRunningCode,
  isGettingReview,
  output,
  review,
  onRunCode,
  onAIAssist,
  onTabChange,
  onCopyCode,
  onClearCode,
  onUploadCode,
  onLanguageDetected,
  isUpdatingLanguage,
  presence
}: EditorToolbarProps) {
  const [isConfirmClearModalOpen, setIsConfirmClearModalOpen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleClearButtonClick = () => {
    setIsConfirmClearModalOpen(true);
  };

  const handleConfirmClear = () => {
    onClearCode();
    setIsConfirmClearModalOpen(false);
  };

  const handleCancelClear = () => {
    setIsConfirmClearModalOpen(false);
  };

  return (
    <div className={`flex-none border-b ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
      {/* Top bar with file info and actions */}
      <div className={`flex items-center justify-between px-6 py-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="flex items-center space-x-6">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{room.name}</h2>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Language:</span>
            <div className="flex items-center">
              <span className={`text-sm font-medium px-2 py-1 rounded-md ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                {room.language}
              </span>
              {isUpdatingLanguage && (
                <div className="ml-2 w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
              )}
            </div>
          </div>
          {presence && presence.length > 0 && (
            <div className={`flex items-center space-x-2 pl-4 border-l ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
              <FiUsers className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              <div className="flex -space-x-2">
                {presence.slice(0, 3).map((user) => (
                  <div 
                    key={user._id}
                    className={`w-6 h-6 rounded-full border-2 ${isDark ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-center`}
                    style={{ 
                      backgroundColor: user.color || '#6366F1',
                      zIndex: user.isCurrentUser ? 10 : 5
                    }}
                    title={user.isAnonymous && user.nickname
                      ? user.nickname
                      : (user.name.includes('@') 
                        ? user.name.split('@')[0]
                        : user.name)
                    }
                  >
                    <span className="text-[10px] font-bold text-white">
                      {user.isAnonymous && user.nickname
                        ? user.nickname.substring(0, 1)
                        : user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                ))}
                {presence.length > 3 && (
                  <div className={`w-6 h-6 rounded-full border-2 ${isDark ? 'border-gray-800 bg-gray-700' : 'border-gray-100 bg-gray-300'} flex items-center justify-center z-20`}>
                    <span className={`text-[10px] font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>+{presence.length - 3}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <FileUploadButton 
            onFileContent={onUploadCode}
            onLanguageDetected={onLanguageDetected}
            className={`p-2 ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'} rounded-lg`}
          />
          
          <button
            onClick={onCopyCode}
            className={`p-2 ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'} rounded-lg`}
            title="Copy code"
          >
            <FiCopy className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleClearButtonClick}
            className={`p-2 ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'} rounded-lg`}
            title="Clear code"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Action toolbar */}
      <div className={`flex items-center justify-between px-6 py-2 ${isDark ? 'bg-gray-800/50 border-t border-gray-700/50' : 'bg-gray-100/80 border-t border-gray-300/50'}`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={onRunCode}
            disabled={isRunningCode}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
              isRunningCode
                ? isDark ? 'bg-blue-900/20 text-blue-300 cursor-not-allowed' : 'bg-blue-100 text-blue-400 cursor-not-allowed'
                : isDark ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
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
                <FiPlay className="w-4 h-4 mr-2" />
                <span>Run Code</span>
              </>
            )}
          </button>

          <button
            onClick={onAIAssist}
            disabled={isGettingReview}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
              isGettingReview
                ? isDark ? 'bg-purple-900/20 text-purple-300 cursor-not-allowed' : 'bg-purple-100 text-purple-400 cursor-not-allowed'
                : isDark ? 'bg-purple-500 text-white hover:bg-purple-600 active:bg-purple-700' : 'bg-purple-500 text-white hover:bg-purple-600 active:bg-purple-700'
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
                <FiCpu className="w-4 h-4 mr-2" />
                <span>AI Review</span>
              </>
            )}
          </button>
        </div>

        <div className={`flex items-center ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-300'} rounded-lg shadow-sm border`}>
          <button
            onClick={() => onTabChange("editor")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm ${
              activeTab === "editor"
                ? isDark ? 'bg-indigo-900/30 text-indigo-300 font-medium' : 'bg-indigo-100 text-indigo-700 font-medium'
                : isDark ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-600' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'
            }`}
          >
            <FiCode className="w-4 h-4" />
            <span>Editor</span>
          </button>

          <button
            onClick={() => onTabChange("output")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === "output"
                ? isDark ? 'bg-indigo-900/30 text-indigo-300 font-medium' : 'bg-indigo-100 text-indigo-700 font-medium'
                : isDark ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-600' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'
            } relative`}
          >
            <FiPlay className="w-4 h-4" />
            <span>Output</span>
            {output && activeTab !== 'output' && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => onTabChange("review")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === "review"
                ? isDark ? 'bg-indigo-900/30 text-indigo-300 font-medium' : 'bg-indigo-100 text-indigo-700 font-medium'
                : isDark ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-600' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'
            } relative`}
          >
            <FiCpu className="w-4 h-4" />
            <span>Review</span>
            {review && activeTab !== 'review' && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Clear code confirmation modal */}
      <ConfirmModal
        isOpen={isConfirmClearModalOpen}
        title="Clear Code"
        message={
          <div className="space-y-3">
            <div className="flex items-center mb-4">
              <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-red-900/30' : 'bg-red-100'} flex items-center justify-center mr-3`}>
                <FiTrash2 className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              <div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Are you sure you want to clear all code?</p>
              </div>
            </div>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>This action cannot be undone. All code in the editor will be permanently removed.</p>
          </div>
        }
        confirmText="Yes, Clear All Code"
        cancelText="Cancel"
        onConfirm={handleConfirmClear}
        onCancel={handleCancelClear}
      />
    </div>
  );
} 
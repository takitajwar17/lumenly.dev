import React from 'react';
import { useTheme } from "../../ThemeContext";

interface EditorFooterProps {
  activeTab: 'editor' | 'output' | 'review';
  cursorPosition?: { line: number; column: number };
  wordCount?: number;
  language: string;
  lastSaved?: Date | null;
  executionTimestamp?: Date | null;
  executionTime?: number | null;
  review?: any;
}

export default function EditorFooter({
  activeTab,
  cursorPosition,
  wordCount,
  language,
  lastSaved,
  executionTimestamp,
  executionTime,
  review
}: EditorFooterProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`absolute bottom-0 left-0 right-0 flex items-center justify-between h-6 px-2 sm:px-4 ${isDark ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-200 text-gray-600 border-gray-300'} text-xs border-t overflow-x-auto`}>
      <div className={`flex items-center ${isDark ? 'divide-gray-700' : 'divide-gray-300'} divide-x`}>
        {activeTab === 'editor' && (
          <>
            <div className="pr-2 sm:pr-4 whitespace-nowrap">
              Ln {cursorPosition?.line || 1}, Col {cursorPosition?.column || 1}
            </div>
            <div className="px-2 sm:px-4 whitespace-nowrap">{wordCount || 0} words</div>
            <div className={`px-2 sm:px-4 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} whitespace-nowrap`}>{language}</div>
            {lastSaved && (
              <div className="hidden sm:block pl-2 sm:pl-4 whitespace-nowrap">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </>
        )}
        
        {activeTab === 'output' && executionTimestamp && (
          <>
            <div className="pr-2 sm:pr-4 whitespace-nowrap">{language}</div>
            <div className="px-2 sm:px-4 whitespace-nowrap">
              Executed: {executionTimestamp.toLocaleTimeString()}
            </div>
            {executionTime && (
              <div className="pl-2 sm:pl-4 whitespace-nowrap">
                Duration: {executionTime}ms
              </div>
            )}
          </>
        )}
        
        {activeTab === 'review' && review && (
          <>
            <div className="pr-2 sm:pr-4 whitespace-nowrap">
              Issues: {review.issues.length}
            </div>
            <div className="hidden xs:block px-2 sm:px-4 whitespace-nowrap">
              Suggestions: {review.suggestions.length}
            </div>
            <div className="hidden sm:block px-2 sm:px-4 whitespace-nowrap">
              Improvements: {review.improvements.length}
            </div>
            {review.issues.length > 0 && (
              <div className="hidden md:flex pl-2 sm:pl-4 items-center gap-2 whitespace-nowrap">
                <span>Severity:</span>
                {review.issues.some((i: any) => i.severity === 'high') && (
                  <span className={`px-1.5 py-0.5 ${isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'} rounded text-[10px] font-medium`}>
                    High
                  </span>
                )}
                {review.issues.some((i: any) => i.severity === 'medium') && (
                  <span className={`px-1.5 py-0.5 ${isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700'} rounded text-[10px] font-medium`}>
                    Medium
                  </span>
                )}
                {review.issues.some((i: any) => i.severity === 'low') && (
                  <span className={`px-1.5 py-0.5 ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'} rounded text-[10px] font-medium`}>
                    Low
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-4 ml-2 sm:ml-0 shrink-0">
        {activeTab === 'review' && review?._metadata ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
          <div className="whitespace-nowrap">{new Date().toLocaleTimeString()}</div>
        )}
      </div>
    </div>
  );
} 
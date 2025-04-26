import React from 'react';

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
  return (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between h-6 px-4 bg-gray-800 text-xs text-gray-400 border-t border-gray-700">
      <div className="flex items-center divide-x divide-gray-700">
        {activeTab === 'editor' && (
          <>
            <div className="pr-4 text-gray-400">
              Ln {cursorPosition?.line || 1}, Col {cursorPosition?.column || 1}
            </div>
            <div className="px-4 text-gray-400">{wordCount || 0} words</div>
            <div className="px-4 font-medium text-gray-300">{language}</div>
            {lastSaved && (
              <div className="pl-4 text-gray-400">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </>
        )}
        
        {activeTab === 'output' && executionTimestamp && (
          <>
            <div className="pr-4 text-gray-400">{language}</div>
            <div className="px-4 text-gray-400">
              Executed: {executionTimestamp.toLocaleTimeString()}
            </div>
            {executionTime && (
              <div className="pl-4 text-gray-400">
                Duration: {executionTime}ms
              </div>
            )}
          </>
        )}
        
        {activeTab === 'review' && review && (
          <>
            <div className="pr-4 text-gray-400">
              Issues: {review.issues.length}
            </div>
            <div className="px-4 text-gray-400">
              Suggestions: {review.suggestions.length}
            </div>
            <div className="px-4 text-gray-400">
              Improvements: {review.improvements.length}
            </div>
            {review.issues.length > 0 && (
              <div className="pl-4 flex items-center gap-2">
                <span className="text-gray-400">Severity:</span>
                {review.issues.some((i: any) => i.severity === 'high') && (
                  <span className="px-1.5 py-0.5 bg-red-900/30 text-red-300 rounded text-[10px] font-medium">
                    High
                  </span>
                )}
                {review.issues.some((i: any) => i.severity === 'medium') && (
                  <span className="px-1.5 py-0.5 bg-yellow-900/30 text-yellow-300 rounded text-[10px] font-medium">
                    Medium
                  </span>
                )}
                {review.issues.some((i: any) => i.severity === 'low') && (
                  <span className="px-1.5 py-0.5 bg-blue-900/30 text-blue-300 rounded text-[10px] font-medium">
                    Low
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="flex items-center space-x-4 text-gray-400">
        {activeTab === 'review' && review?._metadata ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
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
          <div>{new Date().toLocaleTimeString()}</div>
        )}
      </div>
    </div>
  );
} 
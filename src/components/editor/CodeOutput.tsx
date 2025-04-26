import React from 'react';
import { FiPlay } from 'react-icons/fi';
import { useTheme } from '../../ThemeContext';

interface CodeOutputProps {
  output: string;
  executionTimestamp: Date | null;
  executionTime: number | null;
  language: string;
}

export default function CodeOutput({ 
  output, 
  executionTimestamp, 
  executionTime, 
  language 
}: CodeOutputProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="h-full flex flex-col">
      <div className={`flex-1 overflow-auto font-mono text-sm ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
        {output ? (
          <div className="p-6">
            <pre className={`whitespace-pre-wrap break-words ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              {output}
            </pre>
          </div>
        ) : (
          <div className={`h-full flex items-center justify-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="text-center">
              <FiPlay className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className="text-lg font-medium">No Output Yet</p>
              <p className="text-sm mt-1">Run your code to see the output here</p>
            </div>
          </div>
        )}
      </div>
      {executionTimestamp && (
        <div className={`flex items-center justify-between px-6 py-3 ${isDark ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-200 text-gray-600 border-gray-300'} text-xs border-t`}>
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
            <span>{language}</span>
          </div>
        </div>
      )}
    </div>
  );
} 
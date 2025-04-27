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
    </div>
  );
} 
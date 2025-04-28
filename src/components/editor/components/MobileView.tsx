import React from "react";
import { FiCopy } from "react-icons/fi";

interface MobileViewProps {
  workspaceCode?: string;
  isCopied: boolean;
  onCopyLink: () => void;
  onBack: () => void;
}

/**
 * Mobile view alternative for the code editor - displays on small screens
 */
const MobileView: React.FC<MobileViewProps> = ({
  workspaceCode,
  isCopied,
  onCopyLink,
  onBack
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900 text-center">
      <svg className="w-24 h-24 mx-auto mb-6 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Desktop Experience Required</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        Our collaborative IDE is optimized for desktop devices. Please open this workspace on a larger screen for the best experience.
      </p>
      {workspaceCode && (
        <div className="mb-6 max-w-xs mx-auto">
          <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400 mb-2 transition-colors">Workspace Code:</p>
          <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-indigo-200 dark:border-indigo-700 px-3 py-2 transition-colors">
            <p className="text-xl tracking-wider font-mono font-semibold text-indigo-600 dark:text-indigo-400 transition-colors break-all">
              {workspaceCode}
            </p>
          </div>
        </div>
      )}
      <button
        onClick={onCopyLink}
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
};

export default MobileView; 
import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { FiMoon, FiSun } from "react-icons/fi";
import { SignOutButton } from "../SignOutButton";

interface HeaderProps {
  scrolled: boolean;
  mounted: boolean;
}

const Header: React.FC<HeaderProps> = ({ scrolled, mounted }) => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className={`sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg p-4 flex justify-between items-center border-b border-gray-200/30 dark:border-gray-800/30 transition-all duration-300 ${scrolled ? 'shadow-sm' : ''}`}>
      <div className="flex items-center overflow-visible px-1">
        <Link to="/" className="no-underline">
          <h2 className={`relative text-2xl group ${mounted ? 'opacity-100' : 'opacity-0'} transition-opacity duration-700`}>
            {/* Main logo text */}
            <span className="relative inline-flex items-baseline bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300 bg-clip-text text-transparent font-extrabold tracking-tight pr-0.5">
              <span>lumenly</span>
            </span>
            
            {/* Domain text */}
            <span className="relative text-gray-500/80 dark:text-gray-400/80 font-light tracking-tight ml-0.5 text-shadow-sm italic pr-1">.dev</span>
            
            {/* Animated underline effect */}
            <span className="absolute w-[calc(100%+4px)] h-0.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300 opacity-90 rounded-full bottom-0 left-0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out origin-left logo-shimmer"></span>
            
            {/* 3D depth shadow for text */}
            <span className="absolute inset-0 right-auto w-auto pr-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300 bg-clip-text text-transparent font-extrabold tracking-tight blur-[2px] opacity-30 -z-10 translate-y-[2px] translate-x-[1px] scale-y-[1.01] scale-x-[1.005]">lumenly</span>
          </h2>
        </Link>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow backdrop-blur-sm flex items-center gap-2 border border-gray-200/30 dark:border-gray-700/30"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <>
              <FiSun className="w-4 h-4" />
              <span className="text-sm font-medium">Light</span>
            </>
          ) : (
            <>
              <FiMoon className="w-4 h-4" />
              <span className="text-sm font-medium">Dark</span>
            </>
          )}
        </button>
        <SignOutButton />
      </div>
    </header>
  );
};

export default Header; 
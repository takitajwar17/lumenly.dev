import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { FiMoon, FiSun, FiLogOut, FiUser, FiChevronDown } from "react-icons/fi";
import { SignOutButton } from "../SignOutButton";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

interface HeaderProps {
  scrolled: boolean;
  mounted: boolean;
}

const Header: React.FC<HeaderProps> = ({ scrolled, mounted }) => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  
  const handleSignOut = () => {
    void signOut();
    setUserMenuOpen(false);
  };
  
  return (
    <header 
      className={`sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg py-3 px-5 flex justify-between items-center transition-all duration-300 ${
        scrolled 
          ? 'shadow-md border-b border-gray-200/30 dark:border-gray-800/30' 
          : 'border-b border-transparent'
      }`}
    >
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
      
      <div className="flex items-center gap-3">
        {/* Theme toggle button */}
        <button 
          onClick={toggleTheme}
          className="relative p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/80 transition-all shadow-sm hover:shadow-md hover:scale-105 flex items-center justify-center border border-gray-200/50 dark:border-gray-700/50 w-9 h-9 overflow-hidden group"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/10 to-yellow-300/10 dark:from-indigo-400/5 dark:to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          {theme === 'dark' ? (
            <FiSun className="w-5 h-5 hover-float" />
          ) : (
            <FiMoon className="w-5 h-5 hover-float" />
          )}
        </button>
        
        {/* User profile and sign out */}
        {isAuthenticated && (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 py-1.5 pl-2.5 pr-3 rounded-full bg-gradient-to-r from-indigo-500/5 to-purple-500/5 hover:from-indigo-500/10 hover:to-purple-500/10 dark:from-indigo-500/10 dark:to-purple-500/10 dark:hover:from-indigo-500/15 dark:hover:to-purple-500/15 border border-indigo-200 dark:border-indigo-800/60 text-gray-700 dark:text-gray-200 transition-all hover:shadow-md hover:scale-[1.02] group"
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm border border-indigo-200 dark:border-indigo-700/50">
                <FiUser className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-medium">Profile</span>
              <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none z-20">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm w-full text-left text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group"
                >
                  <FiLogOut className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                  <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Sign out</span>
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* We don't need the original SignOutButton as we've replaced it with our own UI */}
      </div>
    </header>
  );
};

export default Header; 
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { FiMoon, FiSun, FiLogOut, FiUser, FiChevronDown } from "react-icons/fi";
import { SignOutButton } from "../SignOutButton";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

// CSS Animation for header elements
const headerAnimations = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out forwards;
  }
`;

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
  
  // Add the styles to the document
  useEffect(() => {
    // Add animations
    const animationStyleSheet = document.createElement("style");
    animationStyleSheet.innerText = headerAnimations;
    document.head.appendChild(animationStyleSheet);
    
    return () => {
      document.head.removeChild(animationStyleSheet);
    };
  }, []);
  
  return (
    <header className="sticky top-0 z-10 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/80 dark:from-gray-800 dark:via-gray-850 dark:to-gray-800 py-3.5 px-5 md:px-8 flex justify-between items-center border-b border-indigo-100 dark:border-indigo-900/30 shadow-sm">
      <div className="flex items-center overflow-visible px-1">
        <Link to="/" className="no-underline group">
          <h2 className={`relative text-2xl flex items-center ${mounted ? 'opacity-100' : 'opacity-0'} transition-opacity duration-700`}>
            {/* Glass effect behind logo */}
            <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/50 to-white/10 dark:from-gray-800/30 dark:to-gray-800/5 backdrop-blur-sm -z-10 scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500"></span>
            
            {/* Main logo text */}
            <span className="relative inline-flex items-baseline bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300 bg-clip-text text-transparent font-extrabold tracking-tight pr-0.5 transition-all duration-300 group-hover:scale-[1.02] origin-left">
              <span>lumenly</span>
            </span>
            
            {/* Domain text */}
            <span className="relative text-gray-500/80 dark:text-gray-400/80 font-light tracking-tight ml-0.5 text-shadow-sm italic pr-1 transition-all duration-300 group-hover:text-indigo-400/80 dark:group-hover:text-indigo-300/80">
              .dev
              <span className="absolute -right-0.5 -top-0.5 w-1 h-1 rounded-full bg-indigo-400 dark:bg-indigo-300 opacity-70 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></span>
            </span>
            
            {/* Animated underline effect */}
            <span className="absolute w-[calc(100%+4px)] h-0.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300 opacity-90 rounded-full bottom-0 left-0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out origin-left logo-shimmer"></span>
            
            {/* 3D depth shadow for text */}
            <span className="absolute inset-0 right-auto w-auto pr-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300 bg-clip-text text-transparent font-extrabold tracking-tight blur-[2px] opacity-30 -z-10 translate-y-[2px] translate-x-[1px] scale-y-[1.01] scale-x-[1.005]">lumenly</span>
          </h2>
        </Link>
      </div>
      
      <div className="flex items-center gap-3 md:gap-4">
        {/* Theme toggle button */}
        <button 
          onClick={toggleTheme}
          className="relative p-2 rounded-full bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/80 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center border border-gray-200/50 dark:border-gray-700/50 w-9 h-9 overflow-hidden group"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/20 to-yellow-300/20 dark:from-indigo-400/20 dark:to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/5 to-yellow-400/5 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-full"></div>
          {theme === 'dark' ? (
            <FiSun className="w-5 h-5 hover-float text-indigo-500 drop-shadow-md" />
          ) : (
            <FiMoon className="w-5 h-5 hover-float text-indigo-600 drop-shadow-md" />
          )}
          <span className="absolute inset-0 rounded-full ring-0 group-hover:ring-2 ring-indigo-400/20 dark:ring-indigo-400/30 transition-all duration-300"></span>
        </button>
        
        {/* User profile and sign out */}
        {isAuthenticated && (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 py-1.5 pl-2.5 pr-3 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 dark:from-indigo-500/15 dark:to-purple-500/15 dark:hover:from-indigo-500/25 dark:hover:to-purple-500/25 border border-indigo-200/70 dark:border-indigo-800/60 text-gray-700 dark:text-gray-200 transition-all hover:shadow-lg active:shadow-md active:scale-[0.98] group"
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm border border-indigo-200 dark:border-indigo-700/50 group-hover:shadow-md group-hover:from-indigo-400 group-hover:to-purple-400 transition-all group-hover:scale-[1.05] duration-300">
                <FiUser className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Profile</span>
              <FiChevronDown className={`w-4 h-4 transition-transform duration-300 ${userMenuOpen ? 'rotate-180 text-indigo-500 dark:text-indigo-400' : ''} group-hover:text-indigo-500 dark:group-hover:text-indigo-400`} />
              
              {/* Highlight ring on hover */}
              <span className="absolute inset-0 rounded-full ring-0 group-hover:ring-2 ring-indigo-400/20 dark:ring-indigo-400/30 transition-all duration-300"></span>
            </button>
            
            {/* Dropdown menu with animation */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl shadow-xl py-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-gray-200/80 dark:border-gray-700/80 focus:outline-none z-20 animate-fadeIn overflow-hidden">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 px-4 py-3 text-sm w-full text-left text-gray-700 dark:text-gray-200 hover:bg-indigo-50/70 dark:hover:bg-indigo-900/30 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors">
                    <FiLogOut className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className="group-hover:text-red-600 dark:group-hover:text-red-400 font-medium transition-colors">Sign out</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">End your current session</span>
                  </div>
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
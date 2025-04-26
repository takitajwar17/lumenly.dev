import React, { useState, useEffect } from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { FiMoon, FiSun } from "react-icons/fi";
import { Toaster } from "sonner";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import CodeRoom from "./components/CodeRoom";
import RoomRouteHandler from "./components/RoomRouteHandler";
import Header from "./components/Header";

// Custom CSS for advanced animations
const logoStyles = `
@keyframes shimmer {
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes subtleRotate {
  0% {
    transform: rotate(-1deg);
  }
  50% {
    transform: rotate(1deg);
  }
  100% {
    transform: rotate(-1deg);
  }
}

.logo-shimmer {
  background: linear-gradient(
    90deg, 
    rgba(99, 102, 241, 0) 0%, 
    rgba(99, 102, 241, 0.3) 25%, 
    rgba(139, 92, 246, 0.5) 50%, 
    rgba(99, 102, 241, 0.3) 75%, 
    rgba(99, 102, 241, 0) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 6s infinite;
}

.hover-float:hover {
  animation: float 4s ease-in-out infinite;
}

.floating-dot {
  animation: pulse 3s ease-in-out infinite, float 6s ease-in-out infinite;
}

.subtle-rotation {
  animation: subtleRotate 10s ease-in-out infinite;
}

.text-shadow-sm {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.dark .text-shadow-sm {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.bg-noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.1'/%3E%3C/svg%3E");
}
`;

export default function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Detect scroll for header effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Animation trigger after mount
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Handle redirect from session storage if user refreshed a deep-linked page
  useEffect(() => {
    // Use a flag to ensure this runs only once
    const redirected = sessionStorage.getItem('redirected');
    if (!redirected) {
      const redirectPath = sessionStorage.getItem('redirectPath');
      if (redirectPath) {
        // Mark as redirected to prevent redirect loops
        sessionStorage.setItem('redirected', 'true');
        // Allow navigation to happen naturally on normal page loads
        setTimeout(() => {
          // Clear the redirect path after use
          sessionStorage.removeItem('redirectPath');
        }, 1000);
      }
    }
  }, []);
  
  return (
    <BrowserRouter>
      <style>{logoStyles}</style>
      <div className={`h-screen w-screen flex flex-col overflow-hidden ${theme === 'dark' ? 'dark' : ''}`}>
        <Header scrolled={scrolled} mounted={mounted} />
        
        <main className="flex-1 flex overflow-hidden w-full">
          <Authenticated>
            <Routes>
              <Route path="/" element={
                // Check if we need to restore a previous path
                (() => {
                  const redirectPath = sessionStorage.getItem('redirectPath');
                  if (redirectPath) {
                    sessionStorage.removeItem('redirectPath');
                    sessionStorage.removeItem('redirected');
                    return <Navigate to={redirectPath} replace />;
                  }
                  return <Navigate to="/room" replace />;
                })()
              } />
              <Route path="/room" element={<div className="w-full h-full"><CodeRoom /></div>} />
              <Route path="/room/:roomCode" element={<div className="w-full h-full"><RoomRouteHandler /></div>} />
              <Route path="*" element={<Navigate to="/room" replace />} />
            </Routes>
          </Authenticated>
          <Unauthenticated>
            <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900 transition-colors bg-noise">
              <div className={`w-full max-w-md mx-auto transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <div className="text-center mb-12 relative">
                  {/* Multiple background effects layered */}
                  <div className="absolute inset-0 -z-10 bg-gradient-radial from-indigo-100/70 to-transparent dark:from-indigo-900/20 dark:to-transparent opacity-70 blur-3xl"></div>
                  <div className="absolute inset-0 -z-20 bg-gradient-to-r from-purple-100/10 via-transparent to-indigo-100/10 dark:from-purple-900/10 dark:via-transparent dark:to-indigo-900/10 blur-2xl"></div>
                  
                  <h1 className="text-6xl mb-3 transition-all relative group">
                    <span className="inline-block mb-1">
                      {/* Main logo with decorative elements */}
                      <span className="relative inline-block">
                        
                        {/* Main text with gradient */}
                        <span className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300 bg-clip-text text-transparent font-extrabold tracking-tight">lumenly</span>
                        
                        {/* 3D effect shadow layer */}
                        <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300 bg-clip-text text-transparent font-extrabold tracking-tight blur-[2px] opacity-30 -z-10 translate-y-[2px] translate-x-[1px] scale-[1.01]">lumenly</span>
                      </span>
                      
                      {/* Domain with subtle styling */}
                      <span className="relative text-gray-500/90 dark:text-gray-400/90 font-light tracking-tight ml-0.5 text-shadow-sm italic">.dev</span>
                    </span>
                  </h1>
                  
                  {/* Ornamental divider with animation */}
                  <div className="relative h-px w-32 mx-auto my-8 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/70 dark:via-indigo-400/70 to-transparent"></div>
                    <div className="absolute inset-0 logo-shimmer"></div>
                  </div>
                  
                  {/* Tagline with refined typography */}
                  <p className="text-xl text-gray-600/90 dark:text-gray-300/90 font-light transition-colors tracking-wide">
                    Collaborative coding, <span className="inline-block italic font-normal bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">reimagined</span>
                  </p>
                </div>
                
                <SignInForm />
              </div>
            </div>
          </Unauthenticated>
        </main>
        <Toaster theme={theme} />
      </div>
    </BrowserRouter>
  );
}
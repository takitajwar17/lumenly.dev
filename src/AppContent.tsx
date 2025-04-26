import React from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { FiMoon, FiSun } from "react-icons/fi";
import { Toaster } from "sonner";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import CodeRoom from "./components/CodeRoom";
import RoomRouteHandler from "./components/RoomRouteHandler";

export default function AppContent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <BrowserRouter>
      <div className={`h-screen w-screen flex flex-col overflow-hidden ${theme === 'dark' ? 'dark' : ''}`}>
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 backdrop-blur-sm p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">CodeCuisine</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
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
        <main className="flex-1 flex overflow-hidden w-full">
          <Authenticated>
            <Routes>
              <Route path="/" element={<Navigate to="/room" replace />} />
              <Route path="/room" element={<div className="w-full h-full"><CodeRoom /></div>} />
              <Route path="/room/:roomCode" element={<div className="w-full h-full"><RoomRouteHandler /></div>} />
              <Route path="*" element={<Navigate to="/room" replace />} />
            </Routes>
          </Authenticated>
          <Unauthenticated>
            <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900 transition-colors">
              <div className="w-full max-w-md mx-auto">
                <div className="text-center mb-8">
                  <h1 className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-4 transition-colors">CodeCuisine</h1>
                  <p className="text-xl text-slate-600 dark:text-slate-400 transition-colors">Sign in to start coding</p>
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
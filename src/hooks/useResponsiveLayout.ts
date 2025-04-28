import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

/**
 * Custom hook to manage responsive layout features in the editor
 */
export function useResponsiveLayout() {
  // UI state
  const [isMobileView, setIsMobileView] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  
  const location = useLocation();
  
  // Check for mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768); // Consider screens below 768px as mobile
    };
    
    // Check initially
    checkMobileView();
    
    // Add resize listener
    window.addEventListener('resize', checkMobileView);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);

  // Function to copy workspace link
  const copyWorkspaceLink = useCallback(() => {
    const url = window.location.origin + location.pathname;
    void navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      toast.success("Workspace link copied to clipboard");
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    });
  }, [location.pathname]);

  const toggleSidebar = useCallback(() => {
    setShowSidebar(prev => !prev);
  }, []);

  return {
    isMobileView,
    isCopied,
    showSidebar,
    copyWorkspaceLink,
    toggleSidebar
  };
} 
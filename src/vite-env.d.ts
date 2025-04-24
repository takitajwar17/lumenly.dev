/// <reference types="vite/client" />

// Extend the Window interface to include monaco
interface Window {
  monaco?: {
    editor?: any;
  };
} 
import React from "react";
import { ThemeProvider } from "./ThemeContext";
import AppContent from "./AppContent";
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
      <Analytics />
    </ThemeProvider>
  );
}

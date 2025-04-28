import React, { useCallback } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { getEditorOptions, getEditorPerformanceOptions } from "../utils/editorOptions";

interface EditorSetupProps {
  code: string;
  language: string;
  theme: string;
  onEditorChange: (value: string | undefined) => void;
  onMount: OnMount;
}

/**
 * EditorSetup component responsible for initializing and configuring Monaco Editor
 */
const EditorSetup: React.FC<EditorSetupProps> = ({
  code,
  language,
  theme,
  onEditorChange,
  onMount
}) => {
  // Get editor options based on the theme
  const editorOptions = getEditorOptions(theme as 'light' | 'dark');

  return (
    <Editor
      height="100%"
      defaultLanguage={language || "javascript"}
      language={language || "javascript"}
      value={code}
      onChange={onEditorChange}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      options={editorOptions}
      onMount={onMount}
    />
  );
};

export default EditorSetup; 
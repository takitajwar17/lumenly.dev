import React, { useRef } from "react";
import { FiUpload } from "react-icons/fi";
import { toast } from "sonner";
import { detectLanguageFromFileName } from "./utils/fileUtils";

interface FileUploadButtonProps {
  onFileContent: (content: string) => void;
  onLanguageDetected?: (language: string) => void;
  className?: string;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileContent,
  onLanguageDetected,
  className = "",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 1MB)
    if (file.size > 1024 * 1024) {
      toast.error("File is too large. Maximum size is 1MB.");
      return;
    }

    // Read file content
    void readFileContent(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper function to handle file reading and processing
  const readFileContent = async (file: File) => {
    try {
      const content = await readFileAsText(file);
      
      // Set content
      onFileContent(content);
      
      // Detect language from file extension
      const language = detectLanguageFromFileName(file.name);
      if (language && onLanguageDetected) {
        // Ask for confirmation before changing the language
        const shouldChangeLanguage = window.confirm(
          `Do you want to change the programming language to ${language} based on the file extension?`
        );
        
        if (shouldChangeLanguage) {
          onLanguageDetected(language);
          toast.success(`Changed language to ${language}`);
        }
      }
    } catch (error) {
      toast.error("Failed to read file. Please try again.");
      console.error("File upload error:", error);
    }
  };

  // Helper function to read file content
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(new Error(reader.error?.message || "Unknown file reading error"));
      reader.readAsText(file);
    });
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.php,.rb,.go,.rs,.swift,.kt,.html,.css,.json,.xml,.yaml,.yml,.md,.sql,.sh"
        style={{ display: "none" }}
      />
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 ${className}`}
        title="Upload a code file"
      >
        <FiUpload className="w-4 h-4" />
        <span>Upload</span>
      </button>
    </>
  );
};

export default FileUploadButton; 
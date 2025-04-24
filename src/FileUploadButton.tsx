import React, { useRef, useState } from "react";
import { FiUpload, FiCode } from "react-icons/fi";
import { toast } from "sonner";
import { detectLanguageFromFileName } from "./utils/fileUtils";
import ConfirmModal from "./ConfirmModal";

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
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState("");

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
        setDetectedLanguage(language);
        setIsConfirmModalOpen(true);
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

  const handleConfirmLanguageChange = () => {
    if (onLanguageDetected) {
      onLanguageDetected(detectedLanguage);
      toast.success(`Changed language to ${detectedLanguage}`);
    }
    setIsConfirmModalOpen(false);
  };

  const handleCancelLanguageChange = () => {
    setIsConfirmModalOpen(false);
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
      {/* Language change confirmation modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Change Programming Language"
        message={
          detectedLanguage ? 
          <>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-3">
                <FiCode className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p>The uploaded file appears to be:</p>
                <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">{detectedLanguage}</p>
              </div>
            </div>
            <p>Would you like to update the editor language settings accordingly?</p>
          </> : 
          'Would you like to change the programming language?'
        }
        confirmText="Yes, Change Language"
        cancelText="No, Keep Current Language"
        onConfirm={handleConfirmLanguageChange}
        onCancel={handleCancelLanguageChange}
      />
    </>
  );
};

export default FileUploadButton; 
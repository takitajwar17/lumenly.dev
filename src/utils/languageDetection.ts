import { supportedLanguages } from "./supportedLanguages";

export function detectLanguage(code: string): string {
  // A simple language detection implementation
  // In a real-world application, this could be more sophisticated

  // Check for Python syntax
  if (code.includes("def ") || code.includes("import ") && code.includes(":")) {
    return "python";
  }

  // Check for Java/C# syntax
  if (code.includes("public class ") || code.includes("private ")) {
    if (code.includes("System.out.println")) {
      return "java";
    }
    if (code.includes("Console.WriteLine")) {
      return "csharp";
    }
  }

  // Check for HTML
  if (code.includes("<html") || code.includes("<!DOCTYPE html")) {
    return "html";
  }

  // Check for CSS
  if (code.match(/{[\s\S]*?}/g) && code.includes(":") && code.includes(";") && !code.includes("function")) {
    return "css";
  }

  // Default to JavaScript/TypeScript
  if (code.includes("interface ") || code.includes(": ") && code.includes("type ")) {
    return "typescript";
  }

  // Default to JavaScript as fallback
  return "javascript";
}

export function getLanguageById(id: string) {
  return supportedLanguages.find(lang => lang.id === id) || supportedLanguages[0];
}

export function getLanguageByExtension(extension: string) {
  return supportedLanguages.find(lang => lang.extension === extension) || supportedLanguages[0];
} 
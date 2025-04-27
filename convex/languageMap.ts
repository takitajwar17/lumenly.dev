/**
 * This file maps language identifiers to their corresponding compiler/interpreter settings
 * Used to ensure code is executed with the correct runtime when using the Piston API
 */

interface LanguageMapping {
  language: string;  // The language identifier for Piston API
  runtime?: string;  // Optional runtime specification
  version?: string;  // Optional version specification
  aliases?: string[]; // Optional aliases for the language
}

// Map our language identifiers to Piston API settings
const languageToCompilerMap: Record<string, LanguageMapping> = {
  // Popular languages (shown in the UI)
  "javascript": { language: "javascript", runtime: "node", version: "18.15.0" },
  "typescript": { language: "typescript", version: "5.0.3" },
  "python": { language: "python", version: "3.10.0" },
  "java": { language: "java", version: "15.0.2" },
  "c++": { language: "c++", runtime: "gcc", version: "10.2.0" },
  "c": { language: "c", runtime: "gcc", version: "10.2.0" },
  "csharp.net": { language: "csharp.net", runtime: "dotnet", version: "5.0.201" },
  "go": { language: "go", version: "1.16.2" },
  "rust": { language: "rust", version: "1.68.2" },
  "swift": { language: "swift", version: "5.3.3" },
  "kotlin": { language: "kotlin", version: "1.8.20" },
  "php": { language: "php", version: "8.2.3" },
  
  // Additional languages
  "bash": { language: "bash", version: "5.2.0" },
  "clojure": { language: "clojure", version: "1.10.3" },
  "dart": { language: "dart", version: "2.19.6" },
  "elixir": { language: "elixir", version: "1.11.3" },
  "fsharp.net": { language: "fsharp.net", runtime: "dotnet", version: "5.0.201" },
  "groovy": { language: "groovy", version: "3.0.7" },
  "haskell": { language: "haskell", version: "9.0.1" },
  "julia": { language: "julia", version: "1.8.5" },
  "lua": { language: "lua", version: "5.4.4" },
  "nim": { language: "nim", version: "1.6.2" },
  "ocaml": { language: "ocaml", version: "4.12.0" },
  "perl": { language: "perl", version: "5.36.0" },
  "powershell": { language: "powershell", runtime: "pwsh", version: "7.1.4" },
  "rscript": { language: "rscript", version: "4.1.1" },
  "ruby": { language: "ruby", version: "3.0.1" },
  "scala": { language: "scala", version: "3.2.2" },
  "sqlite3": { language: "sqlite3", version: "3.36.0" },
  "vlang": { language: "vlang", version: "0.3.3" },
  "zig": { language: "zig", version: "0.10.1" },
};

/**
 * Get compiler settings for a given language identifier
 * This ensures the code is executed with the correct runtime
 */
export function getCompilerSettings(languageId: string): LanguageMapping {
  return languageToCompilerMap[languageId] || { language: languageId };
}

/**
 * Check if a language is supported for compilation
 */
export function isLanguageSupported(languageId: string): boolean {
  return !!languageToCompilerMap[languageId];
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(languageToCompilerMap);
}

/**
 * Map API language identifier to a display name
 */
export function getLanguageDisplayName(languageId: string): string {
  const displayNameMap: Record<string, string> = {
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "python": "Python",
    "java": "Java",
    "c++": "C++",
    "c": "C",
    "csharp.net": "C#",
    "go": "Go",
    "rust": "Rust",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "php": "PHP",
    // Add other languages as needed
  };

  return displayNameMap[languageId] || languageId;
} 
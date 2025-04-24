/**
 * Maps file extensions to programming languages supported by the application
 */
export const FILE_EXTENSION_MAP: Record<string, string> = {
  // JavaScript
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  
  // TypeScript
  ".ts": "typescript",
  ".tsx": "typescript",
  
  // Python
  ".py": "python",
  ".pyw": "python",
  ".ipynb": "python",
  
  // Java
  ".java": "java",
  
  // C/C++
  ".c": "c",
  ".h": "c",
  ".cpp": "cpp",
  ".cc": "cpp",
  ".cxx": "cpp",
  ".hpp": "cpp",
  
  // C#
  ".cs": "csharp",
  
  // PHP
  ".php": "php",
  
  // Ruby
  ".rb": "ruby",
  
  // Go
  ".go": "go",
  
  // Rust
  ".rs": "rust",
  
  // Swift
  ".swift": "swift",
  
  // Kotlin
  ".kt": "kotlin",
  ".kts": "kotlin",
  
  // HTML/CSS (treated as plain text)
  ".html": "html",
  ".htm": "html",
  ".css": "css",
  ".scss": "css",
  ".sass": "css",
  
  // Common data formats
  ".json": "json",
  ".xml": "xml",
  ".yaml": "yaml",
  ".yml": "yaml",
  
  // Markdown
  ".md": "markdown",
  ".markdown": "markdown",
  
  // SQL
  ".sql": "sql",
  
  // Shell scripting
  ".sh": "shell",
  ".bash": "shell",
  ".zsh": "shell",
};

/**
 * Detects a programming language based on a file extension
 * @param fileName The name of the file
 * @returns The detected language or null if unknown
 */
export function detectLanguageFromFileName(fileName: string): string | null {
  // Extract extension from the file name
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  
  // Return the mapped language or null if not found
  return FILE_EXTENSION_MAP[extension] || null;
} 
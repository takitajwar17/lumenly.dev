/**
 * Piston API integration for compiling and running code in various languages
 * https://github.com/engineer-man/piston
 */

import { getCompilerSettings } from "./languageMap";

// Public Piston API endpoint
const PISTON_API_URL = "https://emkc.org/api/v2/piston";

/**
 * Run code using the Piston API
 * @param language The language identifier
 * @param code The source code to execute
 * @param stdin Optional standard input
 * @returns The execution result
 */
export async function runCode(language: string, code: string, stdin: string = ""): Promise<ExecutionResult> {
  try {
    // Get the compiler settings for this language
    const compilerSettings = getCompilerSettings(language);
    
    // Create the request payload
    const payload = {
      language: compilerSettings.language,
      version: compilerSettings.version,
      ...(compilerSettings.runtime && { runtime: compilerSettings.runtime }),
      files: [
        {
          name: getFileNameForLanguage(language),
          content: code,
        },
      ],
      stdin,
      args: [], // Command line arguments (if needed)
      compile_timeout: 10000, // 10 seconds
      run_timeout: 5000, // 5 seconds
      compile_memory_limit: -1, // No limit
      run_memory_limit: -1, // No limit
    };

    // Call the Piston API
    const response = await fetch(`${PISTON_API_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Format the result
    return {
      success: result.run?.code === 0,
      output: formatOutput(result),
      compile: {
        success: !result.compile?.code || result.compile.code === 0,
        output: result.compile?.output || "",
        error: result.compile?.stderr || "",
      },
      run: {
        success: result.run?.code === 0,
        output: result.run?.output || "",
        error: result.run?.stderr || "",
      },
      language,
      raw: result,
    };
  } catch (error) {
    console.error("Error executing code:", error);
    return {
      success: false,
      output: `Error: ${error instanceof Error ? error.message : String(error)}`,
      compile: { success: false, output: "", error: "" },
      run: { success: false, output: "", error: "" },
      language,
      raw: null,
    };
  }
}

/**
 * Get the appropriate file name for the given language
 */
function getFileNameForLanguage(language: string): string {
  const extensions: Record<string, string> = {
    "javascript": "code.js",
    "typescript": "code.ts",
    "python": "code.py",
    "java": "Main.java",
    "c++": "code.cpp",
    "c": "code.c",
    "csharp.net": "Program.cs",
    "go": "code.go",
    "rust": "code.rs",
    "swift": "code.swift",
    "kotlin": "code.kt",
    "php": "code.php",
    "bash": "code.sh",
    "clojure": "code.clj",
    "dart": "code.dart",
    "elixir": "code.exs",
    "fsharp.net": "code.fs",
    "groovy": "code.groovy",
    "haskell": "code.hs",
    "julia": "code.jl",
    "lua": "code.lua",
    "nim": "code.nim",
    "ocaml": "code.ml",
    "perl": "code.pl",
    "powershell": "code.ps1",
    "rscript": "code.r",
    "ruby": "code.rb",
    "scala": "code.scala",
    "sqlite3": "code.sql",
    "vlang": "code.v",
    "zig": "code.zig",
  };

  return extensions[language] || "code.txt";
}

/**
 * Format the output from the Piston API into a human-readable string
 */
function formatOutput(result: any): string {
  // Combine error and output messages
  let output = "";
  
  // Add compilation errors if present
  if (result.compile?.stderr) {
    output += `Compilation Error:\n${result.compile.stderr}\n\n`;
  }
  
  // Add compilation output if present
  if (result.compile?.output) {
    output += `Compilation Output:\n${result.compile.output}\n\n`;
  }
  
  // Add runtime errors if present
  if (result.run?.stderr) {
    output += `Runtime Error:\n${result.run.stderr}\n\n`;
  }
  
  // Add program output if present
  if (result.run?.output) {
    output += `Program Output:\n${result.run.output}`;
  }
  
  // Fallback for empty output
  if (!output) {
    if (result.run?.code === 0) {
      output = "Program executed successfully with no output.";
    } else {
      output = "Program execution failed without specific error messages.";
    }
  }
  
  return output.trim();
}

/**
 * Interface for execution results
 */
export interface ExecutionResult {
  success: boolean;
  output: string;
  compile: {
    success: boolean;
    output: string;
    error: string;
  };
  run: {
    success: boolean;
    output: string;
    error: string;
  };
  language: string;
  raw: any;
} 
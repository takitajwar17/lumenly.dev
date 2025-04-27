// Code templates for various programming languages
// This file contains starter code templates for all supported languages

export const getDefaultCodeForLanguage = (language: string): string => {
  switch (language) {
    // JavaScript (Node.js)
    case "javascript":
      return '// JavaScript code\nconsole.log("Hello, world!");\n\n// Try writing a function\nfunction add(a, b) {\n  return a + b;\n}\n\nconsole.log(add(5, 3));';
    
    // TypeScript 
    case "typescript":
      return '// TypeScript code\nfunction greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));\n\n// Try writing a typed function\nfunction add(a: number, b: number): number {\n  return a + b;\n}\n\nconsole.log(add(5, 3));';
    
    // Python
    case "python":
      return '# Python code\nprint("Hello, world!")\n\n# Try writing a function\ndef add(a, b):\n    return a + b\n\nprint(f"Sum: {add(5, 3)}")';
    
    // Java
    case "java":
      return 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, world!");\n    \n    // Try calling a method\n    System.out.println("Sum: " + add(5, 3));\n  }\n  \n  public static int add(int a, int b) {\n    return a + b;\n  }\n}';
    
    // C
    case "c":
      return '#include <stdio.h>\n\n// Function declaration\nint add(int a, int b);\n\nint main() {\n  printf("Hello, world!\\n");\n  \n  // Call the function\n  printf("Sum: %d\\n", add(5, 3));\n  \n  return 0;\n}\n\n// Function definition\nint add(int a, int b) {\n  return a + b;\n}';
    
    // C++
    case "c++":
      return '#include <iostream>\n\nusing namespace std;\n\n// Function declaration\nint add(int a, int b);\n\nint main() {\n  cout << "Hello, world!" << endl;\n  \n  // Call the function\n  cout << "Sum: " << add(5, 3) << endl;\n  \n  return 0;\n}\n\n// Function definition\nint add(int a, int b) {\n  return a + b;\n}';
    
    // C# (.NET)
    case "csharp.net":
      return 'using System;\n\nclass Program {\n  static void Main() {\n    Console.WriteLine("Hello, world!");\n    \n    // Call the method\n    Console.WriteLine($"Sum: {Add(5, 3)}");\n  }\n  \n  static int Add(int a, int b) {\n    return a + b;\n  }\n}';
    
    // Go
    case "go":
      return 'package main\n\nimport "fmt"\n\nfunc add(a, b int) int {\n  return a + b\n}\n\nfunc main() {\n  fmt.Println("Hello, world!")\n  \n  // Call the function\n  fmt.Printf("Sum: %d\\n", add(5, 3))\n}';
    
    // Rust
    case "rust":
      return 'fn add(a: i32, b: i32) -> i32 {\n  a + b\n}\n\nfn main() {\n  println!("Hello, world!");\n  \n  // Call the function\n  println!("Sum: {}", add(5, 3));\n}';
    
    // Swift
    case "swift":
      return '// Swift code\nprint("Hello, world!")\n\n// Define a function\nfunc add(_ a: Int, _ b: Int) -> Int {\n  return a + b\n}\n\n// Call the function\nprint("Sum: \\(add(5, 3))")';
    
    // Kotlin
    case "kotlin":
      return 'fun add(a: Int, b: Int): Int {\n  return a + b\n}\n\nfun main() {\n  println("Hello, world!")\n  \n  // Call the function\n  println("Sum: ${add(5, 3)}")\n}';
    
    // PHP
    case "php":
      return '<?php\n\necho "Hello, world!\\n";\n\n// Define a function\nfunction add($a, $b) {\n  return $a + $b;\n}\n\n// Call the function\necho "Sum: " . add(5, 3) . "\\n";\n';
    
    // Ruby
    case "ruby":
      return '# Ruby code\nputs "Hello, world!"\n\n# Define a method\ndef add(a, b)\n  a + b\nend\n\n# Call the method\nputs "Sum: #{add(5, 3)}"';
    
    // Bash
    case "bash":
      return '#!/bin/bash\n\necho "Hello, world!"\n\n# Define a function\nadd() {\n  echo $(($1 + $2))\n}\n\n# Call the function\nresult=$(add 5 3)\necho "Sum: $result"';
    
    // Clojure
    case "clojure":
      return '(ns hello-world)\n\n(defn add [a b]\n  (+ a b))\n\n(println "Hello, world!")\n(println (str "Sum: " (add 5 3)))';
    
    // Dart
    case "dart":
      return 'void main() {\n  print("Hello, world!");\n  \n  // Call the function\n  print("Sum: ${add(5, 3)}");\n}\n\nint add(int a, int b) {\n  return a + b;\n}';
    
    // Elixir
    case "elixir":
      return 'defmodule Hello do\n  def add(a, b) do\n    a + b\n  end\nend\n\nIO.puts "Hello, world!"\nIO.puts "Sum: #{Hello.add(5, 3)}"';
    
    // F# (.NET)
    case "fsharp.net":
      return 'printfn "Hello, world!"\n\n// Define a function\nlet add a b = a + b\n\n// Call the function\nprintfn "Sum: %d" (add 5 3)';
    
    // Groovy
    case "groovy":
      return '// Groovy code\nprintln "Hello, world!"\n\n// Define a function\ndef add(a, b) {\n  return a + b\n}\n\n// Call the function\nprintln "Sum: ${add(5, 3)}"';
    
    // Haskell
    case "haskell":
      return 'add :: Int -> Int -> Int\nadd a b = a + b\n\nmain :: IO ()\nmain = do\n  putStrLn "Hello, world!"\n  putStrLn $ "Sum: " ++ show (add 5 3)';
    
    // Julia
    case "julia":
      return '# Julia code\nprintln("Hello, world!")\n\n# Define a function\nfunction add(a, b)\n    return a + b\nend\n\n# Call the function\nprintln("Sum: $(add(5, 3))")';
    
    // Lua
    case "lua":
      return '-- Lua code\nprint("Hello, world!")\n\n-- Define a function\nfunction add(a, b)\n  return a + b\nend\n\n-- Call the function\nprint("Sum: " .. add(5, 3))';
    
    // Nim
    case "nim":
      return '# Nim code\necho "Hello, world!"\n\n# Define a function\nproc add(a, b: int): int =\n  return a + b\n\n# Call the function\necho "Sum: ", add(5, 3)';
    
    // OCaml
    case "ocaml":
      return 'let add a b = a + b;;\n\nprint_endline "Hello, world!";\nprint_endline ("Sum: " ^ string_of_int (add 5 3));;';
    
    // Perl
    case "perl":
      return '#!/usr/bin/perl\nuse strict;\nuse warnings;\n\nprint "Hello, world!\\n";\n\n# Define a function\nsub add {\n  my ($a, $b) = @_;\n  return $a + $b;\n}\n\n# Call the function\nprint "Sum: " . add(5, 3) . "\\n";';
    
    // PowerShell
    case "powershell":
      return 'Write-Host "Hello, world!"\n\n# Define a function\nfunction Add-Numbers {\n  param($a, $b)\n  return $a + $b\n}\n\n# Call the function\n$result = Add-Numbers 5 3\nWrite-Host "Sum: $result"';
    
    // R
    case "rscript":
      return '# R code\ncat("Hello, world!\\n")\n\n# Define a function\nadd <- function(a, b) {\n  return(a + b)\n}\n\n# Call the function\ncat("Sum:", add(5, 3), "\\n")';
    
    // Scala
    case "scala":
      return '// Scala code\nobject HelloWorld {\n  def add(a: Int, b: Int): Int = a + b\n  \n  def main(args: Array[String]): Unit = {\n    println("Hello, world!")\n    println(s"Sum: ${add(5, 3)}")\n  }\n}';
    
    // SQLite
    case "sqlite3":
      return '-- SQLite code\n\n-- Create a table\nCREATE TABLE greetings (message TEXT);\n\n-- Insert a row\nINSERT INTO greetings VALUES ("Hello, world!");\n\n-- Query the data\nSELECT * FROM greetings;';
    
    // V
    case "vlang":
      return 'fn add(a int, b int) int {\n  return a + b\n}\n\nfn main() {\n  println("Hello, world!")\n  println("Sum: ${add(5, 3)}")\n}';
    
    // Zig
    case "zig":
      return 'const std = @import("std");\n\nfn add(a: i32, b: i32) i32 {\n    return a + b;\n}\n\npub fn main() !void {\n    const stdout = std.io.getStdOut().writer();\n    try stdout.print("Hello, world!\\n", .{});\n    try stdout.print("Sum: {}\\n", .{add(5, 3)});\n}';
    
    // Default / Plain text
    case "plain":
    default:
      return '// Write your code here\nconsole.log("Hello, world!");';
  }
}; 
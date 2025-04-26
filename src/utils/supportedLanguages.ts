interface Language {
  id: string;
  name: string;
  extension: string;
}

export const supportedLanguages: Language[] = [
  { id: "javascript", name: "JavaScript", extension: "js" },
  { id: "typescript", name: "TypeScript", extension: "ts" },
  { id: "python", name: "Python", extension: "py" },
  { id: "java", name: "Java", extension: "java" },
  { id: "csharp", name: "C#", extension: "cs" },
  { id: "cpp", name: "C++", extension: "cpp" },
  { id: "go", name: "Go", extension: "go" },
  { id: "ruby", name: "Ruby", extension: "rb" },
  { id: "php", name: "PHP", extension: "php" },
  { id: "html", name: "HTML", extension: "html" },
  { id: "css", name: "CSS", extension: "css" },
  { id: "json", name: "JSON", extension: "json" },
  { id: "plaintext", name: "Plain Text", extension: "txt" },
]; 
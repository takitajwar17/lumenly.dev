import { supportedLanguages } from "./supportedLanguages";

// Define the Language type locally
type Language = {
  id: string;
  name: string;
  extensions: string[];
};

interface FormattingOptions {
  indentSize: number;
  useTabs: boolean;
  insertFinalNewline: boolean;
}

const defaultFormattingOptions: FormattingOptions = {
  indentSize: 2,
  useTabs: false,
  insertFinalNewline: true,
};

export function formatCode(code: string, language: string, options?: Partial<FormattingOptions>): string {
  const formattingOptions = {
    ...defaultFormattingOptions,
    ...options,
  };

  // Apply formatting based on options
  // This is a simple implementation, in a real application
  // you might want to use a library like Prettier
  let formattedCode = code;

  // Simple indentation handling
  const indent = formattingOptions.useTabs ? '\t' : ' '.repeat(formattingOptions.indentSize);
  
  // Add indentation logic here based on language and options
  
  // Add final newline if specified
  if (formattingOptions.insertFinalNewline && !formattedCode.endsWith('\n')) {
    formattedCode += '\n';
  }

  return formattedCode;
}

export function getDefaultFormattingOptionsForLanguage(language: string): FormattingOptions {
  // Find the language in supported languages
  const foundLanguage = supportedLanguages.find(lang => lang.id === language);
  
  if (!foundLanguage) {
    return defaultFormattingOptions;
  }
  
  // Customize options based on language
  switch (foundLanguage.id) {
    case 'python':
      return {
        ...defaultFormattingOptions,
        indentSize: 4,
      };
    case 'go':
      return {
        ...defaultFormattingOptions,
        useTabs: true,
      };
    default:
      return defaultFormattingOptions;
  }
}

export function isFormattable(language: string): boolean {
  return supportedLanguages.some(lang => lang.id === language);
} 
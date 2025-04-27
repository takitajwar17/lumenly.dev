import { v } from "convex/values";
import { action, query } from "./_generated/server";
import { runCode, ExecutionResult } from "./piston";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getCompilerSettings, isLanguageSupported } from "./languageMap";

/**
 * Execute code for the specified language
 */
export const execute = action({
  args: {
    code: v.string(),
    language: v.string(),
    stdin: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<ExecutionResult> => {
    // Verify user is authenticated
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Execute the code
    return await runCode(args.language, args.code, args.stdin || "");
  },
});

/**
 * Check if a language is supported for execution
 */
export const isSupportedLanguage = query({
  args: {
    language: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if the language is supported
    return isLanguageSupported(args.language);
  },
});

/**
 * Get compiler settings for a language
 */
export const getLanguageCompilerSettings = query({
  args: {
    language: v.string(),
  },
  handler: async (ctx, args) => {
    // Return the compiler settings for this language
    return getCompilerSettings(args.language);
  },
}); 
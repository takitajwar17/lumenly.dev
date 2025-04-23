import { v } from "convex/values";
import { action } from "./_generated/server";
import { OpenAI } from "openai";

// Define the schema for code review responses
const codeReviewSchema = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          code: { type: "string" },
          lineNumber: { type: "number" }
        },
        required: ["title", "description", "code", "lineNumber"]
      }
    },
    issues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          severity: { 
            type: "string",
            enum: ["high", "medium", "low"]
          },
          code: { type: "string" },
          lineNumber: { type: "number" }
        },
        required: ["title", "description", "severity", "code", "lineNumber"]
      }
    },
    improvements: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          code: { type: "string" },
          lineNumber: { type: "number" }
        },
        required: ["title", "description", "code", "lineNumber"]
      }
    }
  },
  required: ["suggestions", "issues", "improvements"]
};

export const getLanguages = action({
  args: {},
  handler: async (ctx) => {
    const response = await fetch("https://emkc.org/api/v2/piston/runtimes");
    const languages = await response.json();
    return languages;
  },
});

export const executeCode = action({
  args: { code: v.string(), language: v.string() },
  handler: async (ctx, args) => {
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: args.language,
        version: "*",
        files: [
          {
            content: args.code,
          },
        ],
      }),
    });

    return await response.json();
  },
});

export const getAIAssistance = action({
  args: { code: v.string(), language: v.string() },
  handler: async (ctx, args) => {
    // Create a custom fetch function for Nebius API
    const customFetch = async (url: string, options: RequestInit) => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CONVEX_NEBIUS_API_KEY}`,
        },
      });
      return response;
    };

    const systemPrompt = `You are an expert code reviewer. Analyze the code and provide a detailed review focusing on:
1. Code quality and best practices
2. Performance improvements
3. Security concerns
4. Maintainability and readability
5. Potential bugs and edge cases

Return your analysis in a structured format that follows the schema provided.`;

    try {
      const response = await customFetch('https://api.studio.nebius.com/v1/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-Coder-32B-Instruct-fast",
          temperature: 0,
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: `Review this ${args.language} code:\n\n${args.code}`
            }
          ],
          guided_json: codeReviewSchema
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Nebius API error:", error);
        return "Error: Failed to get AI review";
      }

      const completion = await response.json();
      const output = completion.choices[0].message;
      
      if (output.content) {
        try {
          // Parse and validate the JSON response
          const review = JSON.parse(output.content);
          return JSON.stringify(review, null, 2); // Pretty print the JSON
        } catch (error) {
          console.error("Failed to parse AI response:", error);
          return "Error: Failed to parse AI review response";
        }
      } else if (output.refusal) {
        console.error("AI refused to provide review:", output.refusal);
        return "Error: AI was unable to review the code";
      }
      
      return "Error: No response from AI";
    } catch (error) {
      console.error("AI review error:", error);
      return "Error: Failed to get AI review";
    }
  },
});

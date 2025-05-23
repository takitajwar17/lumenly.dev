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

    const systemPrompt = `You are an expert code reviewer. Analyze the code and provide a concise review focusing on:
1. Code quality and best practices
2. Performance improvements
3. Security concerns
4. Maintainability and readability
5. Potential bugs and edge cases

Your response MUST be a valid JSON object with this exact structure:
{
  "suggestions": [
    {
      "title": "string (max 50 chars)",
      "description": "string (max 150 chars)",
      "code": "string (max 100 chars, no docstrings or multiline code)",
      "lineNumber": number
    }
  ],
  "issues": [
    {
      "title": "string (max 50 chars)",
      "description": "string (max 150 chars)",
      "severity": "high|medium|low",
      "code": "string (max 100 chars, no docstrings or multiline code)",
      "lineNumber": number
    }
  ],
  "improvements": [
    {
      "title": "string (max 50 chars)",
      "description": "string (max 150 chars)",
      "code": "string (max 100 chars, no docstrings or multiline code)",
      "lineNumber": number
    }
  ]
}

IMPORTANT: 
1. Return ONLY the JSON object, no other text
2. The response must be valid JSON
3. Keep all text fields within the specified length limits
4. Provide at most 2 items per category
5. Do not include any markdown formatting or code blocks
6. Do not include docstrings or multiline code in code snippets
7. Do not include any explanatory text before or after the JSON`;

    try {
      const response = await customFetch('https://api.studio.nebius.com/v1/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-Coder-32B-Instruct-fast",
          temperature: 0,
          max_tokens: 1000,
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
        throw new Error("Failed to get AI review");
      }

      const completion = await response.json();
      console.log("Raw API response:", JSON.stringify(completion, null, 2));
      
      if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
        console.error("Invalid API response structure:", completion);
        throw new Error("Invalid API response structure");
      }

      const output = completion.choices[0].message;
      console.log("Message content:", output.content);
      
      if (output.content) {
        try {
          // Remove any potential markdown code block markers and trim whitespace
          const cleanContent = output.content
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            // Remove trailing '>' characters and trim
            .replace(/>\s*$/g, '')
            .trim();
            
          console.log("Cleaned content:", cleanContent);
          
          // Parse the JSON first to get the structure
          const parsedContent = JSON.parse(cleanContent);
          
          // Helper function to clean code snippets
          const cleanCodeSnippet = (code: string) => {
            return String(code || '')
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim()
              .slice(0, 100);
          };
          
          // Validate and normalize the structure
          const validatedReview = {
            suggestions: (parsedContent.suggestions || []).slice(0, 2).map((s: any) => ({
              title: String(s.title || '').slice(0, 50),
              description: String(s.description || '').slice(0, 150),
              code: cleanCodeSnippet(s.code),
              lineNumber: Number(s.lineNumber) || 1
            })),
            issues: (parsedContent.issues || []).slice(0, 2).map((i: any) => ({
              title: String(i.title || '').slice(0, 50),
              description: String(i.description || '').slice(0, 150),
              severity: ['high', 'medium', 'low'].includes(i.severity) ? i.severity : 'medium',
              code: cleanCodeSnippet(i.code),
              lineNumber: Number(i.lineNumber) || 1
            })),
            improvements: (parsedContent.improvements || []).slice(0, 2).map((i: any) => ({
              title: String(i.title || '').slice(0, 50),
              description: String(i.description || '').slice(0, 150),
              code: cleanCodeSnippet(i.code),
              lineNumber: Number(i.lineNumber) || 1
            })),
            _metadata: {
              model: completion.model,
              created: completion.created
            }
          };
          
          // Return the stringified, validated JSON
          return JSON.stringify(validatedReview);
        } catch (error) {
          console.error("Failed to parse AI response:", error);
          console.error("Content that failed to parse:", output.content);
          throw new Error("Failed to parse AI response");
        }
      } else if (output.refusal) {
        console.error("AI refused to provide review:", output.refusal);
        throw new Error("AI was unable to review the code");
      } else {
        throw new Error("No response from AI");
      }
    } catch (error) {
      console.error("AI review error:", error);
      throw error;
    }
  },
});

export const getCodeCompletion = action({
  args: { 
    code: v.string(), 
    language: v.string(),
    cursorPosition: v.object({
      line: v.number(),
      column: v.number()
    }),
    filename: v.optional(v.string())
  },
  handler: async (ctx, args) => {
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

    const systemPrompt = `You are an expert coding assistant specializing in precise, contextually-aware code completions.

Your task is to analyze the provided code snippet and generate the most accurate continuation at the cursor position.

General guidelines:
- Consider the surrounding context, variable names, function signatures and code patterns
- Continue exactly where the cursor is positioned, without repeating existing code
- Match the existing coding style, conventions, and indentation
- Complete current expressions, statements, or blocks before starting new ones
- Generate syntactically correct and logically appropriate code
- Be aware of language-specific patterns and best practices
- Maintain consistent variable naming with the existing codebase
- Keep completions reasonably sized (1-10 lines at most)
- If completing a function, focus on implementing its logic correctly
- Be mindful of proper closing of brackets, parentheses, and code blocks
- For assignments, infer appropriate values based on variable names and context
- For imports, suggest only what would be immediately useful for the current code
- For method calls, suggest parameters that make sense given the method's context

Your response must ONLY contain the suggested code completion - no explanations, no markdown formatting, no code blocks.`;

    try {
      // Get code up to cursor position to use as context
      const codeLines = args.code.split('\n');
      const cursorLine = args.cursorPosition.line;
      const cursorColumn = args.cursorPosition.column;

      // Extract code context - everything up to the cursor position
      let codeContext = '';
      for (let i = 0; i < codeLines.length; i++) {
        if (i < cursorLine - 1) {
          codeContext += codeLines[i] + '\n';
        } else if (i === cursorLine - 1) {
          codeContext += codeLines[i].substring(0, cursorColumn);
          break;
        }
      }

      // Create appropriate prompt based on context
      const userMessage = `I'm coding in ${args.language}${args.filename ? ` in file ${args.filename}` : ''}.
Here's the code up to my cursor position:

\`\`\`${args.language}
${codeContext}
\`\`\`

Provide a completion suggestion that continues from my cursor position. Don't repeat any code before the cursor.`;

      const response = await customFetch('https://api.studio.nebius.com/v1/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-Coder-32B-Instruct-fast",
          temperature: 0.2,
          max_tokens: 300,
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: userMessage
            }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Nebius API error:", error);
        throw new Error("Failed to get code completion");
      }

      const completion = await response.json();
      console.log("Code completion response:", JSON.stringify(completion, null, 2));
      
      if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
        console.error("Invalid API response structure:", completion);
        throw new Error("Invalid API response structure");
      }

      const output = completion.choices[0].message;
      
      if (output.content) {
        // Clean up the response to remove markdown code blocks and any other formatting
        const cleanedContent = output.content
          .replace(/```[a-zA-Z0-9]*\s*/g, '')
          .replace(/```\s*$/g, '')
          .trim();
        
        return {
          completion: cleanedContent,
          metadata: {
            model: completion.model,
            created: completion.created
          }
        };
      } else {
        throw new Error("No content in response");
      }
    } catch (error) {
      console.error("Code completion error:", error);
      throw error;
    }
  },
});

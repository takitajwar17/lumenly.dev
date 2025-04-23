import { v } from "convex/values";
import { action } from "./_generated/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

export const getLanguages = action({
  args: {},
  handler: async (ctx) => {
    const response = await fetch("https://emkc.org/api/v2/piston/runtimes");
    const languages = await response.json();
    return languages;
  },
});

export const executeCode = action({
  args: {
    language: v.string(),
    code: v.string(),
  },
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
  args: {
    code: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: "You are an expert programmer helping improve code.",
        },
        {
          role: "user",
          content: `Here is some ${args.language} code. Please suggest improvements:\n\n${args.code}`,
        },
      ],
    });
    return response.choices[0].message.content;
  },
});

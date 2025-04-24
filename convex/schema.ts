import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  rooms: defineTable({
    name: v.string(),
    language: v.string(),
    code: v.string(),
    content: v.optional(v.string()),
    creatorId: v.id("users"),
  }).index("by_creator", ["creatorId"]),

  sessions: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    lastAccessTime: v.number(),
  }).index("by_user", ["userId"]),

  presence: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    name: v.string(),
    isAnonymous: v.optional(v.boolean()),
    nickname: v.optional(v.string()),
    cursor: v.object({
      line: v.number(),
      column: v.number(),
    }),
    selection: v.optional(v.object({
      startLine: v.number(),
      startColumn: v.number(),
      endLine: v.number(),
      endColumn: v.number(),
    })),
    color: v.optional(v.string()),
    lastSeenTime: v.number(),
    lastPing: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    isTyping: v.optional(v.boolean()),
    lastActivity: v.optional(v.number()),
  }).index("by_room", ["roomId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Generate a random 6-character code
function generateUniqueCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding ambiguous characters like I, 1, O, 0
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const create = mutation({
  args: {
    name: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Generate a unique code for the room
    let isUnique = false;
    let roomCode = '';
    
    while (!isUnique) {
      roomCode = generateUniqueCode();
      // Check if code already exists
      const existingRoom = await ctx.db
        .query("rooms")
        .filter((q) => q.eq(q.field("code"), roomCode))
        .first();
      
      if (!existingRoom) {
        isUnique = true;
      }
    }

    const initialCode = args.language === "plain" 
      ? "" 
      : getDefaultCodeForLanguage(args.language);

    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      language: args.language,
      code: roomCode,
      content: initialCode,
      creatorId: userId,
    });

    await ctx.db.insert("sessions", {
      roomId,
      userId,
      lastAccessTime: Date.now(),
    });

    return roomId;
  },
});

// Helper function to get starter code for different languages
function getDefaultCodeForLanguage(language: string): string {
  switch (language) {
    case "javascript":
      return '// JavaScript code\nconsole.log("Hello, world!");';
    case "python":
      return '# Python code\nprint("Hello, world!")';
    case "java":
      return 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, world!");\n  }\n}';
    case "cpp":
      return '#include <iostream>\n\nint main() {\n  std::cout << "Hello, world!" << std::endl;\n  return 0;\n}';
    default:
      return '';
  }
}

export const get = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    return room;
  },
});

export const joinByCode = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find the room with this code
    const room = await ctx.db
      .query("rooms")
      .filter((q) => q.eq(q.field("code"), args.code))
      .first();
    
    if (!room) {
      throw new Error("Invalid room code");
    }

    // Check if user already has a session for this room
    const existingSession = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("roomId"), room._id))
      .first();
    
    // If no existing session, create one
    if (!existingSession) {
      await ctx.db.insert("sessions", {
        roomId: room._id,
        userId,
        lastAccessTime: Date.now(),
      });
    } else {
      // Update the last access time
      await ctx.db.patch(existingSession._id, {
        lastAccessTime: Date.now(),
      });
    }

    return room._id;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const rooms = await Promise.all(
      sessions.map(async (session) => {
        const room = await ctx.db.get(session.roomId);
        return room;
      })
    );

    return rooms.filter((room): room is NonNullable<typeof room> => room !== null);
  },
});

export const updateCode = mutation({
  args: {
    roomId: v.id("rooms"),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Update both code and content fields for compatibility
    await ctx.db.patch(args.roomId, {
      code: args.code,
      content: args.code,
    });
  },
});

export const updatePresence = mutation({
  args: {
    roomId: v.id("rooms"),
    cursor: v.object({
      line: v.number(),
      column: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        cursor: args.cursor,
        lastSeenTime: Date.now(),
      });
    } else {
      await ctx.db.insert("presence", {
        roomId: args.roomId,
        userId,
        name: user.email ?? "Anonymous",
        cursor: args.cursor,
        lastSeenTime: Date.now(),
      });
    }
  },
});

export const getPresence = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("presence")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.gt(q.field("lastSeenTime"), Date.now() - 30000))
      .collect();
  },
});

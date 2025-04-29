import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getDefaultCodeForLanguage } from "./codeTemplates";

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
  returns: v.object({
    roomId: v.id("rooms"),
    code: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Generate a unique code for the workspace
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

    return { roomId, code: roomCode };
  },
});

export const get = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const workspace = await ctx.db.get(args.roomId);
    if (!workspace) return null;

    return workspace;
  },
});

export const joinByCode = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find the workspace with this code
    const workspace = await ctx.db
      .query("rooms")
      .filter((q) => q.eq(q.field("code"), args.code))
      .first();
    
    if (!workspace) {
      throw new Error("Invalid workspace code");
    }

    // Check if user already has a session for this workspace
    const existingSession = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("roomId"), workspace._id))
      .first();
    
    // If no existing session, create one
    if (!existingSession) {
      await ctx.db.insert("sessions", {
        roomId: workspace._id,
        userId,
        lastAccessTime: Date.now(),
      });
    } else {
      // Update the last access time
      await ctx.db.patch(existingSession._id, {
        lastAccessTime: Date.now(),
      });
    }

    return workspace._id;
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
        const workspace = await ctx.db.get(session.roomId);
        return workspace;
      })
    );

    return rooms.filter((workspace): workspace is NonNullable<typeof workspace> => workspace !== null);
  },
});

// List rooms with additional details including active collaborators
export const listWithDetails = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get workspace IDs
    const roomIds = sessions.map(session => session.roomId);
    
    // Get all rooms
    const roomsPromises = roomIds.map(async (roomId) => {
      const workspace = await ctx.db.get(roomId);
      if (!workspace) return null;
      
      // Get active collaborators (users seen in the last 5 minutes)
      const activePresence = await ctx.db
        .query("presence")
        .withIndex("by_room", (q) => q.eq("roomId", roomId))
        .filter((q) => q.gt(q.field("lastSeenTime"), Date.now() - 5 * 60 * 1000)) // 5 minutes
        .collect();
        
      // Find sessions for this workspace to determine last activity
      const roomSessions = await ctx.db
        .query("sessions")
        .filter((q) => q.eq(q.field("roomId"), roomId))
        .collect();
      
      // Use the most recent access time as the last edited time
      const lastAccessTimes = roomSessions.map(s => s.lastAccessTime);
      const lastEdited = lastAccessTimes.length > 0 ? Math.max(...lastAccessTimes) : null;
      
      return {
        workspace,
        activeCollaborators: activePresence.length,
        lastEdited
      };
    });
    
    const roomsWithDetails = await Promise.all(roomsPromises);
    return roomsWithDetails.filter((item): item is NonNullable<typeof item> => item !== null);
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

    // Only update the content field, not the code field (workspace identifier)
    await ctx.db.patch(args.roomId, {
      content: args.code,
    });
  },
});

// Function to generate a creative nickname
function generateNickname(): string {
  const adjectives = [
    "Swift", "Witty", "Clever", "Bright", "Sharp", "Nimble", "Agile", "Quick",
    "Smart", "Perky", "Lively", "Eager", "Merry", "Happy", "Jolly", "Daring",
    "Brave", "Bold", "Cosmic", "Mystic", "Quirky", "Zany", "Jazzy", "Funky",
    "Snazzy", "Spiffy", "Groovy", "Awesome", "Epic", "Stellar", "Magical",
    "Sparkly", "Glowing", "Radiant", "Dazzling", "Gleaming", "Shimmering"
  ];
  
  const animals = [
    "Fox", "Wolf", "Panda", "Tiger", "Lion", "Eagle", "Hawk", "Falcon", "Owl",
    "Dolphin", "Penguin", "Koala", "Rabbit", "Squirrel", "Raccoon", "Badger",
    "Lynx", "Hedgehog", "Otter", "Ferret", "Narwhal", "Axolotl", "Armadillo",
    "Platypus", "Giraffe", "Elephant", "Octopus", "Peacock", "Flamingo",
    "Chameleon", "Phoenix", "Dragon", "Griffin", "Unicorn", "Pegasus"
  ];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  
  return `${randomAdjective}${randomAnimal}`;
}

// Generate a unique color for each user
function generateUserColor(): string {
  // Using a set of colors that are visually distinct and accessible
  const colors = [
    "#FF5555", "#FF9933", "#FFCC33", "#33CC33", "#3399FF", 
    "#9966CC", "#FF6699", "#00CCCC", "#99CC00", "#FF66CC",
    "#CC6600", "#6699CC", "#CC3399", "#669933", "#9933CC"
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

export const updatePresence = mutation({
  args: {
    roomId: v.id("rooms"),
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
    isActive: v.optional(v.boolean()),
    isTyping: v.optional(v.boolean()),
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

    const now = Date.now();
    const isAnonymous = !user.email || user.email.includes("anonymous");
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        cursor: args.cursor,
        selection: args.selection,
        lastSeenTime: now,
        lastPing: now,
        isActive: args.isActive ?? existing.isActive ?? false,
        isTyping: args.isTyping ?? existing.isTyping ?? false,
        lastActivity: args.isActive ? now : existing.lastActivity,
      });
    } else {
      // New presence entry - generate nickname and color
      const nickname = generateNickname();
      const color = generateUserColor();
      
      await ctx.db.insert("presence", {
        roomId: args.roomId,
        userId,
        name: user.email ?? "Anonymous",
        isAnonymous,
        nickname: isAnonymous ? nickname : undefined,
        cursor: args.cursor,
        selection: args.selection,
        color,
        lastSeenTime: now,
        lastPing: now,
        isActive: args.isActive ?? false,
        isTyping: args.isTyping ?? false,
        lastActivity: args.isActive ? now : undefined,
      });
    }
  },
});

export const getPresence = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    // Get current user's ID to highlight it differently in the UI
    const currentUserId = await getAuthUserId(ctx);
    
    // Filter for users seen in the last 60 seconds (increased from 15)
    // Using lastSeenTime which exists on all records
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.gt(q.field("lastSeenTime"), Date.now() - 60000))
      .collect();
      
    // Add a field to indicate if this is the current user
    return presence.map(user => ({
      ...user,
      isCurrentUser: currentUserId ? user.userId === currentUserId : false
    }));
  },
});

export const updateLanguage = mutation({
  args: {
    roomId: v.id("rooms"),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify the workspace exists and user has access
    const workspace = await ctx.db.get(args.roomId);
    if (!workspace) throw new Error("Workspace not found");

    // Update the language field
    await ctx.db.patch(args.roomId, {
      language: args.language,
    });

    return { success: true };
  },
});

export const leaveRoom = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find user's presence in the workspace
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .unique();

    // If presence record exists, delete it
    if (presence) {
      await ctx.db.delete(presence._id);
    }

    return { success: true };
  },
});

export const updateRoomName = mutation({
  args: {
    roomId: v.id("rooms"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify the workspace exists
    const workspace = await ctx.db.get(args.roomId);
    if (!workspace) throw new Error("Workspace not found");

    // Update the workspace name
    await ctx.db.patch(args.roomId, {
      name: args.name,
    });

    return { success: true };
  },
});

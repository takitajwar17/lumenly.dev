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
  returns: v.object({
    roomId: v.id("rooms"),
    code: v.string(),
  }),
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

    return { roomId, code: roomCode };
  },
});

// Helper function to get starter code for different languages
function getDefaultCodeForLanguage(language: string): string {
  switch (language) {
    case "javascript":
      return '// JavaScript code\nconsole.log("Hello, world!");\n\n// Try writing a function\nfunction add(a, b) {\n  return a + b;\n}\n\nconsole.log(add(5, 3));';
    
    case "typescript":
      return '// TypeScript code\nfunction greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));';
    
    case "python":
      return '# Python code\nprint("Hello, world!")\n\n# Try writing a function\ndef add(a, b):\n    return a + b\n\nprint(add(5, 3))';
    
    case "java":
      return 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, world!");\n    \n    // Try calling a method\n    System.out.println("Sum: " + add(5, 3));\n  }\n  \n  public static int add(int a, int b) {\n    return a + b;\n  }\n}';
    
    case "c":
      return '#include <stdio.h>\n\n// Function declaration\nint add(int a, int b);\n\nint main() {\n  printf("Hello, world!\\n");\n  \n  // Call the function\n  printf("Sum: %d\\n", add(5, 3));\n  \n  return 0;\n}\n\n// Function definition\nint add(int a, int b) {\n  return a + b;\n}';
    
    case "cpp":
      return '#include <iostream>\n\nusing namespace std;\n\n// Function declaration\nint add(int a, int b);\n\nint main() {\n  cout << "Hello, world!" << endl;\n  \n  // Call the function\n  cout << "Sum: " << add(5, 3) << endl;\n  \n  return 0;\n}\n\n// Function definition\nint add(int a, int b) {\n  return a + b;\n}';
    
    case "csharp":
      return 'using System;\n\nclass Program {\n  static void Main() {\n    Console.WriteLine("Hello, world!");\n    \n    // Call the method\n    Console.WriteLine($"Sum: {Add(5, 3)}");\n  }\n  \n  static int Add(int a, int b) {\n    return a + b;\n  }\n}';
    
    case "php":
      return '<?php\n\necho "Hello, world!\\n";\n\n// Define a function\nfunction add($a, $b) {\n  return $a + $b;\n}\n\n// Call the function\necho "Sum: " . add(5, 3) . "\\n";\n';
    
    case "ruby":
      return '# Ruby code\nputs "Hello, world!"\n\n# Define a method\ndef add(a, b)\n  a + b\nend\n\n# Call the method\nputs "Sum: #{add(5, 3)}"';
    
    case "go":
      return 'package main\n\nimport "fmt"\n\nfunc add(a, b int) int {\n  return a + b\n}\n\nfunc main() {\n  fmt.Println("Hello, world!")\n  \n  // Call the function\n  fmt.Printf("Sum: %d\\n", add(5, 3))\n}';
    
    case "rust":
      return 'fn add(a: i32, b: i32) -> i32 {\n  a + b\n}\n\nfn main() {\n  println!("Hello, world!");\n  \n  // Call the function\n  println!("Sum: {}", add(5, 3));\n}';
    
    case "swift":
      return '// Swift code\nprint("Hello, world!")\n\n// Define a function\nfunc add(_ a: Int, _ b: Int) -> Int {\n  return a + b\n}\n\n// Call the function\nprint("Sum: \\(add(5, 3))")';
    
    case "kotlin":
      return 'fun add(a: Int, b: Int): Int {\n  return a + b\n}\n\nfun main() {\n  println("Hello, world!")\n  \n  // Call the function\n  println("Sum: ${add(5, 3)}")\n}';
    
    default:
      return '// Write your code here\nconsole.log("Hello, world!");';
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

    // Only update the content field, not the code field (room identifier)
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
    
    // Filter for users seen in the last 15 seconds
    // Using lastSeenTime which exists on all records
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.gt(q.field("lastSeenTime"), Date.now() - 15000))
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

    // Verify the room exists and user has access
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

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

    // Find user's presence in the room
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

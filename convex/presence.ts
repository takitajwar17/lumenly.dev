import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// This function cleans up inactive users by removing their presence records
export const cleanupInactive = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const inactiveTime = now - 15000; // 15 seconds ago
    
    // Find all inactive records based on lastSeenTime
    // This works for both records with and without lastPing
    const inactivePresence = await ctx.db
      .query("presence")
      .filter((q) => q.lt(q.field("lastSeenTime"), inactiveTime))
      .collect();
    
    console.log(`Cleaning up ${inactivePresence.length} inactive users`);
    
    // Delete each inactive presence record
    for (const presence of inactivePresence) {
      await ctx.db.delete(presence._id);
    }
    
    return { removedCount: inactivePresence.length };
  },
}); 
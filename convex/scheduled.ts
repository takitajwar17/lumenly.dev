import { action } from "./_generated/server";
import { internal } from "./_generated/api";

// Schedulable action to clean up inactive users
export default action({
  args: {},
  handler: async (ctx): Promise<{ removedCount: number }> => {
    // Call our mutation through the internal API
    return await ctx.runMutation(internal.presence.cleanupInactive);
  },
}); 
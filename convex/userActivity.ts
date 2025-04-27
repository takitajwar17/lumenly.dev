import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Define types for activity data
interface ActivityDay {
  date: string;
  count: number;
  level: number;
}

// Define type for activity response
interface ActivityResponse {
  activityData: ActivityDay[];
}

// Define type for activity stats
interface ActivityStats {
  totalActiveDays: number;
  currentStreak: number;
  longestStreak: number;
  mostActiveDay: string;
  totalSessions: number;
  averageSessionsPerActiveDay: number;
}

/**
 * Get activity data for the current user, formatted for the GitHub-style activity graph.
 * 
 * This function analyzes user activity based on:
 * 1. Session entries - when users access workspaces
 * 2. Presence data - active editing, typing, etc.
 * 
 * The data is aggregated by day, with activity levels calculated based on
 * frequency and type of interactions.
 */
export const getUserActivityData = query({
  args: {
    days: v.optional(v.number()),
  },
  returns: v.object({
    activityData: v.array(
      v.object({
        date: v.string(),
        count: v.number(),
        level: v.number(),
      })
    )
  }),
  handler: async (ctx, args): Promise<ActivityResponse> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { activityData: [] };

    // Number of days to look back (default: 365 days / ~1 year)
    const lookbackDays = args.days ?? 365;
    const now = Date.now();
    const startTime = now - lookbackDays * 24 * 60 * 60 * 1000;

    // Get all of the user's sessions (workspace accesses)
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gt(q.field("lastAccessTime"), startTime))
      .collect();

    // Group sessions by day
    const sessionsByDay = new Map<string, any[]>();
    sessions.forEach(session => {
      const date = new Date(session.lastAccessTime);
      // Format date as YYYY-MM-DD
      const dateKey = date.toISOString().split('T')[0];
      
      if (!sessionsByDay.has(dateKey)) {
        sessionsByDay.set(dateKey, []);
      }
      sessionsByDay.get(dateKey)?.push(session);
    });

    // Generate a complete list of dates for the lookback period
    const allDates: string[] = [];
    const today = new Date();
    // Start from January 1st of the current year
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const currentYear = today.getFullYear();
    
    // Calculate days from start of year until today
    const start = new Date(startOfYear);
    while (start <= today) {
      const dateKey = start.toISOString().split('T')[0];
      allDates.push(dateKey);
      start.setDate(start.getDate() + 1);
    }
    
    // Pad with future dates to complete the year if needed
    if (allDates.length < 365) {
      const end = new Date(currentYear, 11, 31); // December 31st
      const lastDate = new Date(allDates[allDates.length - 1]);
      const nextDay = new Date(lastDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      while (nextDay <= end) {
        const dateKey = nextDay.toISOString().split('T')[0];
        allDates.push(dateKey);
        nextDay.setDate(nextDay.getDate() + 1);
      }
    }

    // Create activity data for each day
    const activityData: ActivityDay[] = allDates.map(dateKey => {
      const sessionsForDay = sessionsByDay.get(dateKey) || [];
      
      // Calculate activity level based on number of sessions
      let activityLevel = 0;
      if (sessionsForDay.length >= 10) {
        activityLevel = 4; // Very active
      } else if (sessionsForDay.length >= 5) {
        activityLevel = 3; // Active
      } else if (sessionsForDay.length >= 2) {
        activityLevel = 2; // Moderately active
      } else if (sessionsForDay.length >= 1) {
        activityLevel = 1; // Slightly active
      }

      return {
        date: dateKey,
        count: sessionsForDay.length,
        level: activityLevel
      };
    });

    // Sort chronologically by date
    activityData.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return { 
      activityData // Already in chronological order
    };
  },
});

/**
 * Get detailed activity stats for the current user.
 * 
 * This provides additional statistics about user activity:
 * - Total active days
 * - Current streak (consecutive days active)
 * - Longest streak
 * - Most active day of week
 * - etc.
 */
export const getUserActivityStats = query({
  args: {},
  returns: v.union(
    v.object({
      totalActiveDays: v.number(),
      currentStreak: v.number(),
      longestStreak: v.number(),
      mostActiveDay: v.string(),
      totalSessions: v.number(),
      averageSessionsPerActiveDay: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx): Promise<ActivityStats | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Get activity data for the past year using ctx.db directly instead of runQuery
    const lookbackDays = 365;
    const now = Date.now();
    const startTime = now - lookbackDays * 24 * 60 * 60 * 1000;

    // Get all of the user's sessions (workspace accesses)
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gt(q.field("lastAccessTime"), startTime))
      .collect();

    // Group sessions by day
    const sessionsByDay = new Map<string, any[]>();
    sessions.forEach(session => {
      const date = new Date(session.lastAccessTime);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!sessionsByDay.has(dateKey)) {
        sessionsByDay.set(dateKey, []);
      }
      sessionsByDay.get(dateKey)?.push(session);
    });

    // Generate a complete list of dates for the lookback period
    const allDates: string[] = [];
    const today = new Date();
    // Start from January 1st of the current year
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const currentYear = today.getFullYear();
    
    // Calculate days from start of year until today
    const start = new Date(startOfYear);
    while (start <= today) {
      const dateKey = start.toISOString().split('T')[0];
      allDates.push(dateKey);
      start.setDate(start.getDate() + 1);
    }
    
    // Pad with future dates to complete the year if needed
    if (allDates.length < 365) {
      const end = new Date(currentYear, 11, 31); // December 31st
      const lastDate = new Date(allDates[allDates.length - 1]);
      const nextDay = new Date(lastDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      while (nextDay <= end) {
        const dateKey = nextDay.toISOString().split('T')[0];
        allDates.push(dateKey);
        nextDay.setDate(nextDay.getDate() + 1);
      }
    }

    // Create activity data for each day
    const activityData: ActivityDay[] = allDates.map(dateKey => {
      const sessionsForDay = sessionsByDay.get(dateKey) || [];
      
      let activityLevel = 0;
      if (sessionsForDay.length >= 10) {
        activityLevel = 4;
      } else if (sessionsForDay.length >= 5) {
        activityLevel = 3;
      } else if (sessionsForDay.length >= 2) {
        activityLevel = 2;
      } else if (sessionsForDay.length >= 1) {
        activityLevel = 1;
      }

      return {
        date: dateKey,
        count: sessionsForDay.length,
        level: activityLevel
      };
    }).reverse(); // Reverse to get most recent first
    
    // Calculate active days (days with any activity)
    const activeDaysCount = activityData.filter(day => day.level > 0).length;
    
    // Calculate current streak
    let currentStreakCount = 0;
    for (let i = 0; i < activityData.length; i++) {
      if (activityData[i].level > 0) {
        currentStreakCount++;
      } else {
        break;
      }
    }
    
    // Calculate longest streak
    let longestStreakCount = 0;
    let currentLongestStreak = 0;
    for (const day of activityData) {
      if (day.level > 0) {
        currentLongestStreak++;
        longestStreakCount = Math.max(longestStreakCount, currentLongestStreak);
      } else {
        currentLongestStreak = 0;
      }
    }
    
    // Calculate most active day of week
    const activityByDayOfWeek = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, ..., Sat
    
    activityData.forEach(day => {
      if (day.level > 0) {
        const date = new Date(day.date);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        activityByDayOfWeek[dayOfWeek] += day.count;
      }
    });
    
    const mostActiveDayIndex = activityByDayOfWeek.indexOf(Math.max(...activityByDayOfWeek));
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const mostActiveDay = dayNames[mostActiveDayIndex];
    
    const totalSessions = activityData.reduce((sum: number, day: ActivityDay) => sum + day.count, 0);
    
    return {
      totalActiveDays: activeDaysCount,
      currentStreak: currentStreakCount,
      longestStreak: longestStreakCount,
      mostActiveDay,
      totalSessions,
      averageSessionsPerActiveDay: activeDaysCount > 0 
        ? totalSessions / activeDaysCount
        : 0
    };
  },
}); 
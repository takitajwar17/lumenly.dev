import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

// Set up the cron jobs
const crons = cronJobs();

// Run the cleanup every 10 seconds with the action from scheduled.ts
crons.interval("cleanup inactive users", { seconds: 10 }, api.scheduled.default, {});

export default crons; 
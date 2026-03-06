import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
    "sync strava activities",
    { hours: 1 },
    internal.strava.syncAllAthletes
);

export default crons;

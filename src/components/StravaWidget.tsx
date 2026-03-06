import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";

const ACTIVITY_ICONS: Record<string, string> = {
    Run: "🏃",
    Ride: "🚴",
    Swim: "🏊",
    Walk: "🚶",
    Hike: "🥾",
};

function getIcon(type: string) {
    return ACTIVITY_ICONS[type] ?? "🏅";
}

function formatDistance(meters: number) {
    return (meters / 1609.344).toFixed(1) + " mi";
}

function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
        return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${m}:${String(s).padStart(2, "0")}`;
}

function formatRelativeTime(timestamp: number) {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hr${hours !== 1 ? "s" : ""} ago`;
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
}

function buildStravaAuthUrl() {
    const redirectUri = encodeURIComponent(window.location.origin + "/strava-callback");
    return `https://www.strava.com/oauth/authorize?client_id=149972&redirect_uri=${redirectUri}&response_type=code&scope=activity:read&approval_prompt=auto`;
}

export function StravaWidget() {
    const { user } = useUser();
    const activities = useQuery(api.strava.getRecentActivities);
    const connectionStatus = useQuery(api.strava.getMyConnectionStatus);
    const disconnect = useMutation(api.strava.disconnectStrava);

    const isLoading = activities === undefined || connectionStatus === undefined;

    return (
        <div className="strava-widget">
            <p className="strava-widget-title">STRAVA ACTIVITY</p>
            {isLoading ? (
                <p className="strava-widget-empty">Loading...</p>
            ) : (
                <>
                    {activities.length === 0 && connectionStatus === "none" && (
                        <p className="strava-widget-empty">No activity yet.</p>
                    )}
                    {activities.map((activity) => {
                        const isMe = user?.username === activity.username;
                        return (
                            <div key={activity._id} className="strava-activity-row">
                                <div className="strava-activity-header">
                                    <span className="strava-activity-username">@{activity.username}</span>
                                    {isMe && (
                                        <button
                                            className="strava-disconnect-btn"
                                            onClick={() => disconnect()}
                                        >
                                            Disconnect
                                        </button>
                                    )}
                                </div>
                                <div className="strava-activity-name">
                                    {getIcon(activity.type)} {activity.name}
                                </div>
                                <div className="strava-activity-stats">
                                    {formatDistance(activity.distanceMeters)} · {formatDuration(activity.movingTimeSecs)}
                                </div>
                                {(activity.locationCity || activity.locationState) && (
                                    <div className="strava-activity-location">
                                        📍 {[activity.locationCity, activity.locationState].filter(Boolean).join(", ")}
                                    </div>
                                )}
                                <div className="strava-activity-time">
                                    {formatRelativeTime(activity.startDate)}
                                </div>
                            </div>
                        );
                    })}

                    {connectionStatus === "none" && (
                        <a className="strava-connect-btn" href={buildStravaAuthUrl()}>
                            Connect your Strava
                        </a>
                    )}
                    {connectionStatus === "invalid" && (
                        <a className="strava-connect-btn" href={buildStravaAuthUrl()}>
                            Reconnect Strava
                        </a>
                    )}
                </>
            )}
            <p className="strava-osm-attribution">© OpenStreetMap contributors</p>
        </div>
    );
}

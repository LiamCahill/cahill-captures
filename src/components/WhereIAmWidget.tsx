import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";

type Duration = "week" | "weekend" | "2d" | "3d" | "5d" | "custom";

const DURATION_LABELS: Record<string, string> = {
    week: "this week",
    weekend: "this weekend",
    "2d": "2 days",
    "3d": "3 days",
    "5d": "5 days",
    custom: "Custom...",
};

function daysLeft(expiresAt: number): number {
    return Math.ceil((expiresAt - Date.now()) / 86_400_000);
}

export function WhereIAmWidget() {
    const { user } = useUser();
    const statuses = useQuery(api.locationStatus.getLocationStatuses);
    const myStatus = useQuery(api.locationStatus.getMyLocationStatus);

    const setHomeCity = useMutation(api.locationStatus.setHomeCity);
    const setTravelStatus = useMutation(api.locationStatus.setTravelStatus);
    const clearTravel = useMutation(api.locationStatus.clearTravelStatus);

    const [homeInput, setHomeInput] = useState("");
    const [homeError, setHomeError] = useState("");
    const [editingHome, setEditingHome] = useState(false);

    const [location, setLocation] = useState("");
    const [duration, setDuration] = useState<Duration>("week");
    const [customDays, setCustomDays] = useState(2);
    const [travelError, setTravelError] = useState("");

    const username = user?.username ?? "";

    async function handleSetHome(e: React.FormEvent) {
        e.preventDefault();
        setHomeError("");
        try {
            await setHomeCity({ homeLocation: homeInput });
            setHomeInput("");
            setEditingHome(false);
        } catch {
            setHomeError("Home city cannot be empty.");
        }
    }

    async function handleSetTravel(e: React.FormEvent) {
        e.preventDefault();
        setTravelError("");
        if (!location.trim()) {
            setTravelError("Please enter a location.");
            return;
        }
        if (duration === "custom" && (customDays < 1 || customDays > 30)) {
            setTravelError("Custom duration must be between 1 and 30 days.");
            return;
        }
        try {
            await setTravelStatus({
                travelLocation: location,
                duration,
                customDays: duration === "custom" ? customDays : undefined,
            });
            setLocation("");
            setTravelError("");
        } catch (err: unknown) {
            setTravelError(err instanceof Error ? err.message : "Failed to save.");
        }
    }

    const isLoading = statuses === undefined || myStatus === undefined;
    const hasHome = myStatus !== null && myStatus !== undefined;
    const isActiveTraveling =
        hasHome &&
        myStatus.travelLocation !== undefined &&
        myStatus.expiresAt !== undefined &&
        myStatus.expiresAt > Date.now();

    // Sort: current user first, then others
    const sorted = statuses
        ? [...statuses].sort((a, b) => {
              if (a.username === username) return -1;
              if (b.username === username) return 1;
              return 0;
          })
        : [];

    return (
        <div className="where-i-am-widget">
            <p className="where-i-am-title">WHERE I AM</p>

            {isLoading ? (
                <p className="where-i-am-empty">Loading...</p>
            ) : (
                <>
                    {/* First-time setup */}
                    {!hasHome && (
                        <div className="where-i-am-setup">
                            <p className="where-i-am-setup-prompt">
                                Set your home city to join the board.
                            </p>
                            <form onSubmit={handleSetHome} className="where-i-am-home-form">
                                <input
                                    className="where-i-am-input"
                                    type="text"
                                    placeholder="e.g. Boulder, CO"
                                    value={homeInput}
                                    onChange={(e) => setHomeInput(e.target.value)}
                                />
                                <button className="where-i-am-save-btn" type="submit">
                                    Save
                                </button>
                            </form>
                            {homeError && <p className="where-i-am-error">{homeError}</p>}
                        </div>
                    )}

                    {/* Status list */}
                    {sorted.map((row) => {
                        const isMe = row.username === username;
                        const traveling =
                            row.travelLocation !== undefined &&
                            row.expiresAt !== undefined;
                        const days = traveling ? daysLeft(row.expiresAt!) : 0;

                        return (
                            <div key={row._id} className="where-i-am-row">
                                <div className="where-i-am-row-header">
                                    <span className="where-i-am-username">@{row.username}</span>
                                    {isMe && traveling && (
                                        <button
                                            className="where-i-am-action-link"
                                            onClick={() => clearTravel()}
                                        >
                                            Clear
                                        </button>
                                    )}
                                    {isMe && !traveling && hasHome && !editingHome && (
                                        <button
                                            className="where-i-am-action-link"
                                            onClick={() => {
                                                setEditingHome(true);
                                                setHomeInput(myStatus?.homeLocation ?? "");
                                            }}
                                        >
                                            Edit home
                                        </button>
                                    )}
                                </div>

                                {/* Edit home inline */}
                                {isMe && editingHome && (
                                    <form onSubmit={handleSetHome} className="where-i-am-home-form">
                                        <input
                                            className="where-i-am-input"
                                            type="text"
                                            value={homeInput}
                                            onChange={(e) => setHomeInput(e.target.value)}
                                            autoFocus
                                        />
                                        <button className="where-i-am-save-btn" type="submit">
                                            Save
                                        </button>
                                        <button
                                            className="where-i-am-action-link"
                                            type="button"
                                            onClick={() => setEditingHome(false)}
                                        >
                                            Cancel
                                        </button>
                                    </form>
                                )}

                                {/* Status line */}
                                {!editingHome && (
                                    <p className="where-i-am-status">
                                        {traveling
                                            ? `📍 ${row.travelLocation} · ${days} day${days !== 1 ? "s" : ""} left`
                                            : `🏠 Back in ${row.homeLocation}`}
                                    </p>
                                )}

                                {/* Travel form for current user */}
                                {isMe && !editingHome && (
                                    <form onSubmit={handleSetTravel} className="where-i-am-travel-form">
                                        <span className="where-i-am-form-label">
                                            {isActiveTraveling ? "Update status" : "Set travel status"}
                                        </span>
                                        <div className="where-i-am-sentence">
                                            <span className="where-i-am-sentence-text">
                                                {username} will be in
                                            </span>
                                            <input
                                                className="where-i-am-location-input"
                                                type="text"
                                                placeholder="location"
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                            />
                                            <span className="where-i-am-sentence-text">for</span>
                                            <select
                                                className="where-i-am-select"
                                                value={duration}
                                                onChange={(e) =>
                                                    setDuration(e.target.value as Duration)
                                                }
                                            >
                                                {Object.entries(DURATION_LABELS).map(
                                                    ([val, label]) => (
                                                        <option key={val} value={val}>
                                                            {label}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                            {duration === "custom" && (
                                                <>
                                                    <input
                                                        className="where-i-am-days-input"
                                                        type="number"
                                                        min={1}
                                                        max={30}
                                                        value={customDays}
                                                        onChange={(e) =>
                                                            setCustomDays(Number(e.target.value))
                                                        }
                                                    />
                                                    <span className="where-i-am-sentence-text">
                                                        days
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        {travelError && (
                                            <p className="where-i-am-error">{travelError}</p>
                                        )}
                                        <button className="where-i-am-save-btn" type="submit">
                                            {isActiveTraveling ? "Update" : "Set status"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
}

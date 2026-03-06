import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import {api} from "../../convex/_generated/api"
import PostCard from "./PostCard";
import { TopSpacesWidget } from "./TopSpacesWidget"
import { NewestUsersWidget } from "./NewestUsersWidget";
import { StravaWidget } from "./StravaWidget";
import { WhereIAmWidget } from "./WhereIAmWidget";
import "../styles/Feed.css"

function ProfileWidget() {
    const { user } = useUser();
    if (!user?.username) return null;
    return (
        <div className="profile-widget">
            <p className="profile-widget-name">u/{user.username}</p>
            <Link to={`/u/${user.username}`} className="profile-widget-link">
                View Profile
            </Link>
        </div>
    );
}

function AuthenticatedFeed({ topPosts }: { topPosts: NonNullable<ReturnType<typeof useQuery<typeof api.leaderboard.getTopPosts>>> }) {
    return (
        <div className="homepage-grid homepage-grid-auth">
            <aside className="homepage-left-panel">
                <WhereIAmWidget />
            </aside>
            <div className="homepage-main">
                <div className="feed-container">
                    <h2 className="section-title">Trending Today</h2>
                    <div className="posts-list">
                        {topPosts.map((post) => (
                            <PostCard key={post._id} post={post} showSubreddit={true} />
                        ))}
                    </div>
                </div>
            </div>
            <aside className="homepage-sidebar">
                <ProfileWidget />
                <TopSpacesWidget />
                <NewestUsersWidget />
                <StravaWidget />
            </aside>
        </div>
    );
}

function UnauthenticatedFeed({ topPosts }: { topPosts: NonNullable<ReturnType<typeof useQuery<typeof api.leaderboard.getTopPosts>>> }) {
    return (
        <div className="homepage-grid">
            <div className="homepage-main">
                <div className="feed-container">
                    <h2 className="section-title">Trending Today</h2>
                    <div className="posts-list">
                        {topPosts.map((post) => (
                            <PostCard key={post._id} post={post} showSubreddit={true} />
                        ))}
                    </div>
                </div>
            </div>
            <aside className="homepage-sidebar">
                <TopSpacesWidget />
                <NewestUsersWidget />
            </aside>
        </div>
    );
}

export function Feed() {
    const topPosts = useQuery(api.leaderboard.getTopPosts, {limit: 10})
    const { isSignedIn } = useUser();

    if (!topPosts) {
        return <div className="homepage-grid"><div className="homepage-main">Loading...</div></div>
    }
    return isSignedIn
        ? <AuthenticatedFeed topPosts={topPosts} />
        : <UnauthenticatedFeed topPosts={topPosts} />;
}

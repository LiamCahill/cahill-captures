import { useQuery, Authenticated } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import {api} from "../../convex/_generated/api"
import PostCard from "./PostCard";
import { TopSubredditsWidget } from "./TopSubredditsWidget"
import { NewestUsersWidget } from "./NewestUsersWidget";
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

export function Feed() {
    const topPosts = useQuery(api.leaderboard.getTopPosts, {limit: 10})

    if (!topPosts) {
        return <div className="homepage-grid"><div className="homepage-main">Loading...</div></div>
    }
    return (
        <div className="homepage-grid">
            <div className="homepage-main">
                <div className="feed-container">
                    <h2 className="section-title">Trending Today</h2>
                    <div className="post-list">
                        {topPosts.map((post) => (
                            <PostCard key={post._id} post={post} showSubreddit={true} />
                        ))}
                    </div>
                </div>
            </div>
            <aside className="homepage-sidebar">
                <Authenticated>
                    <ProfileWidget />
                </Authenticated>
                <TopSubredditsWidget />
                <NewestUsersWidget />
            </aside>
        </div>
    );
}

import { useQuery } from "convex/react"
import { Link } from "react-router-dom"
import { api } from "../../convex/_generated/api"
import "../styles/Feed.css"

export function TopSubredditsWidget() {
    const subreddits = useQuery(api.leaderboard.getTopSubredditsToday)

    if (!subreddits || subreddits.length === 0) return null

    return (
        <div className="top-subreddits-widget">
            <h3 className="top-subreddits-title">Top Communities Today</h3>
            <ol className="top-subreddits-list">
                {subreddits.map((item, index) => (
                    <li key={item.name} className="top-subreddits-row">
                        <Link to={`/r/${item.name}`} className="top-subreddits-link">
                            <span className="top-subreddits-rank">{index + 1}</span>
                            <span className="top-subreddits-name">r/{item.name}</span>
                            <span className="top-subreddits-count">
                                {item.postCount} {item.postCount === 1 ? "post" : "posts"}
                            </span>
                        </Link>
                    </li>
                ))}
            </ol>
        </div>
    )
}

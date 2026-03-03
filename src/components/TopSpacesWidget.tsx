import { useQuery } from "convex/react"
import { Link } from "react-router-dom"
import { api } from "../../convex/_generated/api"
import "../styles/Feed.css"

export function TopSpacesWidget() {
    const spaces = useQuery(api.leaderboard.getTopSpacesToday)

    if (!spaces || spaces.length === 0) return null

    return (
        <div className="top-spaces-widget">
            <h3 className="top-spaces-title">Top Communities Today</h3>
            <ol className="top-spaces-list">
                {spaces.map((item, index) => (
                    <li key={item.name} className="top-spaces-row">
                        <Link to={`/c/${item.name}`} className="top-spaces-link">
                            <span className="top-spaces-rank">{index + 1}</span>
                            <span className="top-spaces-name">c/{item.name}</span>
                            <span className="top-spaces-count">
                                {item.postCount} {item.postCount === 1 ? "post" : "posts"}
                            </span>
                        </Link>
                    </li>
                ))}
            </ol>
        </div>
    )
}

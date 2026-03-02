import { useQuery } from "convex/react"
import { Link } from "react-router-dom"
import { api } from "../../convex/_generated/api"
import "../styles/Feed.css"

export function NewestUsersWidget() {
    const users = useQuery(api.users.getNewestUsers)

    if (!users || users.length === 0) return null

    return (
        <div className="top-subreddits-widget">
            <h3 className="top-subreddits-title">Newest Members</h3>
            <ul className="top-subreddits-list">
                {users.map((user) => (
                    <li key={user.username} className="top-subreddits-row">
                        <Link to={`/u/${user.username}`} className="top-subreddits-link">
                            <span className="top-subreddits-name">u/{user.username}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}

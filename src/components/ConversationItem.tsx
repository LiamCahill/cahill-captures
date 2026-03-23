import { useNavigate } from "react-router-dom"
import { Id } from "../../convex/_generated/dataModel"

interface ConversationItemProps {
    otherUser: { _id: Id<"users">; username: string }
    lastMessage: string
    lastMessageTime: number
    unreadCount: number
}

function relativeTime(ts: number): string {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d`
    return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" })
}

const ConversationItem = ({ otherUser, lastMessage, lastMessageTime, unreadCount }: ConversationItemProps) => {
    const navigate = useNavigate()
    const initial = otherUser.username.charAt(0).toUpperCase()

    return (
        <div className="conversation-item" onClick={() => navigate(`/messages/${otherUser._id}`)}>
            <div className="conversation-avatar">{initial}</div>
            <div className="conversation-info">
                <div className="conversation-header">
                    <span className="conversation-username">u/{otherUser.username}</span>
                    <span className="conversation-time">{relativeTime(lastMessageTime)}</span>
                </div>
                <div className="conversation-preview">{lastMessage}</div>
            </div>
            {unreadCount > 0 && (
                <span className="conversation-unread">{unreadCount}</span>
            )}
        </div>
    )
}

export default ConversationItem

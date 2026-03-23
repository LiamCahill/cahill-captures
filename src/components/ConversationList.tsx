import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import ConversationItem from "./ConversationItem"

const ConversationList = () => {
    const conversations = useQuery(api.dm.getConversations)

    if (conversations === undefined) {
        return <div className="messages-empty"><p>Loading…</p></div>
    }

    if (conversations.length === 0) {
        return (
            <div className="messages-empty">
                <p>No conversations yet. Send someone a message from their profile!</p>
            </div>
        )
    }

    return (
        <div className="conversation-list">
            {conversations.map((convo) => (
                <ConversationItem
                    key={convo._id}
                    otherUser={convo.otherUser}
                    lastMessage={convo.lastMessage}
                    lastMessageTime={convo.lastMessageTime}
                    unreadCount={convo.unreadCount}
                />
            ))}
        </div>
    )
}

export default ConversationList

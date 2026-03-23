import { useEffect, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { useNavigate } from "react-router-dom"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import MessageBubble from "./MessageBubble"
import MessageInput from "./MessageInput"
import { FaArrowLeft } from "react-icons/fa"
import "../styles/MessageThread.css"

interface MessageThreadProps {
    otherUserId: Id<"users">
    otherUsername: string
}

const MessageThread = ({ otherUserId, otherUsername }: MessageThreadProps) => {
    const navigate = useNavigate()
    const messages = useQuery(api.dm.getConversation, { otherUserId })
    const sendMessage = useMutation(api.dm.sendMessage)
    const markRead = useMutation(api.dm.markConversationAsRead)
    const bottomRef = useRef<HTMLDivElement>(null)

    // Mark as read and scroll to bottom when messages load/update
    useEffect(() => {
        if (messages && messages.length > 0) {
            markRead({ otherUserId }).catch(console.error)
        }
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages?.length])

    const handleSend = async (content: string) => {
        await sendMessage({ recipientUserId: otherUserId, content })
    }

    if (messages === undefined) {
        return <div className="thread-loading">Loading…</div>
    }

    return (
        <>
            <div className="thread-header">
                <span className="thread-back" onClick={() => navigate("/messages")}>
                    <FaArrowLeft />
                </span>
                <a className="thread-username" href={`/u/${otherUsername}`}>
                    u/{otherUsername}
                </a>
            </div>

            <div className="message-list">
                {messages.length === 0 && (
                    <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px", fontSize: "14px" }}>
                        No messages yet. Say hello!
                    </div>
                )}
                {messages.map((msg) => (
                    <MessageBubble
                        key={msg._id}
                        content={msg.content}
                        isOwn={msg.isOwn}
                        creationTime={msg._creationTime}
                    />
                ))}
                <div ref={bottomRef} />
            </div>

            <MessageInput onSend={handleSend} />
        </>
    )
}

export default MessageThread

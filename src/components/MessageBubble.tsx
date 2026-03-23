interface MessageBubbleProps {
    content: string
    isOwn: boolean
    creationTime: number
}

function formatTime(ts: number): string {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const MessageBubble = ({ content, isOwn, creationTime }: MessageBubbleProps) => (
    <div className={`message-bubble-wrap ${isOwn ? "own" : "received"}`}>
        <div className={`message-bubble ${isOwn ? "own" : "received"}`}>
            {content}
            <span className="message-time">{formatTime(creationTime)}</span>
        </div>
    </div>
)

export default MessageBubble

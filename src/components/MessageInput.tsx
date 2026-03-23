import { useState, useRef } from "react"

interface MessageInputProps {
    onSend: (content: string) => Promise<void>
    disabled?: boolean
}

const MessageInput = ({ onSend, disabled }: MessageInputProps) => {
    const [value, setValue] = useState("")
    const [sending, setSending] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const canSend = value.trim().length > 0 && !sending && !disabled

    const handleSend = async () => {
        if (!canSend) return
        const content = value.trim()
        setValue("")
        setSending(true)
        try {
            await onSend(content)
        } finally {
            setSending(false)
            textareaRef.current?.focus()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="message-input-bar">
            <textarea
                ref={textareaRef}
                className="message-input"
                placeholder="Send a message…"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                autoFocus
            />
            <button
                className="message-send-button"
                onClick={handleSend}
                disabled={!canSend}
            >
                Send
            </button>
        </div>
    )
}

export default MessageInput

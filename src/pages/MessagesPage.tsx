import { useParams } from "react-router-dom"
import { useQuery, Authenticated, Unauthenticated } from "convex/react"
import { SignInButton } from "@clerk/clerk-react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import ConversationList from "../components/ConversationList"
import MessageThread from "../components/MessageThread"
import "../styles/MessagesPage.css"
import "../styles/MessageThread.css"

const MessagesPage = () => {
    const { userId } = useParams<{ userId?: string }>()

    return (
        <>
            <Unauthenticated>
                <div className="messages-page">
                    <div className="messages-sign-in">
                        <p>Sign in to view your messages.</p>
                        <SignInButton mode="modal">
                            <button className="submit-button">Sign In</button>
                        </SignInButton>
                    </div>
                </div>
            </Unauthenticated>
            <Authenticated>
                {userId ? (
                    <ThreadView userId={userId} />
                ) : (
                    <div className="messages-page">
                        <h1>Messages</h1>
                        <ConversationList />
                    </div>
                )}
            </Authenticated>
        </>
    )
}

function ThreadView({ userId }: { userId: string }) {
    const user = useQuery(api.dm.getUserInfo, { userId: userId as Id<"users"> })

    if (user === undefined) {
        return <div className="messages-page"><div className="thread-loading">Loading…</div></div>
    }

    if (user === null) {
        return (
            <div className="messages-page">
                <div className="thread-not-found">User not found.</div>
            </div>
        )
    }

    return (
        <div className="message-thread-page">
            <MessageThread
                otherUserId={userId as Id<"users">}
                otherUsername={user.username}
            />
        </div>
    )
}

export default MessagesPage

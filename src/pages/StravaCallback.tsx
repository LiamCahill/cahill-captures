import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function StravaCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const exchangeCode = useAction(api.strava.exchangeCodeForTokens);
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error || !code) {
            navigate("/", { replace: true });
            return;
        }

        exchangeCode({ code })
            .then(() => navigate("/", { replace: true }))
            .catch((err) => {
                console.error("Strava auth error:", err);
                navigate("/", { replace: true });
            });
    }, []);

    return (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-primary)" }}>
            <p>Connecting to Strava...</p>
        </div>
    );
}

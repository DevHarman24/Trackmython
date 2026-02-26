"use client";

import { useState } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function ScanButton() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useNextRouter();

    const handleScan = async () => {
        if (!user) {
            setMessage("❌ Please sign in to scan");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/scan", {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (data.success) {
                const total = data.hackathons || 0;
                const newCount = data.new || 0;
                const missing = data.missingTeams || 0;

                if (newCount > 0) {
                    setMessage(`✅ Found ${total} hackathons! Sent ${newCount} new alerts.`);
                } else if (total > 0) {
                    setMessage(`✅ Found ${total} hackathons (${missing} incomplete). No new alerts.`);
                } else {
                    setMessage(`✅ Scan Complete! Found 0 hackathons in your account.`);
                }
                router.refresh(); // Refresh server components to update stats
            } else {
                setMessage(`❌ Scan Failed: ${data.error}`);
            }
        } catch (err) {
            setMessage("❌ Error running scan");
            console.error(err);
        } finally {
            setLoading(false);
            // Clear message after 5 seconds
            setTimeout(() => setMessage(""), 5000);
        }
    };

    return (
        <div className="w-full">
            <button
                onClick={handleScan}
                disabled={loading}
                className={`
                    px-6 py-4 rounded-xl font-black uppercase tracking-widest text-xs w-full transition-all
                    ${loading
                        ? "bg-zinc-200 cursor-wait opacity-70 text-zinc-500"
                        : "bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-lg shadow-indigo-500/20"
                    }
                `}
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Scanning...
                    </span>
                ) : (
                    "🚀 Scan Now"
                )}
            </button>

            {message && (
                <div className={`text-sm font-medium ${message.includes("❌") ? "text-red-600" : "text-emerald-600"} animate-in fade-in slide-in-from-top-2 duration-300 mt-2`}>
                    {message}
                </div>
            )}
        </div>
    );
}

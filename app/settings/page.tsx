"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiUrl } from "@/lib/api-base";
import CityAutocomplete from "@/components/CityAutocomplete";
import Navbar from "@/components/Navbar";

export default function SettingsPage() {
    const { user, loading, signInWithGoogle, signOut } = useAuth();
    const [userLocation, setUserLocation] = useState("");
    const [nearbyLocations, setNearbyLocations] = useState<string[]>([]);
    const [dmNotifications, setDmNotifications] = useState(true);

    const [discordId, setDiscordId] = useState<string | null>(null);
    const [discordUsername, setDiscordUsername] = useState<string | null>(null);
    const [unlinking, setUnlinking] = useState(false);

    const [saved, setSaved] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(true);

    useEffect(() => {
        if (user) {
            loadSettings();
        }
    }, [user]);

    const loadSettings = async () => {
        try {
            const token = await user?.getIdToken();
            const response = await fetch(apiUrl("/api/settings"), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUserLocation(data.userLocation || "");
                setNearbyLocations(data.nearbyLocations || []);
                setDiscordId(data.discordId || null);
                setDiscordUsername(data.discordUsername || null);
                setDmNotifications(data.dmNotifications !== false);
            }
        } catch (error) {
            console.error("Error loading settings:", error);
        } finally {
            setLoadingSettings(false);
        }
    };

    const handleSave = async () => {
        try {
            const token = await user?.getIdToken();
            const response = await fetch(apiUrl("/api/settings"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    userLocation,
                    dmNotifications,
                }),
            });

            if (response.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                alert("Failed to save settings");
            }
        } catch (error) {
            alert("Error saving settings");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="flex items-center justify-center px-4 pt-24">
                    <div className="max-w-sm w-full glass-panel p-8 text-center">
                        <h2 className="text-xl font-bold text-zinc-900 mb-3">Sign In Required</h2>
                        <p className="text-sm text-zinc-500 mb-6">
                            Sign in to manage your settings and hackathon notifications.
                        </p>
                        <button
                            onClick={signInWithGoogle}
                            className="btn-gradient w-full py-3 text-sm"
                        >
                            Sign in with Google
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Navbar />

            <main className="max-w-2xl mx-auto px-4 md:px-6 py-8" style={{ position: 'relative', zIndex: 1 }}>
                <div className="mb-8">
                    <p className="section-label mb-2">Account</p>
                    <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-1">Settings</h1>
                    <p className="text-sm text-zinc-500">Manage your location, notifications, and Discord connection.</p>
                </div>

                {loadingSettings ? (
                    <div className="text-center py-12 text-sm text-zinc-500">Loading your settings...</div>
                ) : (
                    <div className="space-y-5">

                        {/* Location */}
                        <div className="glass-panel p-5">
                            <label className="block text-sm font-semibold text-zinc-900 mb-1">
                                📍 Your Location
                            </label>
                            <p className="text-xs text-zinc-500 mb-4">
                                Enter your city to discover nearby hackathons.
                            </p>
                            <CityAutocomplete
                                value={userLocation}
                                onChange={setUserLocation}
                                placeholder="e.g. Faridabad, Kolkata, Mumbai..."
                                variant="glass"
                                className="glass-input"
                                wrapperClassName="w-full"
                            />
                            {nearbyLocations.length > 0 && (
                                <div className="mt-4">
                                    <div className="section-label mb-2">Nearby areas monitored</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {nearbyLocations.map((loc, i) => (
                                            <span key={i} className="badge"
                                                style={{ background: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.2)', color: '#8b5cf6' }}>
                                                {loc}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Discord */}
                        <div className="glass-panel p-5">
                            <div className="text-sm font-semibold text-zinc-900 mb-1">🔗 Discord Integration</div>
                            <p className="text-xs text-zinc-500 mb-5">
                                Link your Discord for DM notifications about deadlines.
                            </p>

                            {/* Toggle */}
                            <div className="flex items-center justify-between gap-4 mb-5 pb-5 border-b border-zinc-200">
                                <div>
                                    <div className="text-sm font-medium text-zinc-900">DM Notifications</div>
                                    <div className="text-xs text-zinc-500">Reminders at 24h, 12h, 6h, and 2h before deadlines</div>
                                </div>
                                <button
                                    onClick={() => setDmNotifications(!dmNotifications)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dmNotifications ? 'bg-indigo-500' : 'bg-zinc-300'
                                        }`}
                                >
                                    <span
                                        className={`${dmNotifications ? 'translate-x-6' : 'translate-x-1'
                                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                    />
                                </button>
                            </div>

                            {discordId ? (
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-[#5865F2] flex items-center justify-center text-white shrink-0">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-medium text-sm text-zinc-900 truncate">
                                                @{discordUsername || discordId}
                                            </div>
                                            <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                Connected
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            const confirmed = window.confirm(
                                                'Are you sure you want to unlink your Discord account?\n\nYou will stop receiving DM notifications.'
                                            );
                                            if (!confirmed) return;

                                            setUnlinking(true);
                                            try {
                                                const token = await user?.getIdToken();
                                                const res = await fetch(apiUrl('/api/unlink-discord'), {
                                                    method: 'POST',
                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                    setDiscordId(null);
                                                    setDiscordUsername(null);
                                                } else {
                                                    alert('Failed to unlink: ' + (data.error || 'Unknown error'));
                                                }
                                            } catch {
                                                alert('Network error while unlinking');
                                            } finally {
                                                setUnlinking(false);
                                            }
                                        }}
                                        disabled={unlinking}
                                        className="text-xs py-2 px-4 rounded-lg bg-red-50 text-red-600 border border-red-200 font-medium hover:bg-red-100 transition-all disabled:opacity-50 text-center"
                                    >
                                        {unlinking ? 'Unlinking...' : 'Unlink'}
                                    </button>
                                </div>
                            ) : (
                                <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-4">
                                    <div className="text-xs text-zinc-700 mb-2.5">To link your Discord:</div>
                                    <ol className="text-xs text-zinc-500 space-y-1.5 list-decimal list-inside">
                                        <li>Join the <a href="https://discord.gg/23HxCVyuUK" target="_blank" rel="noopener noreferrer" className="text-[#5865F2] font-medium hover:underline">Trackmython</a> Discord server</li>
                                        <li>Run the <code className="bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-[11px]">/link</code> command</li>
                                        <li>Click the link the bot sends you</li>
                                    </ol>
                                </div>
                            )}
                        </div>

                        {/* Danger Zone */}
                        <div className="rounded-2xl p-5 border border-red-200 bg-red-50/50">
                            <div className="text-sm font-semibold text-red-600 mb-1">Reset Data</div>
                            <p className="text-xs text-zinc-500 mb-4">
                                Delete all discovered hackathons and cached data. <span className="text-red-600/80">This cannot be undone.</span>
                            </p>
                            <button
                                onClick={async () => {
                                    const input = window.prompt(
                                        'This will permanently delete ALL your discovered hackathons and cached data.\n\nType DELETE to confirm:'
                                    );
                                    if (input !== 'DELETE') {
                                        if (input !== null) alert('Reset cancelled — you must type DELETE exactly.');
                                        return;
                                    }

                                    try {
                                        const token = await user?.getIdToken();
                                        const response = await fetch(apiUrl('/api/clear-discovered'), {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        });
                                        const data = await response.json();
                                        if (data.success) {
                                            alert(`Data reset complete! Deleted ${data.deletedCount} items.`);
                                        } else {
                                            alert('Failed to reset data.');
                                        }
                                    } catch (error) {
                                        alert('Network error while resetting data');
                                    }
                                }}
                                className="text-xs py-2 px-4 rounded-lg bg-red-50 text-red-600 border border-red-200 font-medium hover:bg-red-100 transition-all"
                            >
                                Reset All Data
                            </button>
                        </div>

                        {/* Save */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSave}
                                className={`btn-gradient w-full sm:w-auto min-w-[180px] py-3 text-sm ${saved ? '!bg-emerald-600' : ''}`}
                            >
                                {saved ? "✓ Saved!" : "Save Settings"}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

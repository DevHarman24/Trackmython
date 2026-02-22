'use client';

import { Fragment, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { apiUrl } from '@/lib/api-base';
import { useRouter } from 'next/navigation';
import { formatLocation } from '@/lib/cities';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

/* ── helpers ── */
function safe(v: any): string {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (typeof v === 'object') {
        if ('min' in v && 'max' in v) return `${v.min}–${v.max}`;
        if ('min' in v) return `${v.min}+`;
        if ('max' in v) return `Up to ${v.max}`;
        if (Array.isArray(v)) return v.join(', ');
        return JSON.stringify(v);
    }
    return String(v);
}

function daysUntil(dateStr: string) {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function fmtDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function fmtDateFull(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Countdown({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculate = () => {
            const now = new Date().getTime();
            const tgt = new Date(targetDate).getTime();
            const diff = tgt - now;

            if (diff <= 0) {
                setTimeLeft('Ended');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) setTimeLeft(`${days}d ${hours}h left`);
            else setTimeLeft(`${hours}h ${minutes}m left`);
        };

        calculate();
        const interval = setInterval(calculate, 60000);
        return () => clearInterval(interval);
    }, [targetDate]);

    return <span>{timeLeft}</span>;
}

export default function UserDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [hacks, setHacks] = useState<any[]>([]);
    const [busy, setBusy] = useState(true);
    const [err, setErr] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);
    const [untractingIds, setUntractingIds] = useState<Set<string>>(new Set());
    const [discordLinked, setDiscordLinked] = useState<boolean | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchHacks();
            fetchDiscordStatus();
        }
    }, [user]);

    async function fetchDiscordStatus() {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(apiUrl('/api/settings'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDiscordLinked(!!data.discordLinked);
            }
        } catch (e) {
            // Non-critical — just won't show the banner
        }
    }

    async function fetchHacks() {
        if (!user) return;
        setBusy(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(apiUrl('/api/hackathons'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch hackathons');
            const data = await res.json();
            const tracked = (data.hackathons || []).filter((h: any) => h.isTracked !== false);
            setHacks(tracked);
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setBusy(false);
        }
    }

    async function untrack(hackathonId: string) {
        if (!user) return;
        setUntractingIds(prev => new Set(prev).add(hackathonId));
        try {
            const token = await user.getIdToken();
            const res = await fetch(apiUrl('/api/hackathons/toggle-global'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ hackathonId, isTracked: false })
            });
            if (res.ok) {
                setHacks(prev => prev.filter(h => h.id !== hackathonId));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUntractingIds(prev => { const n = new Set(prev); n.delete(hackathonId); return n; });
        }
    }

    if (loading || (!user && busy)) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!user) return null;

    const upcoming = hacks.filter(h => h.deadline && daysUntil(h.deadline) >= 0);
    const urgentCount = upcoming.filter(h => daysUntil(h.deadline!) <= 3).length;

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 relative">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <p className="section-label mb-2">Dashboard</p>
                        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-1">Tracked Events</h1>
                        <p className="text-sm text-zinc-500">Manage your active event reminders.</p>
                    </div>
                    <Link href="/discover" className="btn-gradient text-xs py-2.5 px-5 w-full sm:w-auto text-center">
                        + Track New
                    </Link>
                </div>

                {/* Discord linking banner */}
                {discordLinked === false && (
                    <div className="mb-6 rounded-xl p-4 border border-indigo-200 bg-indigo-50">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-zinc-900 mb-1">🔔 Link Discord for deadline reminders</p>
                                <p className="text-xs text-zinc-500">
                                    Get automated DM notifications before your hackathon deadlines.
                                </p>
                                <ol className="text-xs text-zinc-500 mt-2 space-y-0.5 list-decimal list-inside">
                                    <li>Join the <a href="https://discord.gg/ftfCQanHn" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-medium hover:underline">Trackmython</a> Discord server</li>
                                    <li>Run the <code className="bg-white border border-indigo-200 px-1 py-0.5 rounded text-indigo-700 font-mono text-[10px]">/link</code> command</li>
                                    <li>Click the link the bot sends you</li>
                                </ol>
                            </div>
                            <a
                                href="https://discord.gg/ftfCQanHn"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-gradient text-xs py-2.5 px-5 text-center whitespace-nowrap"
                            >
                                Join Discord
                            </a>
                        </div>
                    </div>
                )}

                {/* Stat cards */}
                {!busy && hacks.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                        <div className="stat-card">
                            <p className="section-label mb-1">Tracking</p>
                            <p className="text-xl font-bold text-zinc-900">{hacks.length}</p>
                        </div>
                        <div className="stat-card">
                            <p className="section-label mb-1">Upcoming</p>
                            <p className="text-xl font-bold text-zinc-900">{upcoming.length}</p>
                        </div>
                        <div className="stat-card hidden sm:block">
                            <p className="section-label mb-1">Ending Soon</p>
                            <p className={`text-xl font-bold ${urgentCount > 0 ? 'text-amber-500' : 'text-zinc-900'}`}>{urgentCount}</p>
                        </div>
                    </div>
                )}

                {busy ? (
                    <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : err ? (
                    <div className="text-center py-12">
                        <p className="text-red-500 text-sm font-medium">{err}</p>
                        <button onClick={fetchHacks} className="mt-2 text-xs text-indigo-600 hover:underline">Retry</button>
                    </div>
                ) : hacks.length === 0 ? (
                    <div className="text-center py-16 glass-panel">
                        <p className="text-zinc-500 text-sm mb-2">You aren't tracking any hackathons yet.</p>
                        <Link href="/discover" className="text-indigo-600 text-xs hover:underline">Browse events to track</Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {hacks.map((h) => {
                            const days = h.deadline ? daysUntil(h.deadline) : null;
                            const isOpen = expanded === h.id;
                            const reminders = h.remindersSent || {};

                            return (
                                <div key={h.id} className={`rounded-xl border transition-all ${isOpen
                                    ? 'border-indigo-500/30 bg-indigo-50/30'
                                    : 'border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300'}`}>

                                    {/* Main Row */}
                                    <div className="flex items-center gap-4 px-4 py-4 cursor-pointer"
                                        onClick={() => setExpanded(isOpen ? null : h.id)}>

                                        <div className={`w-2 h-2 rounded-full shrink-0 ${days != null && days <= 3
                                            ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                            : 'bg-indigo-500'}`} />

                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm text-zinc-900 truncate">{h.title}</div>
                                            <div className="text-xs text-zinc-500 truncate mt-0.5">
                                                {h.organisation || 'Unknown Org'} · <Link
                                                    href={`/discover?region=${encodeURIComponent(formatLocation(h.city || h.location, h.state).split(',')[0])}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="hover:underline hover:text-indigo-600 transition-colors"
                                                >
                                                    {formatLocation(h.city || h.location, h.state)}
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Reminder pills — desktop */}
                                        <div className="hidden md:flex items-center gap-1.5 mr-2">
                                            <ReminderPill label="24h" sent={reminders['24h']} />
                                            <ReminderPill label="12h" sent={reminders['12h']} />
                                            <ReminderPill label="6h" sent={reminders['6h']} />
                                            <ReminderPill label="2h" sent={reminders['2h']} />
                                        </div>

                                        <div className="text-right shrink-0">
                                            <div className="text-xs text-zinc-700 font-medium">{h.deadline ? fmtDate(h.deadline) : 'No Date'}</div>
                                            <div className={`text-[10px] font-semibold mt-0.5 ${days != null && days <= 2 ? 'text-red-600' : 'text-zinc-500'}`}>
                                                {h.deadline ? <Countdown targetDate={h.deadline} /> : 'No Date'}
                                            </div>
                                        </div>

                                        <svg className={`w-4 h-4 text-zinc-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>

                                    {/* Expanded */}
                                    {isOpen && (
                                        <div className="px-4 pb-4 border-t border-zinc-100">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-4">
                                                <D label="Prize Pool" value={safe(h.prizePool) || '—'} highlight />
                                                <D label="Team Size" value={safe(h.teamSize) || '—'} />
                                                <D label="Registered" value={h.teamFormed ? 'Yes' : 'No'} />
                                                <D label="Platform" value={h.platform || 'Unstop'} />
                                            </div>

                                            {/* Mobile reminder pills */}
                                            <div className="md:hidden mt-4 pt-4 border-t border-zinc-100">
                                                <div className="section-label mb-2">Reminders</div>
                                                <div className="flex flex-wrap gap-2">
                                                    <ReminderPill label="24h" sent={reminders['24h']} />
                                                    <ReminderPill label="12h" sent={reminders['12h']} />
                                                    <ReminderPill label="6h" sent={reminders['6h']} />
                                                    <ReminderPill label="2h" sent={reminders['2h']} />
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 mt-6 pt-4 border-t border-zinc-100">
                                                <a href={h.url} target="_blank" rel="noopener noreferrer"
                                                    className="btn-ghost text-xs py-2 sm:py-1.5 text-center">
                                                    Visit Website
                                                </a>
                                                <button
                                                    onClick={() => untrack(h.id)}
                                                    disabled={untractingIds.has(h.id)}
                                                    className="text-xs py-2 sm:py-1.5 px-3 rounded-lg bg-red-50 text-red-600 border border-red-200 font-medium hover:bg-red-100 transition-all disabled:opacity-50 text-center">
                                                    {untractingIds.has(h.id) ? 'Untracking...' : 'Untrack Event'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function D({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
    return (
        <div>
            <div className="section-label mb-0.5">{label}</div>
            <div className={`text-[12px] ${highlight ? 'text-amber-500' : 'text-zinc-700'}`}>{value}</div>
        </div>
    );
}

function ReminderPill({ label, sent }: { label: string, sent: boolean }) {
    return (
        <div className={`badge text-[10px] py-0.5 ${sent
            ? '!bg-emerald-500/10 !border-emerald-500/20 !text-emerald-600'
            : ''
            }`}>
            <span>{label}</span>
            <span>{sent ? '✓' : '⏳'}</span>
        </div>
    );
}

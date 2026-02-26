'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { apiUrl } from '@/lib/api-base';
import { formatLocation } from '@/lib/cities';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

/* ── Helpers ── */
function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
}

function fmtDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const FEATURES = [
    {
        icon: '🔍',
        title: 'Auto-Discovery',
        desc: 'Our crawler aggregates events from 10+ platforms — Unstop, Devfolio, MLH, and more.',
        color: '#3b82f6',
    },
    {
        icon: '🔔',
        title: 'Smart Alerts',
        desc: 'Discord DM reminders at 24h, 12h, 6h, and 2h before every deadline you track.',
        color: '#8b5cf6',
    },
    {
        icon: '🤖',
        title: 'Discord Sync',
        desc: 'Native bot integration to manage tracking, get alerts, and share events with your team.',
        color: '#6366f1',
    },
];

export default function LandingPage() {
    const { user, signInWithGoogle } = useAuth();
    const [featured, setFeatured] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                let res = await fetch(apiUrl('/api/global-hackathons?featured=true'));
                let data = await res.json();
                let hacks = data.hackathons || [];

                if (hacks.length === 0) {
                    res = await fetch(apiUrl('/api/global-hackathons'));
                    data = await res.json();
                    hacks = (data.hackathons || []).slice(0, 6);
                }
                setFeatured(hacks);
            } catch (e) {
                console.error("Failed to load featured hackathons", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <div className="min-h-screen">
            <Navbar />

            {/* ── Hero ── */}
            <section className="relative overflow-hidden">
                {/* Decorative orbs (Updated for light theme) */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-purple-400/20 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-6xl mx-auto px-4 md:px-6 pt-20 sm:pt-28 pb-20 sm:pb-28 text-center relative z-10">
                    <h1 className="animate-fade-in-up delay-100 text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                        <span className="text-gradient">Never Miss a</span>
                        <br />
                        <span className="text-zinc-900">Hackathon Again</span>
                    </h1>

                    <p className="animate-fade-in-up delay-200 text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
                        A community-driven platform to discover, track, and dominate global hackathons.
                        Join our Discord to enable real-time tracking and never miss a deadline!
                    </p>

                    <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link href="/discover" className="btn-gradient w-full sm:w-auto px-6 py-3 text-sm group">
                            Get Started
                        </Link>
                        <Link href="/submit" className="btn-ghost w-full sm:w-auto px-6 py-3 text-sm">
                            Submit Hackathon
                        </Link>
                        <a href="https://discord.gg/23HxCVyuUK" target="_blank" rel="noopener noreferrer" className="btn-ghost w-full sm:w-auto px-6 py-3 text-sm flex items-center justify-center gap-2 border-[#5865F2]/30 hover:bg-[#5865F2]/10 text-[#5865F2] hover:text-[#5865F2]">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0 a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" /></svg>
                            Join Discord
                        </a>
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="max-w-6xl mx-auto px-4 md:px-6 pb-20 sm:pb-28">
                <div className="text-center mb-12">
                    <p className="section-label mb-3">Why Trackmython</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">Everything you need to stay ahead</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {FEATURES.map((f, i) => (
                        <div key={i} className="glass-panel p-6 relative overflow-hidden group hover:border-zinc-300 transition-all">
                            {/* Top accent line */}
                            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${f.color}, transparent)` }} />

                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-4"
                                style={{ background: `${f.color}15` }}>
                                {f.icon}
                            </div>
                            <h3 className="text-base font-semibold text-zinc-900 mb-2">{f.title}</h3>
                            <p className="text-sm text-zinc-600 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Featured Events ── */}
            <section className="max-w-6xl mx-auto px-4 md:px-6 pb-20 sm:pb-28">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                    <div>
                        <p className="section-label mb-2">Trending Now</p>
                        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Featured Events</h2>
                    </div>
                    <Link href="/discover" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1">
                        View all <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-52 rounded-2xl bg-zinc-100 animate-pulse border border-zinc-200" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {featured.map((h, i) => {
                            const days = h.deadline ? daysUntil(h.deadline) : null;
                            const isExpired = days !== null && days < 0;
                            const isUrgent = days !== null && days >= 0 && days <= 5;

                            const platformColors: Record<string, string> = {
                                unstop: '#f97316',
                                devfolio: '#10b981',
                                mlh: '#3b82f6',
                            };
                            const pColor = platformColors[h.platform] || '#6366f1';

                            return (
                                <div key={h.id || i} className="glass-card group p-5 flex flex-col h-full">
                                    <Link href={h.url} target="_blank" className="absolute inset-0 z-0" aria-label={`View ${h.title}`} />

                                    <div className="flex items-center justify-between mb-4 relative z-10 pointer-events-none">
                                        <span className="badge text-[11px]"
                                            style={{ background: `${pColor}12`, borderColor: `${pColor}30`, color: pColor }}>
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: pColor }} />
                                            {h.platform || 'General'}
                                        </span>

                                        {isUrgent && (
                                            <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                                {days}d left
                                            </span>
                                        )}
                                        {isExpired && (
                                            <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full">
                                                Ended
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 relative z-10 pointer-events-none">
                                        <h3 className="text-[15px] font-semibold text-zinc-900 mb-1.5 group-hover:text-blue-600 transition-colors line-clamp-2">
                                            {h.title}
                                        </h3>
                                        <p className="text-xs text-zinc-500 mb-4 line-clamp-1">
                                            {h.organisation || h.university || 'Global Event'}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs relative z-10 pointer-events-none">
                                        <div>
                                            <span className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider">Deadline</span>
                                            <p className={`font-medium mt-0.5 ${isUrgent ? 'text-amber-500' : isExpired ? 'text-zinc-500' : 'text-zinc-700'}`}>
                                                {h.deadline ? fmtDate(h.deadline) : 'TBA'}
                                            </p>
                                        </div>
                                        <div className="text-right pointer-events-auto">
                                            <span className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider">Location</span>
                                            <p className="text-zinc-700 font-medium mt-0.5">
                                                <Link
                                                    href={`/discover?region=${encodeURIComponent(formatLocation(h.city, h.state).split(',')[0])}`}
                                                    className="hover:text-blue-600 transition-colors"
                                                >
                                                    {formatLocation(h.city, h.state)}
                                                </Link>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-zinc-200 py-8">
                <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-2">
                        <img src="/logo.svg" alt="Trackmython" className="w-5 h-5 rounded" />
                        © {new Date().getFullYear()} Trackmython
                    </span>
                    <div className="flex items-center gap-4">
                        <a href="https://discord.gg/23HxCVyuUK" target="_blank" rel="noopener noreferrer"
                            className="hover:text-zinc-900 transition-colors">Discord</a>
                        <Link href="/discover" className="hover:text-zinc-900 transition-colors">Discover</Link>
                        <Link href="/submit" className="hover:text-zinc-900 transition-colors">Submit</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

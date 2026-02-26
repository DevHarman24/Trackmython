'use client';

import { Fragment, Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { apiUrl } from '@/lib/api-base';
import CityAutocomplete from '@/components/CityAutocomplete';
import { formatLocation } from '@/lib/cities';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

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

const CATS = [
    { id: 'Hackathon', color: '#3b82f6' },
    { id: 'Ideathon', color: '#8b5cf6' },
    { id: 'CTF', color: '#ef4444' },
    { id: 'Quiz', color: '#f59e0b' },
    { id: 'Coding Challenge', color: '#10b981' },
    { id: 'Case Study', color: '#f97316' },
    { id: 'Business Competition', color: '#14b8a6' },
    { id: 'Other', color: '#6b7280' },
];

export default function Discover() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <DiscoverInner />
        </Suspense>
    );
}

function DiscoverInner() {
    const { user, loading, signInWithGoogle } = useAuth();

    const searchParams = useSearchParams();
    const initialLocation = searchParams.get('region') || '';

    const [phase, setPhase] = useState<'select' | 'results'>(initialLocation ? 'results' : 'select');
    const [hacks, setHacks] = useState<any[]>([]);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const [selectedCats, setSelectedCats] = useState<string[]>([]);
    const [locationInput, setLocationInput] = useState(initialLocation);
    const [search, setSearch] = useState('');
    const [showOnline, setShowOnline] = useState(false);

    const [expanded, setExpanded] = useState<string | null>(null);
    const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());
    const [trackingInProgress, setTrackingInProgress] = useState<Set<string>>(new Set());
    const [catCounts, setCatCounts] = useState<Record<string, number>>({});

    function toggleCat(id: string) {
        setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    }

    async function findEvents() {
        setBusy(true); setErr(''); setPhase('results');
        try {
            const p = new URLSearchParams();
            if (selectedCats.length > 0) p.set('categories', selectedCats.join(','));
            if (locationInput.trim()) p.set('region', locationInput.trim());
            if (search.trim()) p.set('search', search.trim());

            const headers: Record<string, string> = {};
            if (user) headers['Authorization'] = `Bearer ${await user.getIdToken()}`;

            const res = await fetch(apiUrl(`/api/global-hackathons?${p}`), { headers });
            const d = await res.json();

            setHacks(d.hackathons || []);
            setTrackedIds(new Set(d.trackedIds || []));
            const counts: Record<string, number> = {};
            (d.hackathons || []).forEach((h: any) => { counts[h.category || 'Other'] = (counts[h.category || 'Other'] || 0) + 1; });
            setCatCounts(counts);
        } catch (e: any) { setErr(e.message); }
        finally { setBusy(false); }
    }

    async function toggleTrack(hackathonId: string) {
        if (!user) { signInWithGoogle(); return; }
        const isCurrentlyTracked = trackedIds.has(hackathonId);

        setTrackingInProgress(prev => new Set(prev).add(hackathonId));
        try {
            const res = await fetch(apiUrl('/api/hackathons/toggle-global'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await user.getIdToken()}`
                },
                body: JSON.stringify({ hackathonId, isTracked: !isCurrentlyTracked })
            });
            if (res.ok) {
                setTrackedIds(prev => {
                    const next = new Set(prev);
                    if (isCurrentlyTracked) next.delete(hackathonId);
                    else next.add(hackathonId);
                    return next;
                });
            }
        } catch { /* silent */ }
        finally {
            setTrackingInProgress(prev => { const n = new Set(prev); n.delete(hackathonId); return n; });
        }
    }

    useEffect(() => {
        fetch(apiUrl('/api/global-hackathons')).then(r => r.json()).then(d => {
            const counts: Record<string, number> = {};
            (d.hackathons || []).forEach((h: any) => { counts[h.category || 'Other'] = (counts[h.category || 'Other'] || 0) + 1; });
            setCatCounts(counts);

            if (initialLocation) {
                findEvents();
            }
        }).catch(() => { });
    }, []);

    // Filter online events unless toggle is on
    const filteredHacks = showOnline ? hacks : hacks.filter(h => h.city && h.city.trim() !== '');
    const total = filteredHacks.length;
    const urgent = filteredHacks.filter(h => h.deadline && daysUntil(h.deadline) <= 3 && daysUntil(h.deadline) >= 0).length;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 relative">

                {/* ═══════ FILTER-FIRST LANDING ═══════ */}
                {phase === 'select' && (
                    <div className="max-w-2xl mx-auto animate-fade-in-up">
                        <div className="text-center mb-10 mt-8">
                            <p className="section-label mb-3">Discover</p>
                            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2">Find Your Next Challenge</h1>
                            <p className="text-sm text-zinc-500">Select what you're looking for and we'll find the best matches.</p>
                        </div>

                        {/* Category checkboxes */}
                        <div className="mb-6">
                            <label className="section-label mb-3 block">Event Types</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {CATS.map(cat => {
                                    const checked = selectedCats.includes(cat.id);
                                    const count = catCounts[cat.id] || 0;
                                    return (
                                        <button key={cat.id} onClick={() => toggleCat(cat.id)}
                                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all text-left ${checked
                                                ? 'border-indigo-500 text-indigo-600'
                                                : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'}`}
                                            style={checked ? { background: 'rgba(99,102,241,0.05)' } : { background: 'var(--bg-elevated)' }}>
                                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${checked
                                                ? 'bg-indigo-500 border-indigo-500'
                                                : 'border-zinc-400'}`}>
                                                {checked && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                            </div>
                                            <span className="text-[12px] font-medium flex-1">{cat.id}</span>
                                            {count > 0 && <span className="text-[10px] text-zinc-500 font-mono">{count}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Location */}
                        <div className="mb-4">
                            <label className="section-label mb-2 block">Location <span className="text-zinc-500 font-normal normal-case tracking-normal">(optional)</span></label>
                            <CityAutocomplete
                                value={locationInput}
                                onChange={setLocationInput}
                                onSelect={(val) => {
                                    setLocationInput(val);
                                    setTimeout(findEvents, 0);
                                }}
                                placeholder="Type any city — e.g. Faridabad, Thane, Noida..."
                                variant="zinc"
                                className="glass-input"
                            />
                        </div>

                        {/* Search */}
                        <div className="mb-6">
                            <label className="section-label mb-2 block">Search <span className="text-zinc-500 font-normal normal-case tracking-normal">(optional)</span></label>
                            <input type="text"
                                placeholder="Keywords, tags, org name..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && findEvents()}
                                className="glass-input" />
                        </div>

                        {/* Show Online toggle */}
                        <div className="mb-8">
                            <button onClick={() => setShowOnline(!showOnline)}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all text-left w-full ${showOnline
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'}`}
                                style={showOnline ? { background: 'rgba(99,102,241,0.05)' } : { background: 'var(--bg-elevated)' }}>
                                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${showOnline
                                    ? 'bg-indigo-500 border-indigo-500'
                                    : 'border-zinc-400'}`}>
                                    {showOnline && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                </div>
                                <span className="text-[12px] font-medium">Include Online / Virtual Events</span>
                            </button>
                        </div>

                        <button onClick={findEvents}
                            className="btn-gradient w-full py-3">
                            {selectedCats.length > 0 ? `Find ${selectedCats.join(' + ')} Events` : 'Browse All Events'}
                        </button>

                        {!user && (
                            <p className="text-center text-xs text-zinc-600 mt-4">
                                <button onClick={signInWithGoogle} className="text-indigo-600 hover:underline">Sign in</button> to track events and get Discord reminders.
                            </p>
                        )}
                    </div>
                )}

                {/* ═══════ RESULTS ═══════ */}
                {phase === 'results' && (
                    <>
                        {/* Active filters bar */}
                        <div className="flex flex-wrap items-center gap-2 mb-5">
                            <button onClick={() => setPhase('select')} className="badge hover:border-zinc-300 hover:text-zinc-900 transition-all cursor-pointer">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                Filters
                            </button>

                            {selectedCats.map(c => (
                                <span key={c} className="badge" style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)', color: '#6366f1' }}>
                                    {c}
                                    <button onClick={() => { toggleCat(c); setTimeout(findEvents, 0); }} className="ml-0.5 hover:text-zinc-900">
                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </span>
                            ))}
                            {locationInput && (
                                <span className="badge" style={{ background: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.2)', color: '#8b5cf6' }}>
                                    📍 {locationInput}
                                    <button onClick={() => { setLocationInput(''); setTimeout(findEvents, 0); }} className="ml-0.5 hover:text-zinc-900">
                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </span>
                            )}
                            <div className="flex-1" />
                            <button onClick={() => setShowOnline(!showOnline)}
                                className={`badge cursor-pointer transition-all ${showOnline
                                    ? 'border-indigo-500/20 text-indigo-600'
                                    : 'text-zinc-500 hover:text-zinc-700'}`}
                                style={showOnline ? { background: 'rgba(99,102,241,0.08)' } : {}}>
                                {showOnline ? '🌐 Online ✓' : '🌐 Online'}
                            </button>
                            <span className="text-[11px] text-zinc-600 font-mono">{total} result{total !== 1 ? 's' : ''}</span>
                            {urgent > 0 && <span className="text-[11px] text-amber-500 font-medium">{urgent} ending soon</span>}
                        </div>

                        {/* States */}
                        {busy ? (
                            <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
                        ) : err ? (
                            <div className="text-center py-12">
                                <p className="text-red-500 text-sm font-medium">{err}</p>
                                <button onClick={findEvents} className="mt-2 text-xs text-indigo-600 hover:underline">Retry</button>
                            </div>
                        ) : hacks.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-zinc-500 text-sm mb-2">No events match your criteria</p>
                                <button onClick={() => setPhase('select')} className="text-indigo-600 text-xs hover:underline">Change Filters</button>
                            </div>
                        ) : (
                            <>
                                {/* ── EVENT CARDS ── */}
                                <div className="space-y-2">
                                    {filteredHacks.map((h: any, i: number) => {
                                        const days = h.deadline ? daysUntil(h.deadline) : null;
                                        const isOpen = expanded === h.id;
                                        const isTracked = trackedIds.has(h.id);
                                        const isToggling = trackingInProgress.has(h.id);
                                        const prize = safe(h.prizePool);
                                        const team = safe(h.teamSize);
                                        const deadlineColor = days !== null
                                            ? days <= 1 ? 'text-red-500' : days <= 3 ? 'text-amber-500' : days <= 7 ? 'text-yellow-600' : 'text-zinc-500'
                                            : 'text-zinc-600';
                                        const catObj = CATS.find(c => c.id === h.category);
                                        const catColor = catObj?.color || '#6b7280';

                                        return (
                                            <Fragment key={h.id || i}>
                                                <div className={`rounded-xl border transition-all ${isOpen
                                                    ? 'border-indigo-500/30 bg-indigo-50/30'
                                                    : 'border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300'}`}>

                                                    {/* ── Row ── */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-3.5 cursor-pointer"
                                                        tabIndex={0}
                                                        onClick={() => setExpanded(isOpen ? null : h.id)}
                                                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(isOpen ? null : h.id); } }}
                                                        role="button" aria-expanded={isOpen}>

                                                        {/* Title section */}
                                                        <div className="flex items-start gap-3 w-full sm:w-auto sm:flex-1 min-w-0">
                                                            {/* Category pill */}
                                                            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border mt-0.5 sm:mt-0"
                                                                style={{ background: `${catColor}12`, borderColor: `${catColor}30`, color: catColor }}>
                                                                {h.category || 'Other'}
                                                            </span>

                                                            {/* Title + sub */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-semibold text-[13px] text-zinc-900 truncate">{h.title}</div>
                                                                <div className="text-[11px] text-zinc-500 truncate mt-0.5 flex items-center gap-1.5">
                                                                    {h.platform && (
                                                                        <span className="badge text-[9px] py-0 px-1.5"
                                                                            style={{
                                                                                background: h.platform === 'unstop' ? 'rgba(249,115,22,0.1)' : h.platform === 'devfolio' ? 'rgba(16,185,129,0.1)' : 'rgba(56,189,248,0.1)',
                                                                                borderColor: h.platform === 'unstop' ? 'rgba(249,115,22,0.2)' : h.platform === 'devfolio' ? 'rgba(16,185,129,0.2)' : 'rgba(56,189,248,0.2)',
                                                                                color: h.platform === 'unstop' ? '#fb923c' : h.platform === 'devfolio' ? '#34d399' : '#38bdf8'
                                                                            }}>
                                                                            {h.platform}
                                                                        </span>
                                                                    )}
                                                                    <span className="truncate">
                                                                        <span
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const loc = formatLocation(h.city, h.state);
                                                                                if (loc !== 'Online') {
                                                                                    setLocationInput(loc.split(',')[0]);
                                                                                    setPhase('select');
                                                                                }
                                                                            }}
                                                                            className="hover:text-indigo-600 hover:underline cursor-pointer transition-colors"
                                                                            title="Filter by this location"
                                                                        >
                                                                            📍 {formatLocation(h.city, h.state)}
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Deadline + actions */}
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:justify-end w-full sm:w-auto gap-2 sm:gap-4 pl-10 sm:pl-0 mt-2 sm:mt-0">
                                                            <div className="shrink-0 text-left sm:text-right w-full sm:w-auto" style={{ minWidth: '90px' }}>
                                                                {h.deadline ? (
                                                                    <>
                                                                        <div className="text-[12px] text-zinc-700 font-medium">{fmtDate(h.deadline)}</div>
                                                                        <div className={`text-[10px] font-semibold mt-0.5 ${deadlineColor}`}>
                                                                            {days !== null && days <= 0 ? 'Ends today' : days === 1 ? '1 day left' : `${days} days left`}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-[11px] text-zinc-500">No deadline</span>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                                {/* Track star */}
                                                                <button
                                                                    onClick={e => { e.stopPropagation(); toggleTrack(h.id); }}
                                                                    onKeyDown={e => e.stopPropagation()}
                                                                    disabled={isToggling}
                                                                    title={isTracked ? 'Stop tracking' : 'Track for Discord reminders'}
                                                                    className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isToggling ? 'opacity-40' : ''} ${isTracked
                                                                        ? 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200'
                                                                        : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'}`}>
                                                                    {isTracked ? (
                                                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                                    ) : (
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                                                                    )}
                                                                </button>

                                                                {/* Open link */}
                                                                <a href={h.url} target="_blank" rel="noopener noreferrer"
                                                                    onClick={e => e.stopPropagation()}
                                                                    className="shrink-0 btn-gradient text-[10px] px-3 py-1.5">
                                                                    Open
                                                                </a>

                                                                {/* Chevron */}
                                                                <svg className={`w-3.5 h-3.5 text-zinc-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                                                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* ── Expanded ── */}
                                                    {isOpen && (
                                                        <div className="px-4 pb-4 border-t border-zinc-100">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
                                                                <D label="Type" value={h.category || 'Other'} />
                                                                <D label="Location" value={
                                                                    <span
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const loc = formatLocation(h.city, h.state);
                                                                            if (loc !== 'Online') {
                                                                                setLocationInput(loc.split(',')[0]);
                                                                                setPhase('select');
                                                                            }
                                                                        }}
                                                                        className="hover:text-indigo-600 hover:underline cursor-pointer transition-colors"
                                                                        title="Filter by this location"
                                                                    >
                                                                        {formatLocation(h.city, h.state)}
                                                                    </span>
                                                                } />
                                                                <D label="University" value={safe(h.university) || '—'} />
                                                                <D label="Team Size" value={team || '—'} />
                                                                <D label="Prize Pool" value={prize || '—'} highlight />
                                                                <D label="Eligibility" value={safe(h.eligibility) || '—'} />
                                                                <D label="Deadline" value={h.deadline ? fmtDateFull(h.deadline) : '—'} />
                                                                <D label="Tracking" value={isTracked ? 'Tracked — reminders active' : 'Not tracked'} />
                                                            </div>
                                                            {(h.tags || []).length > 0 && (
                                                                <div className="flex flex-wrap gap-1.5 mt-4">
                                                                    {h.tags.map((t: string, j: number) => (
                                                                        <span key={j} className="badge text-[10px]">{t}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 pt-3 border-t border-zinc-100 gap-3">
                                                                <span className="text-[10px] text-zinc-500">
                                                                    {isTracked ? 'Reminders: 24h, 12h, 6h, 2h before deadline' : 'Track to get Discord DM reminders'}
                                                                </span>
                                                                <div className="flex gap-2">
                                                                    <button onClick={e => { e.stopPropagation(); toggleTrack(h.id); }}
                                                                        className={`btn-ghost text-[11px] py-1.5 px-3 ${isTracked
                                                                            ? '!border-yellow-500/20 !text-yellow-600 hover:!bg-yellow-100'
                                                                            : ''}`}>
                                                                        {isTracked ? 'Untrack' : 'Track Event'}
                                                                    </button>
                                                                    <a href={h.url} target="_blank" rel="noopener noreferrer"
                                                                        className="btn-gradient text-[11px] py-1.5 px-3">
                                                                        View Page
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </Fragment>
                                        );
                                    })}
                                </div>

                                <div className="text-center py-6 text-[10px] text-zinc-500">
                                    {total} events · Tracked events get Discord DM reminders at 24h, 12h, 6h, and 2h before deadline
                                </div>
                            </>
                        )}
                    </>
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

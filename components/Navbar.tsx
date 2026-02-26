'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_LINKS = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/discover', label: 'Discover' },
    { href: '/submit', label: 'Submit' },
    { href: '/settings', label: 'Settings' },
];

export default function Navbar() {
    const { user, loading, signInWithGoogle, signOut } = useAuth();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="glass-nav sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
                    <img src="/logo.svg" alt="Trackmython" className="w-7 h-7 rounded-lg" />
                    <span className="font-semibold text-[15px] text-zinc-900 tracking-tight">Trackmython</span>
                </Link>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-1">
                    {NAV_LINKS.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${pathname === link.href
                                ? 'text-zinc-900 bg-zinc-100'
                                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {!loading && (
                        <>
                            {user ? (
                                <div className="flex items-center gap-3">
                                    <span className="hidden sm:block text-xs text-zinc-500">
                                        {user.email?.split('@')[0]}
                                    </span>
                                    <button
                                        onClick={signOut}
                                        className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={signInWithGoogle}
                                    className="btn-gradient text-xs py-1.5 px-4"
                                >
                                    Sign in
                                </button>
                            )}
                        </>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden p-1.5 rounded-md hover:bg-zinc-100 text-zinc-600 transition-colors"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            {mobileOpen ? (
                                <>
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </>
                            ) : (
                                <>
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <line x1="3" y1="12" x2="21" y2="12" />
                                    <line x1="3" y1="18" x2="21" y2="18" />
                                </>
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile dropdown */}
            {mobileOpen && (
                <div className="md:hidden border-t border-zinc-200 px-4 py-3 space-y-1 bg-white/50 backdrop-blur-md">
                    {NAV_LINKS.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-all ${pathname === link.href
                                ? 'text-zinc-900 bg-zinc-100'
                                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    );
}

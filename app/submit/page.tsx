'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { apiUrl } from '@/lib/api-base';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function SubmitHackathon() {
    const { user, loading, signInWithGoogle } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        title: '',
        description: '',
        url: '',
        category: 'Hackathon',
        registrationDeadline: '',
        location: '',
        platform: '',
        teamSize: '',
        tags: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!user) return;

        setSubmitting(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(apiUrl('/api/hackathons/submit'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit hackathon');
            }

            setSuccess(true);
            setForm({
                title: '',
                description: '',
                url: '',
                category: 'Hackathon',
                registrationDeadline: '',
                location: '',
                platform: '',
                teamSize: '',
                tags: ''
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen">
            <Navbar />

            <main className="max-w-2xl mx-auto px-4 md:px-6 py-8 relative">
                <div className="text-center mb-8">
                    <p className="section-label mb-2">Contribute</p>
                    <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-2">
                        Submit a Hackathon
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Know of an event not listed here? Submit it for review.
                    </p>
                </div>

                {!user ? (
                    <div className="glass-panel p-8 text-center">
                        <p className="text-zinc-500 text-sm mb-4">You must be signed in to submit events.</p>
                        <button
                            onClick={signInWithGoogle}
                            className="btn-gradient py-2.5 px-6 text-sm"
                        >
                            Sign in with Google
                        </button>
                    </div>
                ) : success ? (
                    <div className="glass-panel p-8 text-center" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                            style={{ background: 'rgba(16,185,129,0.1)' }}>
                            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-emerald-600 mb-2">Submission Received!</h3>
                        <p className="text-zinc-600 text-sm">
                            Thanks for your submission. An admin will review it shortly.
                        </p>
                        <button
                            onClick={() => setSuccess(false)}
                            className="mt-6 text-sm text-zinc-500 hover:text-zinc-900 transition-colors underline"
                        >
                            Submit another
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="glass-panel p-5 sm:p-6 space-y-5">

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="section-label mb-2 block">Event Title <span className="text-red-600">*</span></label>
                            <input
                                required
                                type="text"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="e.g. HackMIT 2025"
                                className="glass-input"
                            />
                        </div>

                        <div>
                            <label className="section-label mb-2 block">Description <span className="text-red-600">*</span></label>
                            <textarea
                                required
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Brief overview of the hackathon..."
                                className="glass-input resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="section-label mb-2 block">Event Link <span className="text-red-600">*</span></label>
                                <input
                                    required
                                    type="url"
                                    name="url"
                                    value={form.url}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                    className="glass-input"
                                />
                            </div>

                            <div>
                                <label className="section-label mb-2 block">Category <span className="text-red-600">*</span></label>
                                <select
                                    required
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    className="glass-input appearance-none"
                                >
                                    <option value="Hackathon">Hackathon</option>
                                    <option value="Ideathon">Ideathon</option>
                                    <option value="CTF">CTF</option>
                                    <option value="Quiz">Quiz</option>
                                    <option value="Coding Challenge">Coding Challenge</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="section-label mb-2 block">Registration Deadline <span className="text-red-600">*</span></label>
                                <input
                                    required
                                    type="datetime-local"
                                    name="registrationDeadline"
                                    value={form.registrationDeadline}
                                    onChange={handleChange}
                                    className="glass-input"
                                />
                            </div>

                            <div>
                                <label className="section-label mb-2 block">Location <span className="text-red-600">*</span></label>
                                <input
                                    required
                                    type="text"
                                    name="location"
                                    value={form.location}
                                    onChange={handleChange}
                                    placeholder="Online or City"
                                    className="glass-input"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="section-label mb-2 block">Platform</label>
                                <select
                                    name="platform"
                                    value={form.platform}
                                    onChange={handleChange}
                                    className="glass-input appearance-none"
                                >
                                    <option value="">Select</option>
                                    <option value="Unstop">Unstop</option>
                                    <option value="Devfolio">Devfolio</option>
                                    <option value="MLH">MLH</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="section-label mb-2 block">Team Size</label>
                                <input
                                    type="text"
                                    name="teamSize"
                                    value={form.teamSize}
                                    onChange={handleChange}
                                    placeholder="e.g. 1-4"
                                    className="glass-input"
                                />
                            </div>

                            <div>
                                <label className="section-label mb-2 block">Tags</label>
                                <input
                                    type="text"
                                    name="tags"
                                    value={form.tags}
                                    onChange={handleChange}
                                    placeholder="web3, ai, beginner"
                                    className="glass-input"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`btn-gradient w-full py-3 text-sm ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {submitting ? 'Submitting...' : 'Submit for Review'}
                            </button>
                        </div>
                    </form>
                )}
            </main>
        </div>
    );
}

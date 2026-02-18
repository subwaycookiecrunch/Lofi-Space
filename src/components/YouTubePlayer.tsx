
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Youtube, Link2, X, Check, AlertCircle, Play } from 'lucide-react';

interface YouTubePlayerProps {
    isOpen: boolean;
    onClose: () => void;
}

const CURATED_VIDEOS = [
    { name: '🎧 Lofi Girl Radio', id: 'jfKfPfyJRdk', desc: 'beats to relax/study to' },
    { name: '☕ Coffee Shop Jazz', id: '-5KAN9_CzSA', desc: 'Smooth jazz for focus' },
    { name: '🌧️ Rain on Window', id: 'mPZkdNFkNps', desc: 'Relaxing rain ambience' },
    { name: '🌙 Midnight Lofi', id: 'rUxyKA_-grg', desc: 'Late night chill vibes' },
    { name: '🎹 Calm Piano', id: '77ZozI0rw7w', desc: 'Peaceful piano music' },
];

const STORAGE_KEY = 'lucid-youtube';

function extractYouTubeId(input: string): string | null {
    const trimmed = input.trim();

    // youtube.com/watch?v=ID
    const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];

    // youtu.be/ID
    const shortMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];

    // youtube.com/embed/ID
    const embedMatch = trimmed.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];

    // youtube.com/v/ID
    const vMatch = trimmed.match(/(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/);
    if (vMatch) return vMatch[1];

    // youtube.com/live/ID
    const liveMatch = trimmed.match(/(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/);
    if (liveMatch) return liveMatch[1];

    // music.youtube.com/watch?v=ID
    const musicMatch = trimmed.match(/(?:music\.youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/);
    if (musicMatch) return musicMatch[1];

    // Plain 11-char ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

    return null;
}

export default function YouTubePlayer({ isOpen, onClose }: YouTubePlayerProps) {
    const [activeVideo, setActiveVideo] = useState<string>(CURATED_VIDEOS[0].id);
    const [customUrl, setCustomUrl] = useState('');
    const [urlStatus, setUrlStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isPlaying, setIsPlaying] = useState(false);
    const hasOpenedRef = useRef(false);

    useEffect(() => {
        if (isOpen) hasOpenedRef.current = true;
    }, [isOpen]);

    // Load saved preference
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setActiveVideo(saved);
        } catch { }
    }, []);

    const selectVideo = (id: string) => {
        setActiveVideo(id);
        setIsPlaying(true);
        localStorage.setItem(STORAGE_KEY, id);
    };

    const handleCustomUrl = () => {
        const id = extractYouTubeId(customUrl);
        if (id) {
            selectVideo(id);
            setCustomUrl('');
            setUrlStatus('success');
            setTimeout(() => setUrlStatus('idle'), 2000);
        } else {
            setUrlStatus('error');
            setTimeout(() => setUrlStatus('idle'), 3000);
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        setTimeout(() => {
            const pasted = e.clipboardData.getData('text');
            const id = extractYouTubeId(pasted);
            if (id) {
                selectVideo(id);
                setCustomUrl('');
                setUrlStatus('success');
                setTimeout(() => setUrlStatus('idle'), 2000);
            }
        }, 50);
    };

    const currentName = CURATED_VIDEOS.find(v => v.id === activeVideo)?.name || '🎵 Custom';

    if (!hasOpenedRef.current && !isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <div
                onClick={e => e.stopPropagation()}
                className="relative w-[92vw] max-w-sm rounded-3xl overflow-hidden border border-white/[0.08] shadow-[0_25px_60px_rgba(0,0,0,0.5)] max-h-[85vh] flex flex-col"
                style={{
                    background: 'linear-gradient(165deg, rgba(30,30,50,0.95), rgba(15,15,30,0.98))',
                }}
            >
                {/* YouTube red gradient bar */}
                <div className="h-1 w-full bg-gradient-to-r from-red-500/70 via-rose-500/60 to-pink-500/50" />

                <div className="p-6 flex flex-col flex-1 min-h-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/25 to-rose-500/15 flex items-center justify-center border border-white/[0.06]">
                                <Youtube size={16} className="text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-white/90 tracking-wide">YouTube Audio</h2>
                                <p className="text-[10px] text-white/30 tracking-wider">AUDIO ONLY</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white/70 transition-all"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Paste URL */}
                    <div className="mb-3">
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                                <input
                                    value={customUrl}
                                    onChange={e => { setCustomUrl(e.target.value); setUrlStatus('idle'); }}
                                    onKeyDown={e => e.key === 'Enter' && handleCustomUrl()}
                                    onPaste={handlePaste}
                                    placeholder="Paste YouTube link here..."
                                    className={`w-full bg-white/[0.04] border rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/20 outline-none transition-colors ${urlStatus === 'error'
                                            ? 'border-red-500/30 focus:border-red-500/50'
                                            : urlStatus === 'success'
                                                ? 'border-green-500/30'
                                                : 'border-white/[0.06] focus:border-red-500/20'
                                        }`}
                                />
                            </div>
                            <button
                                onClick={handleCustomUrl}
                                className="px-3 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400/80 text-xs font-medium transition-all border border-red-500/10"
                            >
                                {urlStatus === 'success' ? <Check size={14} /> : 'Load'}
                            </button>
                        </div>
                        {urlStatus === 'error' && (
                            <div className="flex items-center gap-1.5 mt-1.5 px-1">
                                <AlertCircle size={10} className="text-red-400/70" />
                                <span className="text-[10px] text-red-400/70">
                                    Invalid link. Paste a YouTube video or music URL.
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Curated list */}
                    <div className="space-y-1 mb-3 max-h-[140px] overflow-y-auto">
                        {CURATED_VIDEOS.map(v => (
                            <button
                                key={v.id}
                                onClick={() => selectVideo(v.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${activeVideo === v.id
                                        ? 'bg-white/[0.06] border border-white/[0.08]'
                                        : 'hover:bg-white/[0.03] border border-transparent'
                                    }`}
                            >
                                <div>
                                    <div className={`text-sm ${activeVideo === v.id ? 'text-red-400/90' : 'text-white/70'}`}>
                                        {v.name}
                                    </div>
                                    <div className="text-[10px] text-white/25">{v.desc}</div>
                                </div>
                                {activeVideo === v.id && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Audio-only area: YouTube embed with video hidden, controls visible */}
                    <div className="relative rounded-2xl overflow-hidden border border-white/[0.04]">
                        {/* Aesthetic overlay that covers video but lets controls through */}
                        <div
                            className="absolute inset-0 z-10 pointer-events-none rounded-2xl"
                            style={{
                                background: `linear-gradient(180deg, 
                                    rgba(15,15,30,0.95) 0%, 
                                    rgba(15,15,30,0.9) 60%, 
                                    transparent 85%)`,
                            }}
                        />

                        {/* Now-playing label */}
                        <div className="absolute top-3 left-4 z-20 pointer-events-none">
                            <div className="text-[10px] text-white/30 tracking-wider uppercase mb-1">Now Playing</div>
                            <div className="text-sm text-white/70 font-medium">{currentName}</div>
                        </div>

                        {/* Animated bars */}
                        <div className="absolute top-4 right-4 z-20 flex items-end gap-[3px] pointer-events-none">
                            {[0, 1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className="w-[3px] bg-red-400/60 rounded-full"
                                    style={{
                                        height: isPlaying ? `${8 + Math.random() * 12}px` : '4px',
                                        animation: isPlaying ? `audioBar ${0.4 + i * 0.15}s ease-in-out infinite alternate` : 'none',
                                    }}
                                />
                            ))}
                        </div>

                        {/* YouTube iframe — sits behind overlay, bottom controls peek through */}
                        <iframe
                            src={`https://www.youtube.com/embed/${activeVideo}?autoplay=0&rel=0&modestbranding=1&color=white`}
                            width="100%"
                            height="200"
                            frameBorder="0"
                            allow="autoplay; encrypted-media"
                            allowFullScreen={false}
                            className="rounded-2xl"
                            style={{ minHeight: 200 }}
                        />
                    </div>
                </div>
            </div>

            {/* Audio bar animation keyframes */}
            <style>{`
                @keyframes audioBar {
                    0% { height: 4px; }
                    100% { height: 18px; }
                }
            `}</style>
        </div>
    );
}


'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { Music, ChevronDown, Link2, X, Check, AlertCircle } from 'lucide-react';

interface SpotifyPlayerProps {
    isOpen: boolean;
    onClose: () => void;
}

const CURATED_PLAYLISTS = [
    { name: '☕ Lofi Beats', id: '0vvXsWCC9xrXsKd4FyS8kM', desc: 'Classic lofi hip hop' },
    { name: '🌧️ Rainy Day', id: '37i9dQZF1DX8ymr6UES7vc', desc: 'Chill rain vibes' },
    { name: '📚 Deep Focus', id: '37i9dQZF1DWZeKCadgRdKQ', desc: 'Intense concentration' },
    { name: '🌙 Late Night', id: '37i9dQZF1DX2pSTOxoPbx9', desc: 'Midnight sessions' },
    { name: '🎹 Piano Study', id: '37i9dQZF1DX4sWSpwq3LiO', desc: 'Peaceful piano' },
    { name: '🌿 Nature Chill', id: '37i9dQZF1DX1s9knjP51Oa', desc: 'Ambient nature mix' },
];

const STORAGE_KEY = 'lucid-spotify';

function extractSpotifyId(input: string): { type: string; id: string } | null {
    const trimmed = input.trim();

    // Try URL format: https://open.spotify.com/playlist/ID?si=xxx
    const urlMatch = trimmed.match(
        /open\.spotify\.com\/(playlist|album|track|artist|episode|show)\/([a-zA-Z0-9]+)/
    );
    if (urlMatch) {
        return { type: urlMatch[1], id: urlMatch[2] };
    }

    // Try URI format: spotify:playlist:ID
    const uriMatch = trimmed.match(
        /spotify:(playlist|album|track|artist|episode|show):([a-zA-Z0-9]+)/
    );
    if (uriMatch) {
        return { type: uriMatch[1], id: uriMatch[2] };
    }

    // Try embed URL: https://open.spotify.com/embed/playlist/ID
    const embedMatch = trimmed.match(
        /open\.spotify\.com\/embed\/(playlist|album|track|artist|episode|show)\/([a-zA-Z0-9]+)/
    );
    if (embedMatch) {
        return { type: embedMatch[1], id: embedMatch[2] };
    }

    return null;
}

export default function SpotifyPlayer({ isOpen, onClose }: SpotifyPlayerProps) {
    const { theme } = useTheme();
    const [activePlaylist, setActivePlaylist] = useState<string>(CURATED_PLAYLISTS[0].id);
    const [activeType, setActiveType] = useState<string>('playlist');
    const [customUrl, setCustomUrl] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const [urlStatus, setUrlStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const hasOpenedRef = useRef(false);

    useEffect(() => {
        if (isOpen) hasOpenedRef.current = true;
    }, [isOpen]);

    // Load saved preference
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const { id, type } = JSON.parse(saved);
                setActivePlaylist(id);
                setActiveType(type);
            }
        } catch { }
    }, []);

    const fromRemoteRef = useRef(false);

    const selectPlaylist = (id: string, type: string = 'playlist') => {
        setActivePlaylist(id);
        setActiveType(type);
        setShowPicker(false);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, type }));

        if (!fromRemoteRef.current) {
            window.dispatchEvent(new CustomEvent('focusroom-local-spotify', {
                detail: { id, type },
            }));
        }
    };

    // Listen for remote Spotify changes
    useEffect(() => {
        const handleRemote = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            console.log('[SpotifyPlayer] Remote command:', detail);
            fromRemoteRef.current = true;
            try {
                selectPlaylist(detail.id, detail.type);
            } finally {
                setTimeout(() => { fromRemoteRef.current = false; }, 100);
            }
        };

        window.addEventListener('focusroom-remote-spotify', handleRemote);
        return () => window.removeEventListener('focusroom-remote-spotify', handleRemote);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCustomUrl = () => {
        const result = extractSpotifyId(customUrl);
        if (result) {
            selectPlaylist(result.id, result.type);
            setCustomUrl('');
            setUrlStatus('success');
            setTimeout(() => setUrlStatus('idle'), 2000);
        } else {
            setUrlStatus('error');
            setTimeout(() => setUrlStatus('idle'), 3000);
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        // Auto-load on paste
        setTimeout(() => {
            const pasted = e.clipboardData.getData('text');
            const result = extractSpotifyId(pasted);
            if (result) {
                selectPlaylist(result.id, result.type);
                setCustomUrl('');
                setUrlStatus('success');
                setTimeout(() => setUrlStatus('idle'), 2000);
            }
        }, 50);
    };

    const currentPlaylistName = CURATED_PLAYLISTS.find(p => p.id === activePlaylist)?.name || '🎵 Custom';

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
                {/* Spotify green gradient bar */}
                <div className="h-1 w-full bg-gradient-to-r from-green-500/70 via-emerald-500/60 to-teal-500/50" />

                <div className="p-6 flex flex-col flex-1 min-h-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500/25 to-emerald-500/15 flex items-center justify-center border border-white/[0.06]">
                                <Music size={16} className="text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-white/90 tracking-wide">Spotify</h2>
                                <p className="text-[10px] text-white/30 tracking-wider">LINKED MUSIC</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white/70 transition-all"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Paste URL — always visible */}
                    <div className="mb-3">
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                                <input
                                    value={customUrl}
                                    onChange={e => { setCustomUrl(e.target.value); setUrlStatus('idle'); }}
                                    onKeyDown={e => e.key === 'Enter' && handleCustomUrl()}
                                    onPaste={handlePaste}
                                    placeholder="Paste Spotify link here..."
                                    className={`w-full bg-white/[0.04] border rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/20 outline-none transition-colors ${urlStatus === 'error'
                                        ? 'border-red-500/30 focus:border-red-500/50'
                                        : urlStatus === 'success'
                                            ? 'border-green-500/30'
                                            : 'border-white/[0.06] focus:border-green-500/20'
                                        }`}
                                />
                            </div>
                            <button
                                onClick={handleCustomUrl}
                                className="px-3 py-2.5 rounded-xl bg-green-500/15 hover:bg-green-500/25 text-green-400/80 text-xs font-medium transition-all border border-green-500/10"
                            >
                                {urlStatus === 'success' ? <Check size={14} /> : 'Load'}
                            </button>
                        </div>
                        {urlStatus === 'error' && (
                            <div className="flex items-center gap-1.5 mt-1.5 px-1">
                                <AlertCircle size={10} className="text-red-400/70" />
                                <span className="text-[10px] text-red-400/70">
                                    Invalid link. Paste a Spotify playlist, album, or track URL.
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Playlist Selector */}
                    <button
                        onClick={() => setShowPicker(!showPicker)}
                        className="flex items-center justify-between w-full bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] rounded-xl px-4 py-3 mb-3 transition-all"
                    >
                        <span className="text-sm text-white/70">{currentPlaylistName}</span>
                        <ChevronDown size={14} className={`text-white/30 transition-transform duration-200 ${showPicker ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Picker Dropdown */}
                    {showPicker && (
                        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] mb-3 overflow-hidden max-h-[180px] overflow-y-auto">
                            {CURATED_PLAYLISTS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => selectPlaylist(p.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.05] transition-all border-b border-white/[0.03] last:border-b-0
                                        ${activePlaylist === p.id ? 'bg-white/[0.05]' : ''}`}
                                >
                                    <div>
                                        <div className={`text-sm ${activePlaylist === p.id ? 'text-green-400/90' : 'text-white/70'}`}>
                                            {p.name}
                                        </div>
                                        <div className="text-[10px] text-white/25">{p.desc}</div>
                                    </div>
                                    {activePlaylist === p.id && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Spotify Embed */}
                    <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-white/[0.04]">
                        <iframe
                            src={`https://open.spotify.com/embed/${activeType}/${activePlaylist}?utm_source=generator&theme=0`}
                            width="100%"
                            height="352"
                            frameBorder="0"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            className="rounded-2xl"
                            style={{ minHeight: 352, background: 'transparent' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

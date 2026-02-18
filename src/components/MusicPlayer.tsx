
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { useDeviceMode } from '@/providers/DeviceModeProvider';
import { Play, Pause, Volume2, VolumeX, FolderOpen, Radio } from 'lucide-react';

export default function MusicPlayer() {
    const { theme } = useTheme();
    const { device } = useDeviceMode();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [volume, setVolume] = useState(50);
    const [sourceType, setSourceType] = useState<'youtube' | 'local'>('youtube');
    const [hasLocalAudio, setHasLocalAudio] = useState(false);

    const playerRef = useRef<HTMLIFrameElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        // Check for local audio
        fetch('/audio.mp3', { method: 'HEAD' })
            .then(res => {
                if (res.ok) setHasLocalAudio(true);
            })
            .catch(() => setHasLocalAudio(false));
    }, []);

    const sendCommand = (command: string, args: any[] = []) => {
        if (playerRef.current?.contentWindow) {
            playerRef.current.contentWindow.postMessage(
                JSON.stringify({ event: 'command', func: command, args: args }), '*'
            );
        }
    };

    const fromRemoteRef = useRef(false);

    // Emit events to FocusRoom for broadcasting
    const emitMusicEvent = useCallback((action: string) => {
        if (fromRemoteRef.current) return;
        window.dispatchEvent(new CustomEvent('focusroom-local-music', {
            detail: { action },
        }));
    }, []);

    const togglePlay = () => {
        if (sourceType === 'youtube') {
            isPlaying ? sendCommand('pauseVideo') : sendCommand('playVideo');
        } else if (audioRef.current) {
            isPlaying ? audioRef.current.pause() : audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
        emitMusicEvent(isPlaying ? 'pause' : 'play');
    };

    // Listen for remote music commands from FocusRoom
    useEffect(() => {
        const handleRemote = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            console.log('[MusicPlayer] Remote command:', detail);
            fromRemoteRef.current = true;
            try {
                if (detail.action === 'play') {
                    if (sourceType === 'youtube') sendCommand('playVideo');
                    else audioRef.current?.play();
                    setIsPlaying(true);
                } else if (detail.action === 'pause') {
                    if (sourceType === 'youtube') sendCommand('pauseVideo');
                    else audioRef.current?.pause();
                    setIsPlaying(false);
                }
            } finally {
                setTimeout(() => { fromRemoteRef.current = false; }, 100);
            }
        };

        window.addEventListener('focusroom-remote-music', handleRemote);
        return () => window.removeEventListener('focusroom-remote-music', handleRemote);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sourceType]);

    const toggleMute = () => {
        const newMute = !isMuted;
        setIsMuted(newMute);

        if (sourceType === 'youtube') {
            newMute ? sendCommand('mute') : sendCommand('unMute');
        } else if (audioRef.current) {
            audioRef.current.muted = newMute;
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVol = parseInt(e.target.value);
        setVolume(newVol);

        if (sourceType === 'youtube') {
            sendCommand('setVolume', [newVol]);
        } else if (audioRef.current) {
            audioRef.current.volume = newVol / 100;
        }

        if (newVol > 0 && isMuted) {
            setIsMuted(false);
            toggleMute(); // This logic might be slightly off due to toggle, fixing below
            if (sourceType === 'youtube') sendCommand('unMute');
            if (audioRef.current) audioRef.current.muted = false;
        }
    };

    const switchSource = () => {
        // Pause current
        if (isPlaying) togglePlay();
        setSourceType(prev => prev === 'youtube' ? 'local' : 'youtube');
        // Reset state for new source
        setIsPlaying(false);
    };

    const isMobile = device === 'mobile';

    return (
        <div className={`fixed z-40 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-72 max-w-[90vw] shadow-2xl transition-all duration-500
      ${isMobile ? 'bottom-24 left-1/2 -translate-x-1/2' : 'bottom-8 left-8 translate-x-0'}
      ${theme.colors.glass} ${theme.colors.border}`}
        >
            {/* Hidden Players */}
            <div className="hidden">
                <iframe
                    ref={playerRef}
                    width="560" height="315"
                    src={`${theme.audio}&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                    title="LoFi Player"
                    allow="autoplay; encrypted-media"
                />
                {hasLocalAudio && <audio ref={audioRef} src="/audio.mp3" loop />}
            </div>

            <div className="flex items-center justify-between mb-2">
                {/* Simple visualization or title */}
                <div className="flex flex-col">
                    <span className={`text-sm font-medium ${theme.colors.accent}`}>
                        {sourceType === 'youtube' ? `${theme.name} Vibes` : 'Local Audio'}
                    </span>
                    <span className="text-[10px] text-white/50 uppercase tracking-wider">
                        {sourceType === 'youtube' ? 'LoFi Radio' : 'My Track'}
                    </span>
                </div>

                {hasLocalAudio && (
                    <button
                        onClick={switchSource}
                        className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                        title={sourceType === 'youtube' ? "Switch to Local Audio" : "Switch to Radio"}
                    >
                        {sourceType === 'youtube' ? <FolderOpen size={14} /> : <Radio size={14} />}
                    </button>
                )}
            </div>

            <div className="flex items-center justify-between">
                <button
                    onClick={togglePlay}
                    className={`p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all ${theme.colors.accent}`}
                >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>

                <div className="flex items-center space-x-2 pl-4">
                    <button onClick={toggleMute} className={`text-white/70 hover:text-white`}>
                        {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                </div>
            </div>
        </div>
    );
}

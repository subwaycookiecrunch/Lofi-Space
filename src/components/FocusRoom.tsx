
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { supabase } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RoomMember {
    id: string;
    name: string;
    timeRemaining: number;
    mode: string;
    joinedAt: number;
    color: string;
    online_at: string;
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

const COLORS = ['#93c5fd', '#c4b5fd', '#fdba74', '#86efac', '#fca5a5', '#f0abfc', '#67e8f9'];
const STORAGE_KEY = 'lucid-room-user';
const ROOM_STATE_KEY = 'lucid-room-state';

function generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getOrCreateUser(): { id: string; name: string; color: string } {
    if (typeof window === 'undefined') return { id: '', name: '', color: '' };
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch { }
    const user = {
        id: Math.random().toString(36).substring(2, 10),
        name: `User ${Math.floor(Math.random() * 999)}`,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
}

interface FocusRoomProps {
    isOpen: boolean;
    onClose: () => void;
    timerSeconds?: number;
    isTimerActive?: boolean;
}

export default function FocusRoom({ isOpen, onClose, timerSeconds = 0, isTimerActive = false }: FocusRoomProps) {
    const { theme, mode } = useTheme();
    const [roomCode, setRoomCode] = useState('');
    const [inRoom, setInRoom] = useState(false);
    const [members, setMembers] = useState<RoomMember[]>([]);
    const [joinInput, setJoinInput] = useState('');
    const [userName, setUserName] = useState('');
    const [copied, setCopied] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [syncLog, setSyncLog] = useState<string[]>([]);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const userRef = useRef(getOrCreateUser());

    // Refs to avoid stale closures
    const timerActiveRef = useRef(isTimerActive);
    const timerSecondsRef = useRef(timerSeconds);
    const modeRef = useRef(mode);
    const userNameRef = useRef('');
    const inRoomRef = useRef(false);

    useEffect(() => { timerActiveRef.current = isTimerActive; }, [isTimerActive]);
    useEffect(() => { timerSecondsRef.current = timerSeconds; }, [timerSeconds]);
    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { inRoomRef.current = inRoom; }, [inRoom]);

    const addSyncLog = useCallback((msg: string) => {
        setSyncLog(prev => [...prev.slice(-4), msg]);
    }, []);

    useEffect(() => {
        const u = getOrCreateUser();
        userRef.current = u;
        setUserName(u.name);
        userNameRef.current = u.name;

        try {
            const saved = localStorage.getItem(ROOM_STATE_KEY);
            if (saved) {
                const { code } = JSON.parse(saved);
                if (code) setTimeout(() => joinRoom(code), 500);
            }
        } catch { }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const buildPresenceState = useCallback(() => {
        return {
            id: userRef.current.id,
            name: userNameRef.current || userRef.current.name,
            timeRemaining: timerActiveRef.current ? timerSecondsRef.current : -1,
            mode: modeRef.current,
            joinedAt: Date.now(),
            color: userRef.current.color,
            online_at: new Date().toISOString(),
        };
    }, []);

    // Periodically update presence
    useEffect(() => {
        if (!inRoom || !channelRef.current) return;
        const interval = setInterval(() => {
            channelRef.current?.track(buildPresenceState()).catch(() => { });
        }, 3000);
        return () => clearInterval(interval);
    }, [inRoom, buildPresenceState]);

    // Push presence on timer state change
    useEffect(() => {
        if (!inRoomRef.current || !channelRef.current) return;
        const timeout = setTimeout(() => {
            channelRef.current?.track(buildPresenceState()).catch(() => { });
        }, 500);
        return () => clearTimeout(timeout);
    }, [isTimerActive, timerSeconds, mode, buildPresenceState]);

    // ─── SYNC: Listen for LOCAL actions from PomodoroTimer & MusicPlayer, broadcast to room ───
    useEffect(() => {
        if (!inRoom) return;

        const handleLocalTimerAction = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (!channelRef.current) return;
            console.log('[FocusRoom] Local timer action:', detail);
            channelRef.current.send({
                type: 'broadcast',
                event: 'timer-sync',
                payload: { ...detail, fromId: userRef.current.id, fromName: userRef.current.name },
            });
            addSyncLog(`📤 You ${detail.action}ed the timer`);
        };

        const handleLocalMusicAction = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (!channelRef.current) return;
            console.log('[FocusRoom] Local music action:', detail);
            channelRef.current.send({
                type: 'broadcast',
                event: 'music-sync',
                payload: { ...detail, fromId: userRef.current.id, fromName: userRef.current.name },
            });
            addSyncLog(`📤 You ${detail.action}ed music`);
        };

        const handleLocalSpotifyAction = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (!channelRef.current) return;
            console.log('[FocusRoom] Local spotify action:', detail);
            channelRef.current.send({
                type: 'broadcast',
                event: 'spotify-sync',
                payload: { ...detail, fromId: userRef.current.id, fromName: userRef.current.name },
            });
            addSyncLog(`📤 You changed Spotify playlist`);
        };

        const handleLocalThemeAction = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (!channelRef.current) return;
            console.log('[FocusRoom] Local theme action:', detail);
            channelRef.current.send({
                type: 'broadcast',
                event: 'theme-sync',
                payload: { ...detail, fromId: userRef.current.id, fromName: userRef.current.name },
            });
            addSyncLog(`📤 You changed theme to ${detail.mode}`);
        };

        window.addEventListener('focusroom-local-timer', handleLocalTimerAction);
        window.addEventListener('focusroom-local-music', handleLocalMusicAction);
        window.addEventListener('focusroom-local-spotify', handleLocalSpotifyAction);
        window.addEventListener('focusroom-local-theme', handleLocalThemeAction);

        return () => {
            window.removeEventListener('focusroom-local-timer', handleLocalTimerAction);
            window.removeEventListener('focusroom-local-music', handleLocalMusicAction);
            window.removeEventListener('focusroom-local-spotify', handleLocalSpotifyAction);
            window.removeEventListener('focusroom-local-theme', handleLocalThemeAction);
        };
    }, [inRoom, addSyncLog]);

    const joinRoom = useCallback((code: string) => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        setConnectionStatus('connecting');
        setErrorMsg('');

        const channelName = `focus-room:${code}`;
        const channel = supabase.channel(channelName, {
            config: { presence: { key: userRef.current.id } },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const otherMembers: RoomMember[] = [];
                Object.entries(state).forEach(([key, presences]) => {
                    if (key !== userRef.current.id && presences.length > 0) {
                        const p = presences[0] as Record<string, unknown>;
                        otherMembers.push({
                            id: (p.id as string) || key,
                            name: (p.name as string) || 'Unknown',
                            timeRemaining: (p.timeRemaining as number) ?? -1,
                            mode: (p.mode as string) || 'study',
                            joinedAt: (p.joinedAt as number) || Date.now(),
                            color: (p.color as string) || COLORS[0],
                            online_at: (p.online_at as string) || new Date().toISOString(),
                        });
                    }
                });
                setMembers(otherMembers);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                if (key !== userRef.current.id && newPresences.length > 0) {
                    const p = newPresences[0] as Record<string, unknown>;
                    const name = (p.name as string) || 'Unknown';
                    addSyncLog(`🟢 ${name} joined`);
                    setMembers(prev => {
                        const memberId = (p.id as string) || key;
                        const existing = prev.findIndex(m => m.id === memberId);
                        const member: RoomMember = {
                            id: memberId, name,
                            timeRemaining: (p.timeRemaining as number) ?? -1,
                            mode: (p.mode as string) || 'study',
                            joinedAt: (p.joinedAt as number) || Date.now(),
                            color: (p.color as string) || COLORS[0],
                            online_at: (p.online_at as string) || new Date().toISOString(),
                        };
                        if (existing >= 0) {
                            const updated = [...prev];
                            updated[existing] = member;
                            return updated;
                        }
                        return [...prev, member];
                    });
                }
            })
            .on('presence', { event: 'leave' }, ({ key }) => {
                if (key !== userRef.current.id) {
                    setMembers(prev => {
                        const member = prev.find(m => m.id === key);
                        if (member) addSyncLog(`🔴 ${member.name} left`);
                        return prev.filter(m => m.id !== key);
                    });
                }
            })
            // ─── SYNC: Listen for REMOTE broadcast events ───
            .on('broadcast', { event: 'timer-sync' }, ({ payload }) => {
                if (payload.fromId === userRef.current.id) return;
                console.log('[FocusRoom] Remote timer sync:', payload);
                addSyncLog(`📥 ${payload.fromName} ${payload.action}ed timer`);
                // Dispatch to PomodoroTimer
                window.dispatchEvent(new CustomEvent('focusroom-remote-timer', { detail: payload }));
            })
            .on('broadcast', { event: 'music-sync' }, ({ payload }) => {
                if (payload.fromId === userRef.current.id) return;
                console.log('[FocusRoom] Remote music sync:', payload);
                addSyncLog(`📥 ${payload.fromName} ${payload.action}ed music`);
                // Dispatch to MusicPlayer
                window.dispatchEvent(new CustomEvent('focusroom-remote-music', { detail: payload }));
            })
            .on('broadcast', { event: 'spotify-sync' }, ({ payload }) => {
                if (payload.fromId === userRef.current.id) return;
                console.log('[FocusRoom] Remote spotify sync:', payload);
                addSyncLog(`📥 ${payload.fromName} changed Spotify playlist`);
                // Dispatch to SpotifyPlayer
                window.dispatchEvent(new CustomEvent('focusroom-remote-spotify', { detail: payload }));
            })
            .on('broadcast', { event: 'theme-sync' }, ({ payload }) => {
                if (payload.fromId === userRef.current.id) return;
                console.log('[FocusRoom] Remote theme sync:', payload);
                addSyncLog(`📥 ${payload.fromName} switched to ${payload.mode} mode`);
                // Dispatch to ThemeProvider
                window.dispatchEvent(new CustomEvent('focusroom-remote-theme', { detail: payload }));
            })
            .subscribe(async (status, err) => {
                console.log('[FocusRoom] Channel status:', status, err);
                if (status === 'SUBSCRIBED') {
                    setConnectionStatus('connected');
                    setErrorMsg('');
                    await channel.track(buildPresenceState());
                } else if (status === 'CHANNEL_ERROR') {
                    setConnectionStatus('error');
                    setErrorMsg(`Connection failed: ${err?.message || 'Unknown error'}`);
                } else if (status === 'TIMED_OUT') {
                    setConnectionStatus('error');
                    setErrorMsg('Connection timed out');
                }
            });

        channelRef.current = channel;
        setRoomCode(code);
        setInRoom(true);
        localStorage.setItem(ROOM_STATE_KEY, JSON.stringify({ code }));
    }, [buildPresenceState, addSyncLog]);

    const leaveRoom = useCallback(() => {
        if (channelRef.current) {
            channelRef.current.untrack();
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
        setInRoom(false);
        setMembers([]);
        setRoomCode('');
        setConnectionStatus('idle');
        setErrorMsg('');
        setSyncLog([]);
        localStorage.removeItem(ROOM_STATE_KEY);
    }, []);

    const createRoom = () => joinRoom(generateRoomCode());
    const handleJoin = () => {
        const t = joinInput.trim().toUpperCase();
        if (t.length >= 4) joinRoom(t);
    };

    const formatTimer = (secs: number) => {
        if (secs < 0) return 'Idle';
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const copyCode = () => {
        navigator.clipboard?.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const updateUserName = (newName: string) => {
        setUserName(newName);
        userNameRef.current = newName;
        userRef.current.name = newName;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userRef.current));
        if (channelRef.current && inRoom) {
            channelRef.current.track(buildPresenceState()).catch(() => { });
        }
    };

    useEffect(() => {
        return () => {
            if (channelRef.current) {
                channelRef.current.untrack();
                supabase.removeChannel(channelRef.current);
            }
        };
    }, []);

    if (!isOpen) return null;

    const statusDot = connectionStatus === 'connected'
        ? 'bg-green-400' : connectionStatus === 'connecting'
            ? 'bg-yellow-400 animate-pulse' : connectionStatus === 'error'
                ? 'bg-red-400' : 'bg-white/20';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                onClick={e => e.stopPropagation()}
                className={`relative w-[90vw] max-w-md p-6 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl max-h-[85vh] overflow-y-auto
                    ${theme.colors.glass}`}
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className={`text-lg font-semibold ${theme.colors.accent}`}>
                        👥 Focus Room
                    </h2>
                    <button onClick={() => { if (inRoom) leaveRoom(); onClose(); }}
                        className="text-white/40 hover:text-white/90 transition-colors text-xl">✕</button>
                </div>

                {!inRoom ? (
                    <div className="space-y-4">
                        <p className="text-sm text-white/50">
                            Study together in sync. Share timers and music controls with friends in real-time.
                        </p>

                        {errorMsg && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-red-400/80 text-xs">
                                {errorMsg}
                            </div>
                        )}

                        <button
                            onClick={createRoom}
                            disabled={connectionStatus === 'connecting'}
                            className="w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium text-white transition-all border border-white/10 disabled:opacity-50"
                        >
                            {connectionStatus === 'connecting' ? '⏳ Creating...' : '✨ Create Room'}
                        </button>

                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-[10px] text-white/30 uppercase">or</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        <div className="flex gap-2">
                            <input
                                value={joinInput}
                                onChange={e => setJoinInput(e.target.value.toUpperCase())}
                                placeholder="ROOM CODE"
                                maxLength={6}
                                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/25 tracking-widest text-center uppercase font-mono"
                            />
                            <button
                                onClick={handleJoin}
                                disabled={connectionStatus === 'connecting' || joinInput.trim().length < 4}
                                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium text-white transition-all disabled:opacity-50"
                            >
                                {connectionStatus === 'connecting' ? '...' : 'Join'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Room Code + Status */}
                        <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-white/30 uppercase tracking-widest">Room</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                                </div>
                                <div className="text-xl font-mono tracking-[0.3em] text-white/90">{roomCode}</div>
                            </div>
                            <button onClick={copyCode} className="text-white/40 hover:text-white/80 transition-colors text-sm">
                                {copied ? '✅' : '📋'}
                            </button>
                        </div>

                        {errorMsg && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-red-400/80 text-xs">
                                {errorMsg}
                                <button onClick={() => joinRoom(roomCode)} className="ml-2 underline">Retry</button>
                            </div>
                        )}

                        {/* You */}
                        <div className="bg-white/[0.07] rounded-xl px-4 py-3 border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{ backgroundColor: userRef.current.color + '30', color: userRef.current.color }}>
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <input value={userName} onChange={e => updateUserName(e.target.value)}
                                            className="text-sm text-white/90 bg-transparent outline-none border-b border-transparent hover:border-white/20 focus:border-white/40 transition-colors w-24"
                                            maxLength={20} />
                                        <span className="text-white/30 text-xs">(you)</span>
                                    </div>
                                    <div className={`text-xs ${isTimerActive ? 'text-green-400/70' : 'text-white/30'}`}>
                                        {isTimerActive ? `${formatTimer(timerSeconds)} · ${mode}` : 'Idle'}
                                    </div>
                                </div>
                                {isTimerActive && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                            </div>
                        </div>

                        {/* Members */}
                        {members.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-[10px] text-white/20 uppercase tracking-widest">
                                    {members.length} {members.length === 1 ? 'friend' : 'friends'} in room
                                </div>
                                {members.map(m => (
                                    <div key={m.id} className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                            style={{ backgroundColor: m.color + '30', color: m.color }}>
                                            {m.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm text-white/70">{m.name}</div>
                                            <div className={`text-xs ${m.timeRemaining >= 0 ? 'text-green-400/70' : 'text-white/30'}`}>
                                                {formatTimer(m.timeRemaining)}
                                                {m.mode && m.timeRemaining >= 0 && <span className="ml-1 text-white/20">· {m.mode}</span>}
                                            </div>
                                        </div>
                                        {m.timeRemaining >= 0 && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                                    </div>
                                ))}
                            </div>
                        )}

                        {members.length === 0 && (
                            <div className="text-center py-3">
                                <p className="text-white/20 text-xs">Share the code — friends will appear here</p>
                            </div>
                        )}

                        {/* Sync Activity Log */}
                        {syncLog.length > 0 && (
                            <div className="bg-white/[0.03] rounded-xl px-4 py-2 border border-white/5">
                                <div className="text-[10px] text-white/20 uppercase tracking-widest mb-1">Sync Activity</div>
                                {syncLog.map((log, i) => (
                                    <div key={i} className="text-[11px] text-white/40 py-0.5">{log}</div>
                                ))}
                            </div>
                        )}

                        <button onClick={leaveRoom}
                            className="w-full px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400/70 text-sm transition-all border border-red-500/10">
                            Leave Room
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

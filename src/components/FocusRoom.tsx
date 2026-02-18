
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@/providers/ThemeProvider';

interface RoomMember {
    id: string;
    name: string;
    timeRemaining: number; // seconds, -1 = idle
    mode: string;
    joinedAt: number;
    color: string;
}

const COLORS = ['#93c5fd', '#c4b5fd', '#fdba74', '#86efac', '#fca5a5', '#f0abfc', '#67e8f9'];
const STORAGE_KEY = 'lucid-room-user';
const CHANNEL_NAME = 'lucid-focus-room';

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
    const channelRef = useRef<BroadcastChannel | null>(null);
    const userRef = useRef(getOrCreateUser());
    const broadcastInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const u = getOrCreateUser();
        userRef.current = u;
        setUserName(u.name);
    }, []);

    const joinRoom = useCallback((code: string) => {
        if (channelRef.current) channelRef.current.close();

        const channel = new BroadcastChannel(`${CHANNEL_NAME}-${code}`);
        channelRef.current = channel;

        channel.onmessage = (e) => {
            const msg = e.data;
            if (msg.type === 'heartbeat' && msg.member.id !== userRef.current.id) {
                setMembers(prev => {
                    const existing = prev.findIndex(m => m.id === msg.member.id);
                    if (existing >= 0) {
                        const updated = [...prev];
                        updated[existing] = msg.member;
                        return updated;
                    }
                    return [...prev, msg.member];
                });
            } else if (msg.type === 'leave' && msg.id !== userRef.current.id) {
                setMembers(prev => prev.filter(m => m.id !== msg.id));
            }
        };

        // Send initial join
        channel.postMessage({
            type: 'heartbeat',
            member: {
                id: userRef.current.id,
                name: userRef.current.name,
                timeRemaining: isTimerActive ? timerSeconds : -1,
                mode,
                joinedAt: Date.now(),
                color: userRef.current.color,
            } as RoomMember,
        });

        setRoomCode(code);
        setInRoom(true);
    }, [isTimerActive, mode, timerSeconds]);

    // Broadcast heartbeat every 2s
    useEffect(() => {
        if (!inRoom || !channelRef.current) return;

        broadcastInterval.current = setInterval(() => {
            channelRef.current?.postMessage({
                type: 'heartbeat',
                member: {
                    id: userRef.current.id,
                    name: userRef.current.name,
                    timeRemaining: isTimerActive ? timerSeconds : -1,
                    mode,
                    joinedAt: Date.now(),
                    color: userRef.current.color,
                } as RoomMember,
            });
        }, 2000);

        return () => {
            if (broadcastInterval.current) clearInterval(broadcastInterval.current);
        };
    }, [inRoom, isTimerActive, timerSeconds, mode]);

    // Prune stale members (no heartbeat for 10s)
    useEffect(() => {
        if (!inRoom) return;
        const interval = setInterval(() => {
            setMembers(prev => prev.filter(m => Date.now() - m.joinedAt < 10000));
        }, 5000);
        return () => clearInterval(interval);
    }, [inRoom]);

    const leaveRoom = () => {
        channelRef.current?.postMessage({ type: 'leave', id: userRef.current.id });
        channelRef.current?.close();
        channelRef.current = null;
        setInRoom(false);
        setMembers([]);
        setRoomCode('');
    };

    const createRoom = () => {
        const code = generateRoomCode();
        joinRoom(code);
    };

    const handleJoin = () => {
        if (joinInput.trim().length >= 4) {
            joinRoom(joinInput.trim().toUpperCase());
        }
    };

    const formatTimer = (secs: number) => {
        if (secs < 0) return 'Idle';
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const copyCode = () => {
        navigator.clipboard?.writeText(roomCode);
    };

    useEffect(() => {
        return () => {
            channelRef.current?.postMessage({ type: 'leave', id: userRef.current.id });
            channelRef.current?.close();
            if (broadcastInterval.current) clearInterval(broadcastInterval.current);
        };
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                onClick={e => e.stopPropagation()}
                className={`relative w-[90vw] max-w-md p-6 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl
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
                            Study together in silent accountability. See friends' timer status in real-time.
                        </p>

                        <button
                            onClick={createRoom}
                            className="w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium text-white transition-all border border-white/10"
                        >
                            ✨ Create Room
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
                                placeholder="Room code"
                                maxLength={6}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/25 tracking-widest text-center uppercase font-mono"
                            />
                            <button
                                onClick={handleJoin}
                                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium text-white transition-all"
                            >
                                Join
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Room Code */}
                        <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                            <div>
                                <div className="text-[10px] text-white/30 uppercase tracking-widest">Room Code</div>
                                <div className="text-xl font-mono tracking-[0.3em] text-white/90">{roomCode}</div>
                            </div>
                            <button onClick={copyCode} className="text-white/40 hover:text-white/80 transition-colors text-sm">
                                📋 Copy
                            </button>
                        </div>

                        {/* You */}
                        <div className="bg-white/[0.07] rounded-xl px-4 py-3 border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{ backgroundColor: userRef.current.color + '30', color: userRef.current.color }}>
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-white/90">{userName} <span className="text-white/30 text-xs">(you)</span></div>
                                    <div className={`text-xs ${isTimerActive ? 'text-green-400/70' : 'text-white/30'}`}>
                                        {isTimerActive ? formatTimer(timerSeconds) : 'Idle'}
                                    </div>
                                </div>
                                {isTimerActive && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                            </div>
                        </div>

                        {/* Members */}
                        {members.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-[10px] text-white/20 uppercase tracking-widest">In Room</div>
                                {members.map(m => (
                                    <div key={m.id} className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                            style={{ backgroundColor: m.color + '30', color: m.color }}>
                                            {m.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm text-white/70">{m.name}</div>
                                            <div className={`text-xs ${m.timeRemaining >= 0 ? 'text-green-400/70' : 'text-white/30'}`}>
                                                {formatTimer(m.timeRemaining)}
                                            </div>
                                        </div>
                                        {m.timeRemaining >= 0 && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                                    </div>
                                ))}
                            </div>
                        )}

                        {members.length === 0 && (
                            <p className="text-center text-white/20 text-xs py-3">
                                Share the room code with friends to study together!
                            </p>
                        )}

                        <button
                            onClick={leaveRoom}
                            className="w-full px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400/70 text-sm transition-all border border-red-500/10"
                        >
                            Leave Room
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

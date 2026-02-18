
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { useSessionStats } from '@/hooks/useSessionStats';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface Preset {
    name: string;
    focus: number;
    shortBreak: number;
    longBreak: number;
}

const DEFAULT_PRESETS: Preset[] = [
    { name: 'Classic', focus: 25, shortBreak: 5, longBreak: 15 },
    { name: 'Deep Work', focus: 50, shortBreak: 10, longBreak: 30 },
    { name: 'Sprint', focus: 15, shortBreak: 3, longBreak: 10 },
];

const PRESETS_KEY = 'lucid-timer-presets';
const ACTIVE_PRESET_KEY = 'lucid-active-preset';

function loadPresets(): Preset[] {
    if (typeof window === 'undefined') return DEFAULT_PRESETS;
    try {
        const saved = localStorage.getItem(PRESETS_KEY);
        return saved ? JSON.parse(saved) : DEFAULT_PRESETS;
    } catch { return DEFAULT_PRESETS; }
}

function loadActivePreset(): number {
    if (typeof window === 'undefined') return 0;
    try {
        const saved = localStorage.getItem(ACTIVE_PRESET_KEY);
        return saved ? parseInt(saved) : 0;
    } catch { return 0; }
}

interface PomodoroTimerProps {
    onTimerChange?: (timeLeft: number, isActive: boolean) => void;
}

export default function PomodoroTimer({ onTimerChange }: PomodoroTimerProps = {}) {
    const { theme } = useTheme();
    const { completeSession } = useSessionStats();

    const [presets, setPresets] = useState<Preset[]>(DEFAULT_PRESETS);
    const [activePresetIdx, setActivePresetIdx] = useState(0);
    const [showPresets, setShowPresets] = useState(false);

    const preset = presets[activePresetIdx] || presets[0];

    const getModeTime = useCallback((m: TimerMode) => {
        if (m === 'focus') return preset.focus * 60;
        if (m === 'shortBreak') return preset.shortBreak * 60;
        return preset.longBreak * 60;
    }, [preset]);

    const [mode, setMode] = useState<TimerMode>('focus');
    const [timeLeft, setTimeLeft] = useState(getModeTime('focus'));
    const [isActive, setIsActive] = useState(false);
    const [sessionCount, setSessionCount] = useState(0); // Completed focus sessions in current cycle
    const [autoCycle, setAutoCycle] = useState(true);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Load presets on mount
    useEffect(() => {
        setPresets(loadPresets());
        setActivePresetIdx(loadActivePreset());
    }, []);

    // Update time when preset changes
    useEffect(() => {
        if (!isActive) {
            setTimeLeft(getModeTime(mode));
        }
    }, [activePresetIdx, preset, mode, isActive, getModeTime]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const fromRemoteRef = useRef(false);

    // Emit events to FocusRoom for broadcasting (only for local user actions)
    const emitTimerEvent = useCallback((action: string, extras?: Record<string, unknown>) => {
        if (fromRemoteRef.current) return; // Don't re-emit remote actions
        window.dispatchEvent(new CustomEvent('focusroom-local-timer', {
            detail: { action, ...extras },
        }));
    }, []);

    const startTimer = () => {
        if (isActive) return;
        setIsActive(true);
        startTimeRef.current = Date.now();
        emitTimerEvent('start', { timeLeft, mode });
    };

    const pauseTimer = () => {
        setIsActive(false);
        emitTimerEvent('pause', { timeLeft, mode });
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(getModeTime(mode));
        emitTimerEvent('reset', { mode });
    };

    const switchMode = (newMode: TimerMode) => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(getModeTime(newMode));
        emitTimerEvent('switchMode', { mode: newMode });
    };

    // ─── Listen for remote timer commands from FocusRoom ───
    useEffect(() => {
        const handleRemote = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            console.log('[PomodoroTimer] Remote command:', detail);
            fromRemoteRef.current = true;
            try {
                switch (detail.action) {
                    case 'start':
                        if (detail.timeLeft != null) setTimeLeft(detail.timeLeft);
                        if (detail.mode) { setMode(detail.mode); }
                        setIsActive(true);
                        startTimeRef.current = Date.now();
                        break;
                    case 'pause':
                        setIsActive(false);
                        if (detail.timeLeft != null) setTimeLeft(detail.timeLeft);
                        break;
                    case 'reset':
                        setIsActive(false);
                        if (detail.mode) {
                            setMode(detail.mode);
                            setTimeLeft(getModeTime(detail.mode));
                        } else {
                            setTimeLeft(getModeTime(mode));
                        }
                        break;
                    case 'switchMode':
                        if (detail.mode) {
                            setMode(detail.mode);
                            setIsActive(false);
                            setTimeLeft(getModeTime(detail.mode));
                        }
                        break;
                }
            } finally {
                // Reset after a tick to allow state updates to settle
                setTimeout(() => { fromRemoteRef.current = false; }, 100);
            }
        };

        window.addEventListener('focusroom-remote-timer', handleRemote);
        return () => window.removeEventListener('focusroom-remote-timer', handleRemote);
    }, [mode, getModeTime]);

    // Auto-cycle logic
    const handleTimerComplete = useCallback(() => {
        setIsActive(false);

        if (mode === 'focus') {
            // Record session stats
            completeSession(preset.focus);
            const newCount = sessionCount + 1;
            setSessionCount(newCount);

            if (autoCycle) {
                if (newCount % 4 === 0) {
                    // Long break after 4 focus sessions
                    setMode('longBreak');
                    setTimeLeft(getModeTime('longBreak'));
                    setTimeout(() => setIsActive(true), 1500);
                } else {
                    setMode('shortBreak');
                    setTimeLeft(getModeTime('shortBreak'));
                    setTimeout(() => setIsActive(true), 1500);
                }
            }
        } else if (autoCycle) {
            // Break complete → back to focus
            setMode('focus');
            setTimeLeft(getModeTime('focus'));
            setTimeout(() => setIsActive(true), 1500);
        }
    }, [mode, sessionCount, autoCycle, preset.focus, completeSession, getModeTime]);

    // Timer tick
    useEffect(() => {
        if (isActive && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleTimerComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, timeLeft, handleTimerComplete]);

    // Notify parent of timer state changes
    useEffect(() => {
        onTimerChange?.(timeLeft, isActive);
    }, [timeLeft, isActive, onTimerChange]);

    // Document Title
    useEffect(() => {
        const modeLabel = mode === 'focus' ? 'Focus' : mode === 'shortBreak' ? 'Break' : 'Long Break';
        document.title = `${formatTime(timeLeft)} - ${modeLabel} | Lucid LoFi`;
    }, [timeLeft, mode]);

    const selectPreset = (idx: number) => {
        setActivePresetIdx(idx);
        localStorage.setItem(ACTIVE_PRESET_KEY, idx.toString());
        setShowPresets(false);
        setIsActive(false);
        const p = presets[idx];
        setTimeLeft(p.focus * 60);
        setMode('focus');
    };

    const totalTime = getModeTime(mode);
    const progress = ((totalTime - timeLeft) / totalTime) * 100;
    const circumference = 2 * Math.PI * 120;

    // Cycle indicator - 4 dots
    const cycleDots = Array.from({ length: 4 }, (_, i) => i < (sessionCount % 4));

    return (
        <div className="relative flex flex-col items-center justify-center p-4 z-50 pointer-events-auto select-none">

            {/* Mode Buttons */}
            <div className="flex gap-3 mb-6 z-50 pointer-events-auto">
                {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={(e) => { e.stopPropagation(); switchMode(m); }}
                        className={`text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all duration-200
              ${mode === m
                                ? 'bg-white/10 border-white/20 text-white font-bold shadow-lg'
                                : 'bg-transparent border-transparent text-white/40 hover:text-white/80 hover:bg-white/5'
                            }`}
                    >
                        {m === 'focus' ? 'Focus' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
                    </button>
                ))}
            </div>

            {/* Glassmorphism Timer Card */}
            <div className="relative">
                {/* Glass Card */}
                <div
                    onClick={(e) => { e.stopPropagation(); isActive ? pauseTimer() : startTimer(); }}
                    className="relative z-10 cursor-pointer group
                        w-64 h-64 md:w-80 md:h-80
                        flex items-center justify-center
                        rounded-full
                        backdrop-blur-xl bg-white/[0.03] border border-white/10
                        shadow-[0_0_80px_rgba(0,0,0,0.3),inset_0_0_80px_rgba(255,255,255,0.02)]
                        transition-all duration-500
                        hover:border-white/15 hover:shadow-[0_0_100px_rgba(0,0,0,0.4)]"
                >
                    {/* Timer Display */}
                    <div className="text-center">
                        <div className={`text-6xl md:text-8xl font-digital tracking-wider tabular-nums transition-all duration-300
                            ${theme.colors.accent} drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]
                            ${isActive ? 'scale-105' : 'opacity-90'}`}
                        >
                            {formatTime(timeLeft)}
                        </div>

                        {/* Hover hint */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-2">
                            <span className="text-white/20 text-xs uppercase tracking-widest">
                                {isActive ? 'Pause' : 'Start'}
                            </span>
                        </div>
                    </div>

                    {/* Progress Ring SVG */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 260 260">
                        <circle cx="130" cy="130" r="120" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                        <circle cx="130" cy="130" r="120" fill="none"
                            stroke="currentColor" strokeWidth="2.5"
                            className={theme.colors.accent}
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - (circumference * progress) / 100}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 6px currentColor)' }}
                        />
                    </svg>
                </div>

                {/* Ambient glow behind card */}
                <div className={`absolute inset-0 rounded-full blur-3xl opacity-10 transition-opacity duration-1000 ${isActive ? 'opacity-20' : 'opacity-5'}`}
                    style={{ background: 'radial-gradient(circle, currentColor, transparent)' }}
                />
            </div>

            {/* Cycle Dots */}
            <div className="flex items-center gap-2 mt-4 mb-2">
                {cycleDots.map((filled, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300
                        ${filled ? 'bg-white/60 scale-110' : 'bg-white/15'}`}
                    />
                ))}
                <span className="text-[9px] text-white/20 ml-2 uppercase tracking-widest">
                    {autoCycle ? 'Auto' : 'Manual'}
                </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mt-2 z-50 pointer-events-auto">
                <button
                    onClick={(e) => { e.stopPropagation(); isActive ? pauseTimer() : startTimer(); }}
                    className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium tracking-wide transition-all border border-white/5 shadow-lg active:scale-95"
                >
                    {isActive ? 'PAUSE' : 'START'}
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); resetTimer(); }}
                    className="px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium tracking-wide transition-all border border-white/5 active:scale-95"
                >
                    RESET
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); setAutoCycle(!autoCycle); }}
                    className={`px-3 py-2 rounded-full text-xs transition-all border active:scale-95
                        ${autoCycle
                            ? 'bg-white/10 border-white/20 text-white/80'
                            : 'bg-white/5 border-white/5 text-white/30 hover:text-white/60'
                        }`}
                    title={autoCycle ? 'Auto-cycle ON' : 'Auto-cycle OFF'}
                >
                    🔄
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); setShowPresets(!showPresets); }}
                    className="px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80 text-xs transition-all border border-white/5 active:scale-95"
                    title="Timer Presets"
                >
                    ⚙️
                </button>
            </div>

            {/* Preset Selector */}
            {showPresets && (
                <div className="mt-4 p-4 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-xl w-full max-w-xs">
                    <div className="text-[10px] uppercase tracking-widest text-white/30 mb-3">Timer Presets</div>
                    <div className="space-y-2">
                        {presets.map((p, i) => (
                            <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); selectPreset(i); }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all
                                    ${i === activePresetIdx
                                        ? 'bg-white/10 border border-white/20'
                                        : 'bg-white/[0.02] hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <span className="text-sm text-white/80">{p.name}</span>
                                <span className="text-[10px] text-white/30">
                                    {p.focus}/{p.shortBreak}/{p.longBreak}m
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

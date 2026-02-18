
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { useDeviceMode } from '@/providers/DeviceModeProvider';

export default function SleepAlarm() {
    const { theme } = useTheme();
    const { device } = useDeviceMode();
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(30);
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [isActive, setIsActive] = useState(false);
    const [isRinging, setIsRinging] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Create alarm sound using Web Audio API
    const playAlarmSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const playBeep = (time: number, freq: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.3, time);
                gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
                osc.start(time);
                osc.stop(time + 0.5);
            };

            // Play a gentle chime pattern
            for (let i = 0; i < 6; i++) {
                playBeep(ctx.currentTime + i * 0.7, 523.25); // C5
                playBeep(ctx.currentTime + i * 0.7 + 0.2, 659.25); // E5
                playBeep(ctx.currentTime + i * 0.7 + 0.4, 783.99); // G5
            }
        } catch (e) {
            console.log('Audio not available');
        }
    };

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (h > 0) {
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const startAlarm = () => {
        const totalSeconds = hours * 3600 + minutes * 60;
        if (totalSeconds <= 0) return;
        setTimeLeft(totalSeconds);
        setIsActive(true);
        setIsRinging(false);
    };

    const stopAlarm = () => {
        setIsActive(false);
        setIsRinging(false);
        setTimeLeft(0);
    };

    const dismissAlarm = () => {
        setIsRinging(false);
        setIsActive(false);
        setTimeLeft(0);
    };

    // Scroll handlers for hours/minutes
    const adjustValue = (type: 'hours' | 'minutes', delta: number) => {
        if (isActive) return;
        if (type === 'hours') {
            setHours(prev => Math.max(0, Math.min(23, prev + delta)));
        } else {
            setMinutes(prev => {
                const next = prev + delta;
                if (next < 0) return 55;
                if (next >= 60) return 0;
                return next;
            });
        }
    };

    // Timer Effect
    useEffect(() => {
        if (isActive && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsActive(false);
                        setIsRinging(true);
                        playAlarmSound();
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
    }, [isActive, timeLeft]);

    // Document Title
    useEffect(() => {
        if (isActive) {
            document.title = `${formatTime(timeLeft)} - Sleep Alarm | Lucid LoFi`;
        } else if (isRinging) {
            document.title = `⏰ WAKE UP! | Lucid LoFi`;
        }
    }, [timeLeft, isActive, isRinging]);

    const totalSeconds = hours * 3600 + minutes * 60;
    const progress = totalSeconds > 0 && isActive ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;

    const isMobile = device === 'mobile';

    return (
        <div className="relative flex flex-col items-center justify-center p-8 z-50 pointer-events-auto select-none">

            {/* Ringing State */}
            {isRinging && (
                <div className="flex flex-col items-center gap-6 animate-pulse">
                    <div className={isMobile ? "text-6xl" : "text-8xl"}>⏰</div>
                    <div className={`${isMobile ? "text-3xl" : "text-5xl"} font-light tracking-widest ${theme.colors.accent}`}>
                        WAKE UP
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); dismissAlarm(); }}
                        className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium tracking-wide transition-all border border-white/10 shadow-lg active:scale-95 text-lg"
                    >
                        DISMISS
                    </button>
                </div>
            )}

            {/* Setup State - Time Picker */}
            {!isActive && !isRinging && (
                <div className="flex flex-col items-center gap-8">
                    <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-2">
                        Sleep Alarm
                    </div>

                    {/* Time Picker */}
                    <div className="flex items-center gap-4">
                        {/* Hours */}
                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); adjustValue('hours', 1); }}
                                className="text-white/30 hover:text-white/80 transition-colors text-2xl font-light px-4 py-1"
                            >
                                ▲
                            </button>
                            <div className={`${isMobile ? "text-5xl sm:text-7xl" : "text-9xl"} font-digital tabular-nums ${theme.colors.accent} drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]`}>
                                {hours.toString().padStart(2, '0')}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); adjustValue('hours', -1); }}
                                className="text-white/30 hover:text-white/80 transition-colors text-2xl font-light px-4 py-1"
                            >
                                ▼
                            </button>
                            <span className="text-xs uppercase tracking-widest text-white/30 mt-1">Hours</span>
                        </div>

                        {/* Separator */}
                        <div className={`${isMobile ? "text-4xl sm:text-6xl pb-4" : "text-8xl pb-8"} font-light ${theme.colors.accent} opacity-40`}>:</div>

                        {/* Minutes */}
                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); adjustValue('minutes', 5); }}
                                className="text-white/30 hover:text-white/80 transition-colors text-2xl font-light px-4 py-1"
                            >
                                ▲
                            </button>
                            <div className={`${isMobile ? "text-5xl sm:text-7xl" : "text-9xl"} font-digital tabular-nums ${theme.colors.accent} drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]`}>
                                {minutes.toString().padStart(2, '0')}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); adjustValue('minutes', -5); }}
                                className="text-white/30 hover:text-white/80 transition-colors text-2xl font-light px-4 py-1"
                            >
                                ▼
                            </button>
                            <span className="text-xs uppercase tracking-widest text-white/30 mt-1">Minutes</span>
                        </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex gap-3 mt-2">
                        {[
                            { h: 0, m: 15, label: '15m' },
                            { h: 0, m: 30, label: '30m' },
                            { h: 1, m: 0, label: '1h' },
                            { h: 2, m: 0, label: '2h' },
                            { h: 6, m: 0, label: '6h' },
                            { h: 8, m: 0, label: '8h' },
                        ].map(p => (
                            <button
                                key={p.label}
                                onClick={(e) => { e.stopPropagation(); setHours(p.h); setMinutes(p.m); }}
                                className={`text-xs uppercase tracking-widest px-3 py-2 rounded-lg border transition-all duration-200
                  ${hours === p.h && minutes === p.m
                                        ? 'bg-white/10 border-white/20 text-white font-bold shadow-lg'
                                        : 'bg-transparent border-transparent text-white/40 hover:text-white/80 hover:bg-white/5'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); startAlarm(); }}
                        disabled={totalSeconds <= 0}
                        className={`px-8 py-3 rounded-full font-medium tracking-wide transition-all border border-white/5 shadow-lg active:scale-95 text-lg mt-4
              ${totalSeconds > 0
                                ? 'bg-white/10 hover:bg-white/20 text-white'
                                : 'bg-white/5 text-white/20 cursor-not-allowed'
                            }`}
                    >
                        SET ALARM
                    </button>
                </div>
            )}

            {/* Countdown State */}
            {isActive && !isRinging && (
                <div className="flex flex-col items-center gap-6">
                    <div className="text-xs uppercase tracking-[0.4em] text-white/40">
                        Alarm In
                    </div>

                    <div
                        className="relative z-50 pointer-events-auto cursor-default"
                    >
                        <div className={`${isMobile ? "text-5xl sm:text-7xl" : "text-9xl"} font-digital tracking-tighter tabular-nums transition-all duration-300
              ${theme.colors.accent} drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-105
            `}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); stopAlarm(); }}
                        className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium tracking-wide transition-all border border-white/5 shadow-lg active:scale-95 mt-4"
                    >
                        CANCEL
                    </button>
                </div>
            )}

            {/* Progress Ring */}
            {isActive && (
                <svg className="absolute inset-0 w-[120%] h-[120%] -left-[10%] -top-[10%] -rotate-90 pointer-events-none opacity-20" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white/10" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" className={theme.colors.accent}
                        strokeDasharray="283" strokeDashoffset={283 - (283 * progress) / 100} strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                </svg>
            )}
        </div>
    );
}

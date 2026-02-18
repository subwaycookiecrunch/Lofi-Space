
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/providers/ThemeProvider';

type Phase = 'inhale' | 'hold' | 'exhale' | 'idle';

const PHASES: { type: Phase; duration: number; label: string }[] = [
    { type: 'inhale', duration: 4000, label: 'Breathe In' },
    { type: 'hold', duration: 4000, label: 'Hold' },
    { type: 'exhale', duration: 6000, label: 'Breathe Out' },
];

const TOTAL_CYCLE = PHASES.reduce((sum, p) => sum + p.duration, 0); // 14s

export default function BreathingExercise() {
    const { theme } = useTheme();
    const [isActive, setIsActive] = useState(false);
    const [currentPhase, setCurrentPhase] = useState<Phase>('idle');
    const [phaseLabel, setPhaseLabel] = useState('Tap to Begin');
    const [scale, setScale] = useState(0.6);
    const [cycleCount, setCycleCount] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const phaseIndexRef = useRef(0);

    useEffect(() => {
        if (!isActive) {
            if (timerRef.current) clearTimeout(timerRef.current);
            setCurrentPhase('idle');
            setPhaseLabel('Tap to Begin');
            setScale(0.6);
            phaseIndexRef.current = 0;
            return;
        }

        const runPhase = () => {
            const idx = phaseIndexRef.current % PHASES.length;
            const phase = PHASES[idx];
            setCurrentPhase(phase.type);
            setPhaseLabel(phase.label);

            // Set scale based on phase
            if (phase.type === 'inhale') setScale(1);
            else if (phase.type === 'hold') setScale(1);
            else if (phase.type === 'exhale') setScale(0.6);

            // Track cycles
            if (idx === 0) setCycleCount(prev => prev + 1);

            timerRef.current = setTimeout(() => {
                phaseIndexRef.current += 1;
                runPhase();
            }, phase.duration);
        };

        runPhase();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isActive]);

    const toggle = () => {
        if (isActive) {
            setIsActive(false);
            setCycleCount(0);
        } else {
            setIsActive(true);
        }
    };

    const getTransitionDuration = () => {
        if (currentPhase === 'inhale') return '4s';
        if (currentPhase === 'exhale') return '6s';
        return '0.3s';
    };

    return (
        <div className="relative flex flex-col items-center justify-center p-8 z-50 pointer-events-auto select-none">
            {/* Title */}
            <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-8">
                Breathing Exercise
            </div>

            {/* Breathing Circle */}
            <div
                onClick={(e) => { e.stopPropagation(); toggle(); }}
                className="relative cursor-pointer mb-8"
            >
                {/* Outer glow ring */}
                <div
                    className="absolute inset-0 rounded-full blur-xl transition-all"
                    style={{
                        transform: `scale(${scale * 1.3})`,
                        transitionDuration: getTransitionDuration(),
                        transitionTimingFunction: currentPhase === 'inhale' ? 'ease-in' : 'ease-out',
                        background: `radial-gradient(circle, rgba(147, 130, 220, 0.2), transparent)`,
                    }}
                />

                {/* Main circle */}
                <div
                    className="w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center transition-all backdrop-blur-sm border border-white/10"
                    style={{
                        transform: `scale(${scale})`,
                        transitionDuration: getTransitionDuration(),
                        transitionTimingFunction: currentPhase === 'inhale' ? 'ease-in' : 'ease-out',
                        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), rgba(255,255,255,0.02))`,
                        boxShadow: isActive
                            ? `0 0 60px rgba(147, 130, 220, ${currentPhase === 'hold' ? 0.3 : 0.15}), inset 0 0 40px rgba(255,255,255,0.05)`
                            : 'inset 0 0 40px rgba(255,255,255,0.03)',
                    }}
                >
                    {/* Phase text */}
                    <div className="text-center">
                        <div className={`text-lg md:text-xl font-light tracking-widest transition-opacity duration-500 ${theme.colors.accent}`}>
                            {phaseLabel}
                        </div>
                        {isActive && (
                            <div className="text-[10px] uppercase tracking-widest text-white/30 mt-2">
                                Cycle {cycleCount}
                            </div>
                        )}
                    </div>
                </div>

                {/* Inner ring */}
                <div
                    className="absolute inset-4 rounded-full border border-white/5 transition-all"
                    style={{
                        transform: `scale(${scale * 0.95})`,
                        transitionDuration: getTransitionDuration(),
                        transitionTimingFunction: currentPhase === 'inhale' ? 'ease-in' : 'ease-out',
                    }}
                />
            </div>

            {/* Timing guide */}
            <div className="flex items-center gap-6 text-[10px] uppercase tracking-widest text-white/20">
                <span className={currentPhase === 'inhale' ? 'text-white/60' : ''}>In 4s</span>
                <span className={currentPhase === 'hold' ? 'text-white/60' : ''}>Hold 4s</span>
                <span className={currentPhase === 'exhale' ? 'text-white/60' : ''}>Out 6s</span>
            </div>

            {/* Stop button */}
            {isActive && (
                <button
                    onClick={(e) => { e.stopPropagation(); toggle(); }}
                    className="mt-6 px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 text-xs uppercase tracking-widest transition-all"
                >
                    Stop
                </button>
            )}
        </div>
    );
}

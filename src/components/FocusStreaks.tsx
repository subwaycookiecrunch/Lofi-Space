
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { useSessionStats } from '@/hooks/useSessionStats';

interface Unlock {
    id: string;
    name: string;
    emoji: string;
    description: string;
    sessionsRequired: number;
}

const UNLOCKS: Unlock[] = [
    { id: 'fireflies', name: 'Firefly Trail', emoji: '✨', description: 'Enhanced cursor particles', sessionsRequired: 3 },
    { id: 'ocean_theme', name: 'Ocean Theme', emoji: '🌊', description: 'Deep blue palette', sessionsRequired: 5 },
    { id: 'neon_glow', name: 'Neon Glow', emoji: '💜', description: 'Neon timer outline', sessionsRequired: 10 },
    { id: 'aurora', name: 'Aurora Borealis', emoji: '🌌', description: 'Northern lights background', sessionsRequired: 15 },
    { id: 'zen_master', name: 'Zen Master', emoji: '🧘', description: 'Golden breathing ring', sessionsRequired: 25 },
    { id: 'time_lord', name: 'Time Lord', emoji: '⏳', description: 'Crystal timer theme', sessionsRequired: 50 },
    { id: 'legend', name: 'Legend', emoji: '👑', description: 'Crown badge + all effects', sessionsRequired: 100 },
];

interface FocusStreaksProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FocusStreaks({ isOpen, onClose }: FocusStreaksProps) {
    const { theme } = useTheme();
    const { stats } = useSessionStats();

    if (!isOpen) return null;

    const totalSessions = stats.totalSessions;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                onClick={e => e.stopPropagation()}
                className={`relative w-[90vw] max-w-md p-6 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl max-h-[80vh] overflow-y-auto
                    ${theme.colors.glass}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className={`text-lg font-semibold tracking-wide ${theme.colors.accent}`}>
                            🏆 Focus Achievements
                        </h2>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                            {totalSessions} sessions completed
                        </p>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white/90 transition-colors text-xl">✕</button>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    {(() => {
                        const nextUnlock = UNLOCKS.find(u => u.sessionsRequired > totalSessions);
                        if (!nextUnlock) return (
                            <div className="text-center text-white/60 text-sm">
                                ✨ You've unlocked everything! Legend status achieved!
                            </div>
                        );
                        const prevTarget = UNLOCKS.filter(u => u.sessionsRequired <= totalSessions).pop()?.sessionsRequired || 0;
                        const progress = ((totalSessions - prevTarget) / (nextUnlock.sessionsRequired - prevTarget)) * 100;
                        return (
                            <div>
                                <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
                                    <span>Next: {nextUnlock.emoji} {nextUnlock.name}</span>
                                    <span>{totalSessions}/{nextUnlock.sessionsRequired}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Unlocks Grid */}
                <div className="space-y-2">
                    {UNLOCKS.map(unlock => {
                        const isUnlocked = totalSessions >= unlock.sessionsRequired;
                        return (
                            <div
                                key={unlock.id}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all
                                    ${isUnlocked
                                        ? 'bg-white/10 border border-white/15'
                                        : 'bg-white/[0.02] border border-white/5 opacity-50'
                                    }`}
                            >
                                <span className="text-2xl">{isUnlocked ? unlock.emoji : '🔒'}</span>
                                <div className="flex-1">
                                    <div className={`text-sm font-medium ${isUnlocked ? 'text-white/90' : 'text-white/40'}`}>
                                        {unlock.name}
                                    </div>
                                    <div className="text-[10px] text-white/30">
                                        {isUnlocked ? unlock.description : `${unlock.sessionsRequired} sessions required`}
                                    </div>
                                </div>
                                {isUnlocked && (
                                    <span className="text-green-400/80 text-xs">✓</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

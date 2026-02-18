
'use client';

import React from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { useSessionStats } from '@/hooks/useSessionStats';
import { Clock, Flame, Target, Trophy } from 'lucide-react';

interface SessionStatsProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SessionStats({ isOpen, onClose }: SessionStatsProps) {
    const { theme } = useTheme();
    const { stats, getHeatmapData } = useSessionStats();
    const heatmap = getHeatmapData(35);

    if (!isOpen) return null;

    const formatDuration = (mins: number) => {
        if (mins < 60) return `${mins}m`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const getHeatColor = (level: number) => {
        const colors = [
            'bg-white/[0.03]',
            'bg-emerald-500/20',
            'bg-emerald-500/40',
            'bg-emerald-400/60',
            'bg-emerald-300/80',
        ];
        return colors[level] || colors[0];
    };

    const getLegendColor = (level: number) => {
        const colors = [
            'bg-white/[0.06]',
            'bg-emerald-500/30',
            'bg-emerald-500/50',
            'bg-emerald-400/70',
            'bg-emerald-300/90',
        ];
        return colors[level] || colors[0];
    };

    const statCards = [
        {
            icon: <Clock size={16} />,
            value: formatDuration(stats.totalFocusMinutes),
            label: 'Focus Time',
            gradient: 'from-blue-500/20 to-cyan-500/10',
            iconColor: 'text-blue-400',
        },
        {
            icon: <Target size={16} />,
            value: stats.totalSessions.toString(),
            label: 'Sessions',
            gradient: 'from-purple-500/20 to-pink-500/10',
            iconColor: 'text-purple-400',
        },
        {
            icon: <Flame size={16} />,
            value: `${stats.currentStreak}d`,
            label: 'Current Streak',
            gradient: 'from-orange-500/20 to-amber-500/10',
            iconColor: 'text-orange-400',
        },
        {
            icon: <Trophy size={16} />,
            value: `${stats.bestStreak}d`,
            label: 'Best Streak',
            gradient: 'from-yellow-500/20 to-amber-500/10',
            iconColor: 'text-yellow-400',
        },
    ];

    // Day labels for heatmap columns
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <div
                onClick={e => e.stopPropagation()}
                className={`relative w-[92vw] max-w-sm rounded-3xl overflow-hidden
                    border border-white/[0.08] shadow-[0_25px_60px_rgba(0,0,0,0.5)]`}
                style={{
                    background: 'linear-gradient(165deg, rgba(30,30,50,0.95), rgba(15,15,30,0.98))',
                }}
            >
                {/* Decorative top gradient bar */}
                <div className="h-1 w-full bg-gradient-to-r from-blue-500/60 via-purple-500/60 to-pink-500/60" />

                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/[0.06]">
                                <span className="text-base">📊</span>
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-white/90 tracking-wide">Session Stats</h2>
                                <p className="text-[10px] text-white/30 tracking-wider">YOUR FOCUS JOURNEY</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white/70 transition-all text-sm"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 gap-2.5 mb-6">
                        {statCards.map((stat, i) => (
                            <div
                                key={i}
                                className={`relative rounded-2xl p-4 bg-gradient-to-br ${stat.gradient} border border-white/[0.05] overflow-hidden group hover:border-white/[0.1] transition-all duration-300`}
                            >
                                {/* Subtle background glow */}
                                <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-white/[0.02] blur-xl" />

                                <div className={`${stat.iconColor} mb-2.5 opacity-70`}>
                                    {stat.icon}
                                </div>
                                <div className="text-2xl font-bold text-white/90 tracking-tight leading-none mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-[10px] uppercase tracking-[0.15em] text-white/35 font-medium">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Heatmap */}
                    <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.04]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
                                Activity — Last 5 Weeks
                            </span>
                        </div>

                        {/* Day labels + grid */}
                        <div className="flex gap-1">
                            {/* Day labels */}
                            <div className="flex flex-col gap-[3px] pr-1.5">
                                {dayLabels.map((d, i) => (
                                    <div key={i} className="h-[18px] flex items-center">
                                        <span className="text-[8px] text-white/20 font-mono w-2.5">{d}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Heatmap grid — 5 columns × 7 rows */}
                            <div className="flex-1 grid grid-cols-5 gap-[3px]">
                                {heatmap.map((day, i) => (
                                    <div
                                        key={i}
                                        className={`h-[18px] rounded-[4px] ${getHeatColor(day.level)} transition-all duration-300 hover:ring-1 hover:ring-white/20 cursor-default`}
                                        title={`${day.date}: ${day.level === 0 ? 'No sessions' : `Level ${day.level}`}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-end gap-1 mt-3">
                            <span className="text-[8px] text-white/20 mr-1">Less</span>
                            {[0, 1, 2, 3, 4].map(i => (
                                <div key={i} className={`w-[10px] h-[10px] rounded-[3px] ${getLegendColor(i)}`} />
                            ))}
                            <span className="text-[8px] text-white/20 ml-1">More</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


'use client';

import { useState, useEffect, useCallback } from 'react';

interface DayStats {
    date: string; // YYYY-MM-DD
    focusMinutes: number;
    sessions: number;
}

interface SessionData {
    totalFocusMinutes: number;
    totalSessions: number;
    currentStreak: number;
    bestStreak: number;
    lastSessionDate: string;
    dailyStats: DayStats[];
}

const STORAGE_KEY = 'lucid-session-stats';

function getToday(): string {
    return new Date().toISOString().split('T')[0];
}

function getDefaultData(): SessionData {
    return {
        totalFocusMinutes: 0,
        totalSessions: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastSessionDate: '',
        dailyStats: [],
    };
}

function loadData(): SessionData {
    if (typeof window === 'undefined') return getDefaultData();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return getDefaultData();
        return JSON.parse(raw);
    } catch {
        return getDefaultData();
    }
}

function saveData(data: SessionData) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useSessionStats() {
    const [data, setData] = useState<SessionData>(getDefaultData);

    useEffect(() => {
        setData(loadData());
    }, []);

    const persist = useCallback((newData: SessionData) => {
        setData(newData);
        saveData(newData);
    }, []);

    const completeSession = useCallback((focusMinutes: number) => {
        const current = loadData();
        const today = getToday();

        // Update totals
        current.totalFocusMinutes += focusMinutes;
        current.totalSessions += 1;

        // Update daily stats
        const todayIdx = current.dailyStats.findIndex(d => d.date === today);
        if (todayIdx >= 0) {
            current.dailyStats[todayIdx].focusMinutes += focusMinutes;
            current.dailyStats[todayIdx].sessions += 1;
        } else {
            current.dailyStats.push({ date: today, focusMinutes, sessions: 1 });
        }

        // Keep only last 90 days
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);
        const cutoffStr = cutoff.toISOString().split('T')[0];
        current.dailyStats = current.dailyStats.filter(d => d.date >= cutoffStr);

        // Update streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (current.lastSessionDate === today) {
            // Already counted today
        } else if (current.lastSessionDate === yesterdayStr || current.lastSessionDate === '') {
            current.currentStreak += 1;
        } else {
            current.currentStreak = 1;
        }

        current.bestStreak = Math.max(current.bestStreak, current.currentStreak);
        current.lastSessionDate = today;

        persist(current);
    }, [persist]);

    const getHeatmapData = useCallback((days: number = 30): { date: string; level: number }[] => {
        const result: { date: string; level: number }[] = [];
        const statsMap = new Map(data.dailyStats.map(d => [d.date, d.focusMinutes]));

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const mins = statsMap.get(dateStr) || 0;

            let level = 0;
            if (mins > 0) level = 1;
            if (mins >= 30) level = 2;
            if (mins >= 60) level = 3;
            if (mins >= 120) level = 4;

            result.push({ date: dateStr, level });
        }
        return result;
    }, [data.dailyStats]);

    return {
        stats: data,
        completeSession,
        getHeatmapData,
    };
}

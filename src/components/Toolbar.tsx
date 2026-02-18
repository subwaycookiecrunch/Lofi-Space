
'use client';

import React from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { useDeviceMode } from '@/providers/DeviceModeProvider';
import { useNotes } from '@/components/StickyNotes/NoteContainer';
import { Plus, Moon, Sun, Coffee, Monitor, BarChart3, ListTodo, Maximize, Minimize, Users, Share2, Trophy, Music, Youtube, Palette } from 'lucide-react';

interface ToolbarProps {
    onToggleStats: () => void;
    onToggleTodo: () => void;
    onToggleStreaks: () => void;
    onToggleShare: () => void;
    onToggleRoom: () => void;
    onToggleSpotify: () => void;
    onToggleYouTube: () => void;
    onToggleThemes: () => void;
    isDND: boolean;
    onToggleDND: () => void;
}

export default function Toolbar({ onToggleStats, onToggleTodo, onToggleStreaks, onToggleShare, onToggleRoom, onToggleSpotify, onToggleYouTube, onToggleThemes, isDND, onToggleDND }: ToolbarProps) {
    const { theme, setMode } = useTheme();
    const { device } = useDeviceMode();
    const { addNote } = useNotes();

    const isMobile = device === 'mobile';
    const isTablet = device === 'tablet';
    const isTv = device === 'tv';

    const cycleMode = () => {
        if (theme.id === 'study') setMode('relax');
        else if (theme.id === 'relax') setMode('sleep');
        else setMode('study');
    };

    const getModeIcon = () => {
        switch (theme.id) {
            case 'study': return <Monitor size={isTv ? 22 : isMobile ? 20 : 18} />;
            case 'relax': return <Coffee size={isTv ? 22 : isMobile ? 20 : 18} />;
            case 'sleep': return <Moon size={isTv ? 22 : isMobile ? 20 : 18} />;
            default: return <Sun size={isTv ? 22 : isMobile ? 20 : 18} />;
        }
    };

    if (isDND) {
        return (
            <button
                onClick={onToggleDND}
                className="fixed bottom-6 right-6 z-[200] p-3 rounded-full bg-white/5 hover:bg-white/15 text-white/30 hover:text-white/80 transition-all backdrop-blur-md border border-white/10"
                title="Exit Focus Mode (Esc)"
            >
                <Minimize size={18} />
            </button>
        );
    }

    const iconSize = isTv ? 22 : isMobile ? 20 : 18;

    // Mobile: bottom nav with essential buttons only
    if (isMobile) {
        return (
            <div
                className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08]"
                style={{
                    background: 'linear-gradient(180deg, rgba(15,15,30,0.92), rgba(10,10,25,0.98))',
                    backdropFilter: 'blur(20px)',
                    paddingBottom: 'env(safe-area-inset-bottom, 8px)',
                }}
            >
                <div className="flex items-center justify-around px-2 py-2">
                    <MobileBtn onClick={cycleMode} icon={getModeIcon()} label={theme.name} />
                    <MobileBtn onClick={onToggleThemes} icon={<Palette size={20} />} label="Themes" />
                    <MobileBtn onClick={onToggleSpotify} icon={<Music size={20} />} label="Spotify" />
                    <MobileBtn onClick={onToggleYouTube} icon={<Youtube size={20} />} label="YouTube" />
                    <MobileBtn onClick={onToggleDND} icon={<Maximize size={18} />} label="Focus" />
                </div>
            </div>
        );
    }

    // TV: larger, more spaced out toolbar
    if (isTv) {
        return (
            <div
                className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-8 py-4 rounded-full border border-white/[0.08] shadow-2xl"
                style={{
                    background: 'linear-gradient(135deg, rgba(20,20,40,0.85), rgba(12,12,28,0.9))',
                    backdropFilter: 'blur(20px)',
                }}
            >
                <ToolbarBtn onClick={addNote} icon={<Plus size={iconSize} />} label="New Note" />
                <Div />
                <ToolbarBtn onClick={cycleMode} icon={getModeIcon()} label={`${theme.name} Mode`} />
                <ToolbarBtn onClick={onToggleThemes} icon={<Palette size={iconSize} />} label="Themes" />
                <Div />
                <ToolbarBtn onClick={onToggleTodo} icon={<ListTodo size={iconSize} />} label="Tasks" />
                <ToolbarBtn onClick={onToggleStats} icon={<BarChart3 size={iconSize} />} label="Stats" />
                <ToolbarBtn onClick={onToggleStreaks} icon={<Trophy size={iconSize} />} label="Achievements" />
                <Div />
                <ToolbarBtn onClick={onToggleSpotify} icon={<Music size={iconSize} />} label="Spotify" />
                <ToolbarBtn onClick={onToggleYouTube} icon={<Youtube size={iconSize} />} label="YouTube" />
                <ToolbarBtn onClick={onToggleRoom} icon={<Users size={iconSize} />} label="Focus Room" />
                <ToolbarBtn onClick={onToggleShare} icon={<Share2 size={iconSize} />} label="Share Card" />
                <Div />
                <ToolbarBtn onClick={onToggleDND} icon={<Maximize size={20} />} label="Focus Mode (F)" />
            </div>
        );
    }

    // Tablet: slightly larger buttons, minor spacing adjustments
    // PC: default
    return (
        <div
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center rounded-full border border-white/[0.08] shadow-2xl
                ${isTablet ? 'gap-2 px-5 py-3' : 'gap-2 px-4 py-2.5'}`}
            style={{
                background: 'linear-gradient(135deg, rgba(20,20,40,0.85), rgba(12,12,28,0.9))',
                backdropFilter: 'blur(20px)',
            }}
        >
            <ToolbarBtn onClick={addNote} icon={<Plus size={iconSize} />} label="New Note" />
            <Div />
            <ToolbarBtn onClick={cycleMode} icon={getModeIcon()} label={`${theme.name} Mode`} />
            <ToolbarBtn onClick={onToggleThemes} icon={<Palette size={iconSize} />} label="Themes" />
            <Div />
            <ToolbarBtn onClick={onToggleTodo} icon={<ListTodo size={iconSize} />} label="Tasks" />
            <ToolbarBtn onClick={onToggleStats} icon={<BarChart3 size={iconSize} />} label="Stats" />
            <ToolbarBtn onClick={onToggleStreaks} icon={<Trophy size={iconSize} />} label="Achievements" />
            <Div />
            <ToolbarBtn onClick={onToggleRoom} icon={<Users size={iconSize} />} label="Focus Room" />
            <ToolbarBtn onClick={onToggleSpotify} icon={<Music size={iconSize} />} label="Spotify" />
            <ToolbarBtn onClick={onToggleYouTube} icon={<Youtube size={iconSize} />} label="YouTube" />
            <ToolbarBtn onClick={onToggleShare} icon={<Share2 size={iconSize} />} label="Share Card" />
            <Div />
            <ToolbarBtn onClick={onToggleDND} icon={<Maximize size={16} />} label="Focus Mode (F)" />
        </div>
    );
}

function MobileBtn({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-white/50 hover:text-white/90 active:scale-95 transition-all"
        >
            {icon}
            <span className="text-[9px] tracking-wider">{label}</span>
        </button>
    );
}

function ToolbarBtn({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white group relative"
            title={label}
        >
            {icon}
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-[9px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {label}
            </span>
        </button>
    );
}

function Div() {
    return <div className="w-px h-5 bg-white/10" />;
}

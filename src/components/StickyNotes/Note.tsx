
'use client';

import React, { useEffect, useRef } from 'react';
import { useDraggable } from '@/hooks/useDraggable';
import { useTheme } from '@/providers/ThemeProvider';
import { X } from 'lucide-react';

export interface NoteData {
    id: string;
    text: string;
    x: number;
    y: number;
}

interface NoteProps {
    note: NoteData;
    onUpdate: (id: string, text: string, x: number, y: number) => void;
    onDelete: (id: string) => void;
}

export default function Note({ note, onUpdate, onDelete }: NoteProps) {
    const { theme } = useTheme();
    // Initialize with note's stored position
    const {
        position,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        isDragging,
        setPosition
    } = useDraggable({ x: note.x, y: note.y });

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync parent state when drag ends
    useEffect(() => {
        if (!isDragging) {
            // Only save when not dragging to avoid thrashing
            if (position.x !== note.x || position.y !== note.y) {
                onUpdate(note.id, note.text, position.x, position.y);
            }
        }
    }, [isDragging, position.x, position.y, note.id, note.text, note.x, note.y, onUpdate]);

    // Handle window resize to keep note in bounds
    useEffect(() => {
        const handleResize = () => {
            const maxX = window.innerWidth - 50;
            const maxY = window.innerHeight - 50;

            let newX = position.x;
            let newY = position.y;

            // Smart bounds
            if (newX > maxX) newX = maxX - 200; // Push back considerably
            if (newY > maxY) newY = maxY - 200;
            if (newX < 0) newX = 10;
            if (newY < 0) newY = 10;

            if (newX !== position.x || newY !== position.y) {
                setPosition({ x: newX, y: newY });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [position, setPosition]);

    // Update text
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdate(note.id, e.target.value, position.x, position.y);
    };

    return (
        <div
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                touchAction: 'none',
            }}
            className={`
        w-[85vw] h-[85vw] max-w-[280px] max-h-[280px] md:w-72 md:h-72
        p-4 md:p-6 rounded-lg md:rounded-xl shadow-xl backdrop-blur-md transition-shadow duration-200
        ${isDragging ? 'z-50 scale-105 cursor-grabbing shadow-2xl' : 'z-20 cursor-grab'}
        ${theme.colors.glass} ${theme.colors.border} border border-white/10
        flex flex-col group pointer-events-auto
      `}
        >
            <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp} /* Safety net */
                className="h-8 md:h-10 w-full mb-1 flex items-center justify-between cursor-grab active:cursor-grabbing shrink-0"
            >
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto" /> {/* Drag handle indicator */}

                <button
                    onClick={() => onDelete(note.id)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute top-2 right-2 p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white/90 transition-colors z-20"
                >
                    <X size={18} />
                </button>
            </div>

            <textarea
                ref={textareaRef}
                value={note.text}
                onChange={handleTextChange}
                placeholder="Standard Note..."
                className="w-full h-full bg-transparent resize-none outline-none text-white/90 placeholder-white/30
        font-medium text-base md:text-lg leading-relaxed"
                onPointerDown={(e) => e.stopPropagation()}
            />
        </div>
    );
}

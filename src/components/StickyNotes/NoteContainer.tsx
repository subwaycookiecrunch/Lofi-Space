
'use client';

import React, { useState, useEffect } from 'react';
import Note, { NoteData } from './Note';
import { Plus } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

export default function NoteContainer() {
    const [notes, setNotes] = useState<NoteData[]>([]);
    const { theme } = useTheme();

    // Load from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem('lofi-notes');
        if (saved) {
            try {
                setNotes(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load notes', e);
            }
        }
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        localStorage.setItem('lofi-notes', JSON.stringify(notes));
    }, [notes]);

    const addNote = () => {
        const newNote: NoteData = {
            id: crypto.randomUUID(),
            text: '',
            x: window.innerWidth / 2 - 128 + (Math.random() * 40 - 20),
            y: window.innerHeight / 2 - 128 + (Math.random() * 40 - 20),
        };
        setNotes([...notes, newNote]);
    };

    const updateNote = (id: string, text: string, x: number, y: number) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, text, x, y } : n));
    };

    const deleteNote = (id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
    };

    return (
        <>
            <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
                <div className="relative w-full h-full">
                    {notes.map(note => (
                        <Note
                            key={note.id}
                            note={note}
                            onUpdate={updateNote}
                            onDelete={deleteNote}
                        />
                    ))}
                </div>
            </div>

            {/* Floating Add Button for Notes - Integrated into global toolbar usually, 
          but adding a quick one here if toolbar not present yet, or managed by toolbar via Context?
          User req: "Floating Toolbar: Add new note button".
          So this container should expose 'addNote' to the toolbar.
          For now, we'll export a custom hook or context for Notes, OR 
          manage 'addNote' via a global store? 
          Simpler: Put NoteContainer inside a ContextProvider or lift state up?
          
          Actually, I'll export a Context for Notes so Toolbar can access it.
      */}
        </>
    );
}

// Simple Context to expose createNote
export const NoteContext = React.createContext<{ addNote: () => void }>({ addNote: () => { } });

export function NoteProvider({ children }: { children: React.ReactNode }) {
    const [notes, setNotes] = useState<NoteData[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('lofi-notes');
        if (saved) { setNotes(JSON.parse(saved)); }
    }, []);

    useEffect(() => {
        localStorage.setItem('lofi-notes', JSON.stringify(notes));
    }, [notes]);

    const addNote = () => {
        const newNote: NoteData = {
            id: crypto.randomUUID(),
            text: '',
            x: 100 + (Math.random() * 50),
            y: 100 + (Math.random() * 50),
        };
        setNotes(prev => [...prev, newNote]);
    };

    const updateNote = (id: string, text: string, x: number, y: number) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, text, x, y } : n));
    };

    const deleteNote = (id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NoteContext.Provider value={{ addNote }}>
            {children}
            <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
                <div className="relative w-full h-full">
                    {notes.map(note => (
                        <Note
                            key={note.id}
                            note={note}
                            onUpdate={updateNote}
                            onDelete={deleteNote}
                        />
                    ))}
                </div>
            </div>
        </NoteContext.Provider>
    );
}

export function useNotes() {
    return React.useContext(NoteContext);
}

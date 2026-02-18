
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { Plus } from 'lucide-react';

interface TodoItem {
    id: string;
    text: string;
    done: boolean;
    createdAt: number;
}

const STORAGE_KEY = 'lucid-todos';

interface TodoListProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TodoList({ isOpen, onClose }: TodoListProps) {
    const { theme } = useTheme();
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setTodos(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    const save = (items: TodoItem[]) => {
        setTodos(items);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    };

    const addTodo = () => {
        if (!input.trim()) return;
        const newTodo: TodoItem = {
            id: Date.now().toString(),
            text: input.trim(),
            done: false,
            createdAt: Date.now(),
        };
        save([newTodo, ...todos]);
        setInput('');
    };

    const toggleTodo = (id: string) => {
        save(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const deleteTodo = (id: string) => {
        save(todos.filter(t => t.id !== id));
    };

    const activeTodos = todos.filter(t => !t.done);
    const doneTodos = todos.filter(t => t.done);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <div
                onClick={e => e.stopPropagation()}
                className="relative w-[92vw] max-w-sm rounded-3xl overflow-hidden border border-white/[0.08] shadow-[0_25px_60px_rgba(0,0,0,0.5)] max-h-[80vh] flex flex-col"
                style={{
                    background: 'linear-gradient(165deg, rgba(30,30,50,0.95), rgba(15,15,30,0.98))',
                }}
            >
                {/* Gradient top bar */}
                <div className="h-1 w-full bg-gradient-to-r from-emerald-500/60 via-cyan-500/60 to-blue-500/60" />

                <div className="p-6 flex flex-col flex-1 min-h-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-white/[0.06]">
                                <span className="text-base">✅</span>
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-white/90 tracking-wide">Focus Tasks</h2>
                                <p className="text-[10px] text-white/30 tracking-wider">
                                    {activeTodos.length > 0 ? `${activeTodos.length} ACTIVE` : 'STAY FOCUSED'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white/70 transition-all text-sm"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Input */}
                    <div className="flex gap-2 mb-4">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTodo()}
                            placeholder="What are you focusing on?"
                            className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-white/15 transition-colors"
                        />
                        <button
                            onClick={addTodo}
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/15 hover:from-emerald-500/30 hover:to-cyan-500/25 border border-white/[0.06] flex items-center justify-center text-emerald-400/80 transition-all"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* Task List */}
                    <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 pr-1">
                        {activeTodos.length === 0 && doneTodos.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 text-white/15">
                                <div className="text-3xl mb-3">📝</div>
                                <div className="text-sm">No tasks yet</div>
                                <div className="text-[10px] mt-1">Add one above to get started</div>
                            </div>
                        )}

                        {activeTodos.map(todo => (
                            <div
                                key={todo.id}
                                className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl px-4 py-3 group border border-white/[0.04] transition-all"
                            >
                                <button
                                    onClick={() => toggleTodo(todo.id)}
                                    className="w-[18px] h-[18px] rounded-full border-[1.5px] border-white/20 hover:border-emerald-400/50 transition-colors flex-shrink-0"
                                />
                                <span className="flex-1 text-sm text-white/75">{todo.text}</span>
                                <button
                                    onClick={() => deleteTodo(todo.id)}
                                    className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400/80 transition-all text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        {doneTodos.length > 0 && (
                            <>
                                <div className="flex items-center gap-2 pt-3 pb-1 px-1">
                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                    <span className="text-[9px] uppercase tracking-[0.2em] text-white/20">
                                        Completed · {doneTodos.length}
                                    </span>
                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                </div>
                                {doneTodos.map(todo => (
                                    <div
                                        key={todo.id}
                                        className="flex items-center gap-3 bg-white/[0.02] rounded-xl px-4 py-3 group border border-white/[0.02] transition-all"
                                    >
                                        <button
                                            onClick={() => toggleTodo(todo.id)}
                                            className="w-[18px] h-[18px] rounded-full border-[1.5px] border-emerald-400/40 bg-emerald-400/15 flex-shrink-0 flex items-center justify-center"
                                        >
                                            <span className="text-emerald-400/80 text-[8px]">✓</span>
                                        </button>
                                        <span className="flex-1 text-sm text-white/30 line-through">{todo.text}</span>
                                        <button
                                            onClick={() => deleteTodo(todo.id)}
                                            className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400/80 transition-all text-xs"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

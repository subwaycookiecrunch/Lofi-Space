
'use client';

import React, { useRef, useCallback } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { useBgTheme } from '@/providers/BgThemeProvider';
import { useSessionStats } from '@/hooks/useSessionStats';
import { Share2, Download, X } from 'lucide-react';

interface ShareableCardProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ShareableCard({ isOpen, onClose }: ShareableCardProps) {
    const { theme, mode } = useTheme();
    const { bgTheme } = useBgTheme();
    const { stats } = useSessionStats();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const generateCard = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = 800;
        const H = 450;
        canvas.width = W;
        canvas.height = H;

        // ── Base gradient ──
        const grad = ctx.createLinearGradient(0, 0, W, H);
        if (mode === 'study') {
            grad.addColorStop(0, '#0a0f2e');
            grad.addColorStop(0.4, '#111d5e');
            grad.addColorStop(0.7, '#0d1642');
            grad.addColorStop(1, '#080c24');
        } else if (mode === 'sleep') {
            grad.addColorStop(0, '#100a30');
            grad.addColorStop(0.4, '#1e1060');
            grad.addColorStop(0.7, '#150d48');
            grad.addColorStop(1, '#0a0620');
        } else {
            grad.addColorStop(0, '#1a0e08');
            grad.addColorStop(0.4, '#2a1508');
            grad.addColorStop(0.7, '#201008');
            grad.addColorStop(1, '#120a05');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // ── Ambient glow orbs ──
        const accentColor = mode === 'study' ? [80, 120, 255] : mode === 'sleep' ? [140, 80, 255] : [255, 150, 60];

        // Large soft glow — top right
        const g1 = ctx.createRadialGradient(W * 0.75, H * 0.2, 0, W * 0.75, H * 0.2, 250);
        g1.addColorStop(0, `rgba(${accentColor[0]},${accentColor[1]},${accentColor[2]},0.08)`);
        g1.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, W, H);

        // Small glow — bottom left
        const g2 = ctx.createRadialGradient(W * 0.2, H * 0.85, 0, W * 0.2, H * 0.85, 200);
        g2.addColorStop(0, `rgba(${accentColor[0]},${accentColor[1]},${accentColor[2]},0.06)`);
        g2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, W, H);

        // ── Star particles ──
        for (let i = 0; i < 60; i++) {
            const x = Math.random() * W;
            const y = Math.random() * H;
            const r = Math.random() * 1.2 + 0.3;
            const a = Math.random() * 0.2 + 0.03;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(220,230,255,${a})`;
            ctx.fill();
        }

        // ── Inner card (glass) ──
        const cx = 50, cy = 45, cw = W - 100, ch = H - 90, cr = 24;
        ctx.save();
        roundRect(ctx, cx, cy, cw, ch, cr);
        ctx.clip();

        // Glass background
        ctx.fillStyle = 'rgba(255,255,255,0.035)';
        ctx.fillRect(cx, cy, cw, ch);

        // Subtle inner gradient
        const ig = ctx.createLinearGradient(cx, cy, cx, cy + ch);
        ig.addColorStop(0, 'rgba(255,255,255,0.04)');
        ig.addColorStop(1, 'rgba(255,255,255,0.01)');
        ctx.fillStyle = ig;
        ctx.fillRect(cx, cy, cw, ch);

        ctx.restore();

        // Glass border
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        roundRect(ctx, cx, cy, cw, ch, cr, true);

        // ── Top accent line ──
        ctx.save();
        roundRect(ctx, cx, cy, cw, 3, cr);
        ctx.clip();
        const lineGrad = ctx.createLinearGradient(cx, 0, cx + cw, 0);
        lineGrad.addColorStop(0, `rgba(${accentColor[0]},${accentColor[1]},${accentColor[2]},0.5)`);
        lineGrad.addColorStop(0.5, `rgba(${accentColor[0]},${accentColor[1]},${accentColor[2]},0.2)`);
        lineGrad.addColorStop(1, `rgba(${accentColor[0]},${accentColor[1]},${accentColor[2]},0.5)`);
        ctx.fillStyle = lineGrad;
        ctx.fillRect(cx, cy, cw, 3);
        ctx.restore();

        // ── Brand ──
        ctx.font = '600 11px "Inter", system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.textAlign = 'left';
        ctx.letterSpacing = '3px';
        ctx.fillText('L U C I D  L O F I', cx + 30, cy + 35);

        // ── Mode badge ──
        const modeLabel = mode === 'study' ? '📚 Study' : mode === 'sleep' ? '🌙 Sleep' : '☕ Relax';
        ctx.font = '500 11px "Inter", system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.textAlign = 'right';
        ctx.fillText(modeLabel, cx + cw - 30, cy + 35);

        // ── Focus time — hero number ──
        const hours = Math.floor(stats.totalFocusMinutes / 60);
        const mins = stats.totalFocusMinutes % 60;
        const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

        ctx.font = 'bold 72px "Inter", system-ui, sans-serif';
        const heroColor = mode === 'study' ? '#7da8ff' : mode === 'sleep' ? '#b795ff' : '#ffb86a';
        ctx.fillStyle = heroColor;
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, W / 2, cy + 120);

        // Glow behind number
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        const textGlow = ctx.createRadialGradient(W / 2, cy + 100, 0, W / 2, cy + 100, 120);
        textGlow.addColorStop(0, `rgba(${accentColor[0]},${accentColor[1]},${accentColor[2]},0.08)`);
        textGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = textGlow;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        ctx.font = '500 12px "Inter", system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.textAlign = 'center';
        ctx.fillText('T O T A L  F O C U S  T I M E', W / 2, cy + 145);

        // ── Divider ──
        const divY = cy + 175;
        const divGrad = ctx.createLinearGradient(cx + 80, 0, cx + cw - 80, 0);
        divGrad.addColorStop(0, 'rgba(255,255,255,0)');
        divGrad.addColorStop(0.5, 'rgba(255,255,255,0.07)');
        divGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = divGrad;
        ctx.fillRect(cx + 80, divY, cw - 160, 1);

        // ── Stats row ──
        const statsY = divY + 55;
        const statItems = [
            { label: 'SESSIONS', value: stats.totalSessions.toString(), icon: '⚡' },
            { label: 'STREAK', value: `${stats.currentStreak}d`, icon: '🔥' },
            { label: 'BEST', value: `${stats.bestStreak}d`, icon: '🏆' },
            { label: 'DAILY AVG', value: `${stats.totalSessions > 0 ? Math.round(stats.totalFocusMinutes / stats.totalSessions) : 0}m`, icon: '📊' },
        ];

        const statWidth = cw / 4;
        statItems.forEach((item, i) => {
            const x = cx + statWidth * i + statWidth / 2;

            // Vertical separator
            if (i > 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                ctx.fillRect(cx + statWidth * i, statsY - 30, 1, 60);
            }

            ctx.font = '11px "Inter", system-ui, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.textAlign = 'center';
            ctx.fillText(item.icon, x, statsY - 18);

            ctx.font = 'bold 28px "Inter", system-ui, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.fillText(item.value, x, statsY + 12);

            ctx.font = '500 9px "Inter", system-ui, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillText(item.label, x, statsY + 30);
        });

        // ── Bottom row ──
        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        ctx.font = '500 10px "Inter", system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.textAlign = 'left';
        ctx.fillText(today, cx + 30, cy + ch - 20);

        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillText('lucidlofi.space', cx + cw - 30, cy + ch - 20);
    }, [mode, stats]);

    const downloadCard = () => {
        generateCard();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `lucid-lofi-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const shareCard = async () => {
        generateCard();
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) return;

            if (navigator.share) {
                const file = new File([blob], 'lucid-lofi-focus.png', { type: 'image/png' });
                await navigator.share({
                    title: 'My Focus Stats — Lucid LoFi',
                    text: `I've focused for ${Math.floor(stats.totalFocusMinutes / 60)}h ${stats.totalFocusMinutes % 60}m with Lucid LoFi! 🌙`,
                    files: [file],
                });
            } else {
                downloadCard();
            }
        } catch {
            downloadCard();
        }
    };

    React.useEffect(() => {
        if (isOpen) {
            setTimeout(generateCard, 100);
        }
    }, [isOpen, generateCard]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <div
                onClick={e => e.stopPropagation()}
                className="relative w-[92vw] max-w-lg rounded-3xl overflow-hidden border border-white/[0.08] shadow-[0_25px_60px_rgba(0,0,0,0.5)]"
                style={{
                    background: 'linear-gradient(165deg, rgba(30,30,50,0.95), rgba(15,15,30,0.98))',
                }}
            >
                {/* Accent gradient bar */}
                <div className="h-1 w-full bg-gradient-to-r from-amber-500/50 via-pink-500/50 to-purple-500/50" />

                <div className="p-5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/25 to-pink-500/15 flex items-center justify-center border border-white/[0.06]">
                                <Share2 size={16} className="text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-white/90 tracking-wide">Share Focus</h2>
                                <p className="text-[10px] text-white/30 tracking-wider">EXPORT YOUR STATS</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white/70 transition-all"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Canvas preview */}
                    <canvas
                        ref={canvasRef}
                        className="w-full rounded-2xl border border-white/[0.05] shadow-xl mb-4"
                        style={{ aspectRatio: '800/450' }}
                    />

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={shareCard}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-sm font-medium text-white/90 transition-all border border-white/[0.06]"
                        >
                            <Share2 size={14} />
                            Share
                        </button>
                        <button
                            onClick={downloadCard}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium text-white/50 hover:text-white/80 transition-all border border-white/[0.04]"
                        >
                            <Download size={14} />
                            Download
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, stroke = false) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    if (stroke) ctx.stroke();
}

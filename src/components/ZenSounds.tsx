
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { useDeviceMode } from '@/providers/DeviceModeProvider';

interface ZenSound {
    id: string;
    name: string;
    emoji: string;
    // We'll generate sounds using Web Audio API for reliability
}

const ZEN_SOUNDS: ZenSound[] = [
    { id: 'rain', name: 'Rain', emoji: '🌧️' },
    { id: 'ocean', name: 'Ocean', emoji: '🌊' },
    { id: 'wind', name: 'Wind', emoji: '🍃' },
    { id: 'fire', name: 'Fireplace', emoji: '🔥' },
    { id: 'night', name: 'Night', emoji: '🌙' },
    { id: 'stream', name: 'Stream', emoji: '💧' },
];

// Generate ambient noise using Web Audio API
function createNoiseGenerator(ctx: AudioContext, type: string): { node: AudioNode; stop: () => void } {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Fill buffer with noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    gain.gain.value = 0.15;

    switch (type) {
        case 'rain':
            filter.type = 'bandpass';
            filter.frequency.value = 3000;
            filter.Q.value = 0.5;
            gain.gain.value = 0.12;
            break;
        case 'ocean':
            filter.type = 'lowpass';
            filter.frequency.value = 500;
            filter.Q.value = 1;
            gain.gain.value = 0.2;
            // Add LFO for wave effect
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.value = 0.1; // slow wave
            lfoGain.gain.value = 200;
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);
            lfo.start();
            break;
        case 'wind':
            filter.type = 'bandpass';
            filter.frequency.value = 800;
            filter.Q.value = 0.3;
            gain.gain.value = 0.08;
            const windLfo = ctx.createOscillator();
            const windLfoGain = ctx.createGain();
            windLfo.frequency.value = 0.15;
            windLfoGain.gain.value = 400;
            windLfo.connect(windLfoGain);
            windLfoGain.connect(filter.frequency);
            windLfo.start();
            break;
        case 'fire':
            filter.type = 'bandpass';
            filter.frequency.value = 1500;
            filter.Q.value = 2;
            gain.gain.value = 0.06;
            break;
        case 'night':
            filter.type = 'bandpass';
            filter.frequency.value = 4000;
            filter.Q.value = 5;
            gain.gain.value = 0.03;
            break;
        case 'stream':
            filter.type = 'highpass';
            filter.frequency.value = 2000;
            filter.Q.value = 0.5;
            gain.gain.value = 0.07;
            break;
        default:
            filter.type = 'lowpass';
            filter.frequency.value = 1000;
    }

    source.connect(filter);
    filter.connect(gain);
    source.start();

    return {
        node: gain,
        stop: () => {
            try { source.stop(); } catch (e) { /* already stopped */ }
        }
    };
}

export default function ZenSounds() {
    const { theme } = useTheme();
    const { device } = useDeviceMode();
    const [activeSounds, setActiveSounds] = useState<Set<string>>(new Set());
    const [masterVolume, setMasterVolume] = useState(60);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    const soundsRef = useRef<Map<string, { node: AudioNode; stop: () => void }>>(new Map());

    // Initialize audio context on first interaction
    const getAudioCtx = useCallback(() => {
        if (!audioCtxRef.current) {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioCtxRef.current = ctx;
            const master = ctx.createGain();
            master.gain.value = masterVolume / 100;
            master.connect(ctx.destination);
            masterGainRef.current = master;
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    }, [masterVolume]);

    // Update master volume
    useEffect(() => {
        if (masterGainRef.current) {
            masterGainRef.current.gain.linearRampToValueAtTime(
                masterVolume / 100,
                audioCtxRef.current?.currentTime ? audioCtxRef.current.currentTime + 0.1 : 0
            );
        }
    }, [masterVolume]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            soundsRef.current.forEach(s => s.stop());
            soundsRef.current.clear();
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
                audioCtxRef.current = null;
            }
        };
    }, []);

    const toggleSound = (soundId: string) => {
        const newActive = new Set(activeSounds);

        if (newActive.has(soundId)) {
            // Stop this sound
            const existing = soundsRef.current.get(soundId);
            if (existing) {
                existing.stop();
                soundsRef.current.delete(soundId);
            }
            newActive.delete(soundId);
        } else {
            // Start this sound
            const ctx = getAudioCtx();
            const generator = createNoiseGenerator(ctx, soundId);
            if (masterGainRef.current) {
                generator.node.connect(masterGainRef.current);
            }
            soundsRef.current.set(soundId, generator);
            newActive.add(soundId);
        }

        setActiveSounds(newActive);
    };

    const isAnyPlaying = activeSounds.size > 0;

    const isMobile = device === 'mobile';

    return (
        <div className={`z-40 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl transition-all duration-500
      ${isMobile ? 'relative w-full max-w-[92vw]' : 'fixed bottom-8 left-8 w-80 max-w-[90vw]'}
      ${theme.colors.glass} ${theme.colors.border}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col">
                    <span className={`text-sm font-medium ${theme.colors.accent}`}>
                        Zen Sounds
                    </span>
                    <span className="text-[10px] text-white/50 uppercase tracking-wider">
                        {isAnyPlaying ? `${activeSounds.size} sound${activeSounds.size > 1 ? 's' : ''} playing` : 'Tap to mix'}
                    </span>
                </div>
                {isAnyPlaying && (
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    </div>
                )}
            </div>

            {/* Sound Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                {ZEN_SOUNDS.map(sound => {
                    const isActive = activeSounds.has(sound.id);
                    return (
                        <button
                            key={sound.id}
                            onClick={(e) => { e.stopPropagation(); toggleSound(sound.id); }}
                            className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl transition-all duration-300
                ${isActive
                                    ? 'bg-white/15 border border-white/20 shadow-lg scale-105'
                                    : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10'
                                }`}
                        >
                            <span className="text-xl">{sound.emoji}</span>
                            <span className={`text-[10px] uppercase tracking-wider ${isActive ? 'text-white/90' : 'text-white/40'}`}>
                                {sound.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3">
                <span className="text-white/40 text-xs">🔈</span>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={masterVolume}
                    onChange={(e) => setMasterVolume(parseInt(e.target.value))}
                    className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <span className="text-white/40 text-xs">🔊</span>
            </div>
        </div>
    );
}

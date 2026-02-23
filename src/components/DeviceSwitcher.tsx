
'use client';

import React from 'react';
import { useDeviceMode, DeviceMode } from '@/providers/DeviceModeProvider';
import { Monitor, Tablet, Tv, Smartphone } from 'lucide-react';

const DEVICES: { id: DeviceMode; icon: React.ReactNode; label: string }[] = [
    { id: 'mobile', icon: <Smartphone size={15} />, label: 'Mobile' },
    { id: 'tablet', icon: <Tablet size={15} />, label: 'Tablet' },
    { id: 'pc', icon: <Monitor size={15} />, label: 'Desktop' },
    { id: 'tv', icon: <Tv size={15} />, label: 'TV' },
];

export default function DeviceSwitcher() {
    const { device, setDevice } = useDeviceMode();
    const isMobile = device === 'mobile';

    return (
        <div className={`fixed z-50 ${isMobile ? 'top-3 right-3' : 'top-5 right-5'}`}>
            <div
                className="flex items-center gap-0.5 p-1 rounded-2xl border border-white/[0.08] shadow-lg"
                style={{
                    background: 'linear-gradient(135deg, rgba(25,25,45,0.85), rgba(15,15,30,0.9))',
                    backdropFilter: 'blur(20px)',
                }}
            >
                {DEVICES.map((d) => {
                    const isActive = device === d.id;
                    return (
                        <button
                            key={d.id}
                            onClick={() => setDevice(d.id)}
                            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${isActive
                                ? 'text-white shadow-md'
                                : 'text-white/30 hover:text-white/60'
                                }`}
                        >
                            {/* Active background pill */}
                            {isActive && (
                                <div
                                    className="absolute inset-0 rounded-xl border border-white/[0.1]"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                                    }}
                                />
                            )}
                            <span className="relative z-10">{d.icon}</span>
                            <span className="relative z-10 hidden sm:inline tracking-wide">{d.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

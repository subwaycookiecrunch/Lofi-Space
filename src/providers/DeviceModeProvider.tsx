
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type DeviceMode = 'pc' | 'tablet' | 'tv' | 'mobile';

interface DeviceModeContextType {
    device: DeviceMode;
    setDevice: (mode: DeviceMode) => void;
}

const DeviceModeContext = createContext<DeviceModeContextType>({
    device: 'pc',
    setDevice: () => { },
});

export const useDeviceMode = () => useContext(DeviceModeContext);

const STORAGE_KEY = 'lucid-device-mode';

export default function DeviceModeProvider({ children }: { children: React.ReactNode }) {
    const [device, setDevice] = useState<DeviceMode>('pc');

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY) as DeviceMode;
            if (saved && ['pc', 'tablet', 'tv', 'mobile'].includes(saved)) {
                setDevice(saved);
            }
        } catch { }
    }, []);

    const handleSetDevice = (mode: DeviceMode) => {
        setDevice(mode);
        localStorage.setItem(STORAGE_KEY, mode);
    };

    return (
        <DeviceModeContext.Provider value={{ device, setDevice: handleSetDevice }}>
            {children}
        </DeviceModeContext.Provider>
    );
}

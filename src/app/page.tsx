
'use client';

import Background from '@/components/Background';
import MusicPlayer from '@/components/MusicPlayer';
import ZenSounds from '@/components/ZenSounds';
import GenerativeSoundscape from '@/components/GenerativeSoundscape';
import Navbar from '@/components/Navbar';
import Toolbar from '@/components/Toolbar';
import PomodoroTimer from '@/components/PomodoroTimer';
import SleepAlarm from '@/components/SleepAlarm';
import BreathingExercise from '@/components/BreathingExercise';
import SessionStats from '@/components/SessionStats';
import TodoList from '@/components/TodoList';
import FocusStreaks from '@/components/FocusStreaks';
import ShareableCard from '@/components/ShareableCard';
import FocusRoom from '@/components/FocusRoom';
import SpotifyPlayer from '@/components/SpotifyPlayer';
import YouTubePlayer from '@/components/YouTubePlayer';
import ThemePicker from '@/components/ThemePicker';
import CursorTrail from '@/components/CursorTrail';
import AmbientLightSync from '@/components/AmbientLightSync';
import DeviceSwitcher from '@/components/DeviceSwitcher';
import { useTheme } from '@/providers/ThemeProvider';
import { useDeviceMode } from '@/providers/DeviceModeProvider';
import { useEffect, useState, useRef, useCallback } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { mode } = useTheme();
  const { device } = useDeviceMode();

  // Panel toggles
  const [showStats, setShowStats] = useState(false);
  const [showTodo, setShowTodo] = useState(false);
  const [showStreaks, setShowStreaks] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showRoom, setShowRoom] = useState(false);
  const [showSpotify, setShowSpotify] = useState(false);
  const [showYouTube, setShowYouTube] = useState(false);
  const [showThemes, setShowThemes] = useState(false);

  // DND / Focus mode
  const [isDND, setIsDND] = useState(false);

  // Timer state for live wallpaper + focus spotlight + focus room
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const handleTimerChange = useCallback((timeLeft: number, isActive: boolean) => {
    setTimerSeconds(timeLeft);
    setIsTimerActive(isActive);
  }, []);

  // Crossfade
  const prevModeRef = useRef(mode);
  const [showPrevAudio, setShowPrevAudio] = useState(false);
  const [prevMode, setPrevMode] = useState(mode);

  useEffect(() => { setMounted(true); }, []);

  // Crossfade logic
  useEffect(() => {
    if (prevModeRef.current !== mode) {
      setPrevMode(prevModeRef.current);
      setShowPrevAudio(true);
      const timeout = setTimeout(() => setShowPrevAudio(false), 1500);
      prevModeRef.current = mode;
      return () => clearTimeout(timeout);
    }
  }, [mode]);

  // DND toggle
  const toggleDND = useCallback(() => {
    if (!isDND) {
      document.documentElement.requestFullscreen?.().catch(() => { });
      setIsDND(true);
    } else {
      document.exitFullscreen?.().catch(() => { });
      setIsDND(false);
    }
  }, [isDND]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case 'f': toggleDND(); break;
        case 'escape': if (isDND) setIsDND(false); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isDND, toggleDND]);

  // Fullscreen exit listener
  useEffect(() => {
    const handler = () => { if (!document.fullscreenElement && isDND) setIsDND(false); };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [isDND]);

  if (!mounted) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white/20">Init...</div>;
  }

  // Device-specific layout classes
  const isMobile = device === 'mobile';
  const isTablet = device === 'tablet';
  const isTv = device === 'tv';

  const contentMaxWidth = isMobile
    ? 'max-w-[360px]'
    : isTablet
      ? 'max-w-[600px]'
      : isTv
        ? 'max-w-[900px]'
        : 'max-w-2xl';

  const timerScale = isTv
    ? 'scale-[1.4]'
    : isMobile
      ? 'scale-[0.85]'
      : isTablet
        ? 'scale-[1.1]'
        : '';

  return (
    <main className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center">
      <Background isTimerActive={isTimerActive} />
      <AmbientLightSync />
      {!isMobile && <CursorTrail />}

      {/* Device Switcher — top right */}
      {!isDND && <DeviceSwitcher />}

      {/* Navbar */}
      {!isDND && <Navbar />}

      {/* Focus Spotlight Vignette */}
      <div
        className="fixed inset-0 z-[2] pointer-events-none transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(circle at center, transparent 25%, rgba(0,0,0,0.5) 100%)',
          opacity: isTimerActive && mode === 'study' ? 0.8 : 0,
        }}
      />

      {/* Main Content */}
      <div className={`z-10 flex flex-col items-center justify-center w-full ${contentMaxWidth} pointer-events-none
        ${isMobile ? 'space-y-3 px-4' : isTablet ? 'space-y-5 px-6' : isTv ? 'space-y-8' : 'space-y-6'}`}>
        <div className={`pointer-events-auto w-full flex justify-center transition-transform duration-500 ${timerScale}`}>
          {mode === 'study' && <PomodoroTimer onTimerChange={handleTimerChange} />}
          {mode === 'sleep' && <SleepAlarm />}
          {mode === 'relax' && <BreathingExercise />}
        </div>
      </div>

      {/* Audio Players with crossfade */}
      {!isDND && (
        <>
          {showPrevAudio && (
            <div className="transition-opacity duration-[1500ms] opacity-0 pointer-events-none">
              {prevMode === 'sleep' ? <ZenSounds /> : <MusicPlayer />}
            </div>
          )}
          {mode === 'sleep' ? <ZenSounds /> : <MusicPlayer />}
        </>
      )}

      {/* Generative Soundscape */}
      {!isDND && <GenerativeSoundscape />}

      {/* Toolbar */}
      <Toolbar
        onToggleStats={() => setShowStats(!showStats)}
        onToggleTodo={() => setShowTodo(!showTodo)}
        onToggleStreaks={() => setShowStreaks(!showStreaks)}
        onToggleShare={() => setShowShare(!showShare)}
        onToggleRoom={() => setShowRoom(!showRoom)}
        onToggleSpotify={() => setShowSpotify(!showSpotify)}
        onToggleYouTube={() => setShowYouTube(!showYouTube)}
        onToggleThemes={() => setShowThemes(!showThemes)}
        isDND={isDND}
        onToggleDND={toggleDND}
      />

      {/* Modals */}
      <SessionStats isOpen={showStats} onClose={() => setShowStats(false)} />
      <TodoList isOpen={showTodo} onClose={() => setShowTodo(false)} />
      <FocusStreaks isOpen={showStreaks} onClose={() => setShowStreaks(false)} />
      <ShareableCard isOpen={showShare} onClose={() => setShowShare(false)} />
      <FocusRoom isOpen={showRoom} onClose={() => setShowRoom(false)} timerSeconds={timerSeconds} isTimerActive={isTimerActive} />
      <SpotifyPlayer isOpen={showSpotify} onClose={() => setShowSpotify(false)} />
      <YouTubePlayer isOpen={showYouTube} onClose={() => setShowYouTube(false)} />
      <ThemePicker isOpen={showThemes} onClose={() => setShowThemes(false)} />
    </main>
  );
}

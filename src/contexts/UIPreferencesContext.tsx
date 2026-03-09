import React, { createContext, useContext, useState, useEffect } from 'react';

interface UIPreferences {
    soundEffects: boolean;
    dynamicParticles: boolean;
    glitchTransitions: boolean;
    neonCursor: boolean;
}

interface UIPreferencesContextType {
    preferences: UIPreferences;
    togglePreference: (key: keyof UIPreferences) => void;
    playSciFiSound: (type?: 'click' | 'hover' | 'success' | 'error') => void;
}

const defaultPreferences: UIPreferences = {
    soundEffects: false,
    dynamicParticles: false,
    glitchTransitions: false,
    neonCursor: false,
};

const UIPreferencesContext = createContext<UIPreferencesContextType | undefined>(undefined);

export function UIPreferencesProvider({ children }: { children: React.ReactNode }) {
    const [preferences, setPreferences] = useState<UIPreferences>(() => {
        try {
            const saved = localStorage.getItem('slides-ui-preferences');
            if (saved) {
                return { ...defaultPreferences, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to load UI preferences', e);
        }
        return defaultPreferences;
    });

    // Audio Context reference
    const audioCtxRef = React.useRef<AudioContext | null>(null);

    useEffect(() => {
        localStorage.setItem('slides-ui-preferences', JSON.stringify(preferences));
    }, [preferences]);

    const togglePreference = (key: keyof UIPreferences) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const playSciFiSound = (type: 'click' | 'hover' | 'success' | 'error' = 'click') => {
        if (!preferences.soundEffects) return;

        try {
            if (!audioCtxRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                audioCtxRef.current = new AudioContextClass();
            }

            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'hover') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(450, now + 0.05);
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(0.1, now + 0.02);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'success') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.setValueAtTime(600, now + 0.1);
                osc.frequency.setValueAtTime(1000, now + 0.2);
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (type === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            }
        } catch (e) {
            console.warn('Audio playback failed', e);
        }
    };

    return (
        <UIPreferencesContext.Provider value={{ preferences, togglePreference, playSciFiSound }}>
            {children}
        </UIPreferencesContext.Provider>
    );
}

export function useUIPreferences() {
    const context = useContext(UIPreferencesContext);
    if (context === undefined) {
        throw new Error('useUIPreferences must be used within a UIPreferencesProvider');
    }
    return context;
}

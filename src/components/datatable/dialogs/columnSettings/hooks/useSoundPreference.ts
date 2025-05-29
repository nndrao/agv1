import { useState, useEffect } from 'react';

const SOUND_PREFERENCE_KEY = 'column-dialog-sound-enabled';

export const useSoundPreference = () => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem(SOUND_PREFERENCE_KEY);
    return saved !== null ? saved === 'true' : true; // Default to enabled
  });

  useEffect(() => {
    // Save preference to localStorage
    localStorage.setItem(SOUND_PREFERENCE_KEY, soundEnabled.toString());
  }, [soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  return { soundEnabled, toggleSound };
};
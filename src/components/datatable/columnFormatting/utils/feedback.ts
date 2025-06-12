import { useCallback, useRef } from 'react';

// Web Audio API context singleton
let audioContext: AudioContext | null = null;

// Initialize audio context on first user interaction
const initAudioContext = () => {
  if (!audioContext && typeof window !== 'undefined' && window.AudioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

// Play success sound effect
export const playSuccessSound = (enabled = true) => {
  if (!enabled) return;
  
  const ctx = initAudioContext();
  if (!ctx) return;

  try {
    // Create oscillator for success sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Success sound: C5 -> E5 -> G5 (major chord)
    const now = ctx.currentTime;
    oscillator.frequency.setValueAtTime(523.25, now); // C5
    oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
    
    // Fade in and out
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  } catch (error) {
    console.warn('Failed to play success sound:', error);
  }
};

// Trigger haptic feedback
export const triggerHapticFeedback = (pattern: 'success' | 'light' | 'medium' = 'success') => {
  if (!('vibrate' in navigator)) return;
  
  try {
    switch (pattern) {
      case 'success':
        // Two short pulses
        navigator.vibrate([50, 50, 50]);
        break;
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
    }
  } catch (error) {
    console.warn('Failed to trigger haptic feedback:', error);
  }
};

// Hook for button feedback
export const useButtonFeedback = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const animationTimeoutRef = useRef<number | null>(null);
  
  const triggerFeedback = useCallback((options?: {
    sound?: boolean;
    haptic?: boolean;
    visual?: boolean;
  }) => {
    const { sound = true, haptic = true, visual = true } = options || {};
    
    // Use requestIdleCallback for non-critical feedback
    const performFeedback = () => {
      // Clear any existing animation timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      
      // Visual feedback
      if (visual && buttonRef.current) {
        const button = buttonRef.current;
        
        // Animate using inline styles instead of CSS classes
        const originalTransform = button.style.transform;
        const originalTransition = button.style.transition;
        
        button.style.transition = 'transform 0.15s ease-out';
        button.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
          button.style.transform = 'scale(1.05)';
          setTimeout(() => {
            button.style.transform = originalTransform || '';
            button.style.transition = originalTransition || '';
          }, 150);
        }, 50);
      }
      
      // Audio feedback (non-blocking)
      if (sound) {
        // Defer sound to next microtask
        Promise.resolve().then(() => playSuccessSound());
      }
      
      // Haptic feedback (non-blocking)
      if (haptic) {
        // Defer haptic to next microtask
        Promise.resolve().then(() => triggerHapticFeedback('success'));
      }
    };
    
    // Use requestIdleCallback if available, otherwise use setTimeout
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(performFeedback, { timeout: 50 });
    } else {
      setTimeout(performFeedback, 0);
    }
  }, []);
  
  return { buttonRef, triggerFeedback };
};

// Progress indicator hook
export const useProgressIndicator = () => {
  const progressRef = useRef<HTMLDivElement>(null);
  
  const showProgress = useCallback(() => {
    if (progressRef.current) {
      progressRef.current.style.opacity = '1';
      const inner = progressRef.current.querySelector('div');
      if (inner) {
        inner.style.animation = 'slide 1.5s ease-in-out infinite';
      }
    }
  }, []);
  
  const hideProgress = useCallback(() => {
    if (progressRef.current) {
      progressRef.current.style.opacity = '0';
      const inner = progressRef.current.querySelector('div');
      if (inner) {
        inner.style.animation = 'none';
      }
    }
  }, []);
  
  return { progressRef, showProgress, hideProgress };
};
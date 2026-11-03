import { useCallback, useSyncExternalStore } from 'react';

const KEY = 'kikes_sound_enabled';
const listeners = new Set();
let enabled = (() => {
  try {
    return localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
})();

function setEnabled(value) {
  enabled = value;
  try {
    localStorage.setItem(KEY, value ? '1' : '0');
  } catch {
    // sin localStorage
  }
  listeners.forEach((l) => l());
}

// Un único AudioContext reutilizable (antes se creaba uno por sonido y nunca se cerraba).
let ctx = null;
function audioContext() {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  ctx = AudioCtx ? new AudioCtx() : null;
  return ctx;
}

/** Reproduce el timbre si el sonido está activo. Lee el valor actual (sin closures viejos). */
export function playChime() {
  if (!enabled) return;
  try {
    const ac = audioContext();
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.frequency.setValueAtTime(587.33, ac.currentTime);
    osc.frequency.setValueAtTime(880, ac.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
    osc.start();
    osc.stop(ac.currentTime + 0.3);
  } catch {
    // audio no disponible
  }
}

export function useSound() {
  const soundEnabled = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => enabled
  );
  const toggleSound = useCallback(() => setEnabled(!enabled), []);
  return { soundEnabled, toggleSound };
}

import { useCallback, useRef } from 'react';

/**
 * Plays a short notification beep using Web Audio API.
 * No external audio files needed.
 */
export function useNotificationSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback(() => {
    if (!enabled) return;
    try {
      if (!ctxRef.current || ctxRef.current.state === 'closed') {
        ctxRef.current = new AudioContext();
      }
      const ctx = ctxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // AudioContext not available (e.g. test env) — silently ignore
    }
  }, [enabled]);

  return play;
}

'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Web Audio API-based sound generator.
 * - tick: short click sound when the wheel passes a segment boundary
 * - win: celebratory chord when the wheel stops
 * - whoosh: low sweep during the spin
 */
export function useWheelSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const lastTickRef = useRef<number>(0);
  const masterGainRef = useRef<GainNode | null>(null);

  const ensureCtx = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0.6;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterGainRef.current = master;
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  const tick = useCallback((pitch = 1) => {
    const ctx = ensureCtx();
    if (!ctx || !masterGainRef.current) return;
    // Throttle: max 30 ticks/sec
    const now = ctx.currentTime;
    if (now - lastTickRef.current < 0.03) return;
    lastTickRef.current = now;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 880 * pitch;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(masterGainRef.current);
    osc.start(now);
    osc.stop(now + 0.06);
  }, [ensureCtx]);

  const win = useCallback(() => {
    const ctx = ensureCtx();
    if (!ctx || !masterGainRef.current) return;
    const now = ctx.currentTime;
    // Major chord arpeggio: C5 E5 G5 C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.08;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
      osc.connect(gain);
      gain.connect(masterGainRef.current!);
      osc.start(start);
      osc.stop(start + 0.85);
    });
  }, [ensureCtx]);

  const whoosh = useCallback(() => {
    const ctx = ensureCtx();
    if (!ctx || !masterGainRef.current) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 5);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 5);
    osc.connect(gain);
    gain.connect(masterGainRef.current);
    osc.start(now);
    osc.stop(now + 5);
  }, [ensureCtx]);

  useEffect(() => {
    return () => {
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  return { tick, win, whoosh, ensureCtx };
}

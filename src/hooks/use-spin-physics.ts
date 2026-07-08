'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SpinResult = {
  finalRotation: number;
  winningIndex: number;
  durationMs: number;
};

type Options = {
  segmentCount: number;
  onTick: (segmentIndex: number) => void;
  onResult?: (result: SpinResult) => void;
};

const TWO_PI = Math.PI * 2;

/**
 * Physics-based spinning hook.
 *
 * - Picks a random target segment (weighted externally if needed).
 * - Computes a final rotation that lands the pointer inside that segment.
 * - Animates with ease-out cubic deceleration over ~5-7 seconds.
 * - Calls onTick whenever the pointer crosses a segment boundary.
 */
export function useSpinPhysics({ segmentCount, onTick, onResult }: Options) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const startRotRef = useRef(0);
  const targetRotRef = useRef(0);
  const startTimeRef = useRef(0);
  const durationRef = useRef(0);
  const segCountRef = useRef(segmentCount);
  const onTickRef = useRef(onTick);
  const onResultRef = useRef(onResult);

  useEffect(() => { segCountRef.current = segmentCount; }, [segmentCount]);
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  const stop = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsSpinning(false);
  }, []);

  const animateRef = useRef<((now: number) => void) | null>(null);

  useEffect(() => {
    animateRef.current = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const t = Math.min(1, elapsed / durationRef.current);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = startRotRef.current + (targetRotRef.current - startRotRef.current) * eased;
      setRotation(current);

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame((n) => animateRef.current?.(n));
      } else {
        animFrameRef.current = null;
        setIsSpinning(false);
        // Compute winning segment from final rotation
        const norm = ((-Math.PI / 2 - current) % TWO_PI + TWO_PI) % TWO_PI;
        const segSize = TWO_PI / segCountRef.current;
        const winningIndex = Math.floor(norm / segSize) % segCountRef.current;
        onResultRef.current?.({
          finalRotation: current,
          winningIndex,
          durationMs: durationRef.current,
        });
      }
    };
  }, []);

  const spin = useCallback((targetIndex?: number) => {
    if (isSpinning || segCountRef.current === 0) return;
    const n = segCountRef.current;
    const segSize = TWO_PI / n;
    const target = targetIndex ?? Math.floor(Math.random() * n);

    // We want pointer (at -π/2) to land in segment `target`.
    // Segment i occupies [i*segSize, (i+1)*segSize) in wheel-local coords (0 at +x axis).
    // After rotation R, a wheel-local angle θ appears at screen angle θ + R.
    // Pointer at screen angle -π/2 → wheel-local angle = -π/2 - R.
    // We need -π/2 - R ∈ [target*segSize, (target+1)*segSize)
    // → R ∈ (-π/2 - (target+1)*segSize, -π/2 - target*segSize]
    // Add randomness within segment (avoid edges)
    const jitter = segSize * (0.2 + Math.random() * 0.6);
    const targetWheelAngle = target * segSize + jitter;
    // We want -π/2 - R ≡ targetWheelAngle (mod 2π)
    // → R ≡ -π/2 - targetWheelAngle (mod 2π)
    const desiredFinalMod = ((-Math.PI / 2 - targetWheelAngle) % TWO_PI + TWO_PI) % TWO_PI;

    const current = rotation;
    const currentMod = ((current % TWO_PI) + TWO_PI) % TWO_PI;
    // Compute delta to reach desiredFinalMod (forward only, since wheel spins clockwise)
    let delta = desiredFinalMod - currentMod;
    if (delta <= 0) delta += TWO_PI;

    // Add at least 5 full rotations for drama
    const extraRotations = 5 + Math.floor(Math.random() * 3); // 5-7
    const totalDelta = delta + extraRotations * TWO_PI;

    startRotRef.current = current;
    targetRotRef.current = current + totalDelta;
    durationRef.current = 5000 + Math.random() * 1500; // 5-6.5s
    startTimeRef.current = performance.now();
    setIsSpinning(true);
    animFrameRef.current = requestAnimationFrame((n) => animateRef.current?.(n));
  }, [isSpinning, rotation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return { rotation, isSpinning, spin, stop, setRotation };
}

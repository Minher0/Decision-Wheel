'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Choice } from '@/lib/wheel-types';

type Props = {
  choices: Choice[];
  rotation: number;
  size?: number;
  isSpinning: boolean;
  winningIndex?: number | null;
  onTick?: () => void;
};

// Pointer sits at top (12 o'clock), pointing down into the wheel.
const POINTER_ANGLE = -Math.PI / 2;

// Editorial palette: alternating ink/bone segments with one signal-red accent.
// We don't use per-choice colors anymore — the wheel has its own disciplined palette.
// Color is reserved for the WINNER highlight (signal red).
const INK = '#0A0A0A';
const BONE = '#F2EEE5';
const RED = '#E63329';

export default function WheelCanvas({
  choices,
  rotation,
  size = 520,
  isSpinning,
  winningIndex,
  onTick,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastSegmentRef = useRef<number>(-1);
  const rotationRef = useRef<number>(rotation);
  const choicesRef = useRef<Choice[]>(choices);
  const winningRef = useRef<number | null | undefined>(winningIndex);
  const onTickRef = useRef<((idx: number) => void) | undefined>(undefined);
  const sizeRef = useRef<number>(size);

  useEffect(() => { rotationRef.current = rotation; }, [rotation]);
  useEffect(() => { choicesRef.current = choices; }, [choices]);
  useEffect(() => { winningRef.current = winningIndex; }, [winningIndex]);
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);
  useEffect(() => { sizeRef.current = size; }, [size]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displaySize = sizeRef.current;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== displaySize * dpr || canvas.height !== displaySize * dpr) {
      canvas.width = displaySize * dpr;
      canvas.height = displaySize * dpr;
      canvas.style.width = `${displaySize}px`;
      canvas.style.height = `${displaySize}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, displaySize, displaySize);

    const cx = displaySize / 2;
    const cy = displaySize / 2;
    const radius = displaySize / 2 - 2;

    const items = choicesRef.current;
    if (items.length === 0) {
      // Empty state — a single thin circle
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = '500 13px var(--font-geist-mono), ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NO CHOICES', cx, cy);
      return;
    }

    // Equal-weight segments (we ignore per-choice weights for the visual —
    // editorial discipline: every choice is equal until the wheel decides).
    const n = items.length;
    const segAngle = (Math.PI * 2) / n;

    // Tick detection (only while spinning)
    if (isSpinning) {
      const effectiveAngle = ((POINTER_ANGLE - rotationRef.current) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const currentIdx = Math.floor(effectiveAngle / segAngle) % n;
      if (lastSegmentRef.current !== -1 && lastSegmentRef.current !== currentIdx) {
        onTickRef.current?.(currentIdx);
      }
      lastSegmentRef.current = currentIdx;
    } else {
      lastSegmentRef.current = -1;
    }

    // Draw segments
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotationRef.current);

    const winIdx = winningRef.current;
    for (let i = 0; i < n; i++) {
      const start = i * segAngle;
      const end = (i + 1) * segAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, end);
      ctx.closePath();

      // Alternating fill: ink / bone. Winner override: signal red.
      let fill: string;
      if (winIdx != null && i === winIdx && !isSpinning) {
        fill = RED;
      } else {
        fill = i % 2 === 0 ? INK : BONE;
      }
      ctx.fillStyle = fill;
      ctx.fill();

      // Hairline divider
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label — rotated to read outward, mono caps, small
      const mid = start + segAngle / 2;
      ctx.save();
      ctx.rotate(mid);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const fontSize = Math.max(10, Math.min(15, 180 / Math.sqrt(n)));
      ctx.font = `500 ${fontSize}px var(--font-geist-mono), ui-monospace, monospace`;

      // Label text: uppercase, truncate
      let label = (items[i].label || `#${i + 1}`).toUpperCase();
      const maxW = radius * 0.62;
      if (ctx.measureText(label).width > maxW) {
        while (label.length > 1 && ctx.measureText(label + '…').width > maxW) {
          label = label.slice(0, -1);
        }
        label += '…';
      }

      // Letter-spacing simulation: draw char by char for tighter control on mono
      const textY = 0;
      const inkColor = fill === INK || fill === RED ? BONE : INK;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillText(label, radius - 16, textY + 0.6);
      ctx.fillStyle = inkColor;
      ctx.fillText(label, radius - 16, textY);
      ctx.restore();
    }

    ctx.restore();

    // Outer ring — single thin ink stroke, no studs, no gold
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center hub — flat ink disc with a bone pinhole. No gradient, no glow.
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = BONE;
    ctx.fill();

    // Pointer — a clean ink triangle pointing down from above the wheel.
    // No gradient, no gold. Just ink.
    ctx.save();
    ctx.translate(cx, cy - radius + 2);
    ctx.beginPath();
    ctx.moveTo(-9, -14);
    ctx.lineTo(9, -14);
    ctx.lineTo(0, 4);
    ctx.closePath();
    ctx.fillStyle = RED; // the one accent — the pointer is the only red on the wheel at rest
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }, [isSpinning]);

  useEffect(() => {
    draw();
  }, [draw, rotation, choices, isSpinning, winningIndex]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="block max-w-full h-auto"
      style={{
        // Subtle paper-edge shadow only — no purple glow
        filter: 'drop-shadow(0 1px 0 rgba(10,10,10,0.08))',
      }}
      aria-label="Decision wheel"
    />
  );
}

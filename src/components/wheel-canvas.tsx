'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Choice } from '@/lib/wheel-types';

type Props = {
  choices: Choice[];
  rotation: number;
  size?: number;
  isSpinning: boolean;
  canSpin: boolean;
  winningIndex?: number | null;
  onTick?: () => void;
  onSpin: () => void;
};

const POINTER_ANGLE = -Math.PI / 2;

// Dark HUD palette
const INK = '#0A0B0E';       // background dark
const BONE = '#E4E0D6';      // foreground light
const DIM = '#2A2D33';       // dim segment
const ORANGE = '#FF5C1F';    // signal accent
const MUTED = '#5A5E66';     // muted text

export default function WheelCanvas({
  choices,
  rotation,
  size = 480,
  isSpinning,
  canSpin,
  winningIndex,
  onTick,
  onSpin,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const lastSegmentRef = useRef<number>(-1);
  const rotationRef = useRef<number>(rotation);
  const choicesRef = useRef<Choice[]>(choices);
  const winningRef = useRef<number | null | undefined>(winningIndex);
  const onTickRef = useRef<((idx: number) => void) | undefined>(undefined);
  const sizeRef = useRef<number>(size);
  const hoveredRef = useRef<boolean>(false);

  useEffect(() => { rotationRef.current = rotation; }, [rotation]);
  useEffect(() => { choicesRef.current = choices; }, [choices]);
  useEffect(() => { winningRef.current = winningIndex; }, [winningIndex]);
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);
  useEffect(() => { sizeRef.current = size; }, [size]);
  useEffect(() => { hoveredRef.current = hovered; }, [hovered]);

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
    const radius = displaySize / 2 - 24; // leave room for corner brackets

    const items = choicesRef.current;
    if (items.length === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = MUTED;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = MUTED;
      ctx.font = '500 11px var(--font-geist-mono), ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('// NO OPTIONS', cx, cy);
      ctx.fillText('// ADD 2+ TO SPIN', cx, cy + 16);
      return;
    }

    const n = items.length;
    const segAngle = (Math.PI * 2) / n;

    // Tick detection
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

    // === DRAW SEGMENTS ===
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

      // Alternating fills: dim / ink, with winner = orange
      let fill: string;
      if (winIdx != null && i === winIdx && !isSpinning) {
        fill = ORANGE;
      } else {
        fill = i % 2 === 0 ? DIM : INK;
      }
      ctx.fillStyle = fill;
      ctx.fill();

      // Segment divider — thin bone line
      ctx.strokeStyle = winIdx != null && i === winIdx && !isSpinning ? ORANGE : 'rgba(228, 224, 214, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label — mono, uppercase, small, oriented outward
      const mid = start + segAngle / 2;
      ctx.save();
      ctx.rotate(mid);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const fontSize = Math.max(10, Math.min(14, 160 / Math.sqrt(n)));
      ctx.font = `500 ${fontSize}px var(--font-geist-mono), ui-monospace, monospace`;

      let label = (items[i].label || `#${i + 1}`).toUpperCase();
      const maxW = radius * 0.6;
      if (ctx.measureText(label).width > maxW) {
        while (label.length > 1 && ctx.measureText(label + '…').width > maxW) {
          label = label.slice(0, -1);
        }
        label += '…';
      }

      const labelColor = winIdx != null && i === winIdx && !isSpinning ? INK : BONE;
      ctx.fillStyle = labelColor;
      ctx.fillText(label, radius - 14, 0);
      ctx.restore();
    }

    ctx.restore();

    // === OUTER RING ===
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = hoveredRef.current ? ORANGE : 'rgba(228, 224, 214, 0.3)';
    ctx.lineWidth = hoveredRef.current ? 2 : 1;
    ctx.stroke();

    // === CORNER BRACKETS (HUD) ===
    // Four L-shaped brackets at 45° offsets, outside the wheel
    const bracketR = radius + 8;
    const bracketLen = 14;
    const bracketAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2]; // right, bottom, left, top
    ctx.strokeStyle = hoveredRef.current ? ORANGE : 'rgba(228, 224, 214, 0.4)';
    ctx.lineWidth = 1.5;
    bracketAngles.forEach((a) => {
      const bx = cx + Math.cos(a) * bracketR;
      const by = cy + Math.sin(a) * bracketR;
      // Tangent direction
      const tx = -Math.sin(a);
      const ty = Math.cos(a);
      // Radial direction
      const rx = Math.cos(a);
      const ry = Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(bx + tx * bracketLen / 2, by + ty * bracketLen / 2);
      ctx.lineTo(bx - tx * bracketLen / 2, by - ty * bracketLen / 2);
      ctx.stroke();
      // Small radial tick
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + rx * 4, by + ry * 4);
      ctx.stroke();
    });

    // === CENTER HUB ===
    // Dark disc with thin orange ring (orange only when hovered or has winner)
    const centerColor = winIdx != null && !isSpinning ? ORANGE : (hoveredRef.current && canSpin ? ORANGE : 'rgba(228, 224, 214, 0.3)');
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.strokeStyle = centerColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center icon: depends on state
    if (isSpinning) {
      // Spinning — show a small spinning dot
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = ORANGE;
      ctx.fill();
    } else if (winIdx != null) {
      // Has winner — show a checkmark
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy);
      ctx.lineTo(cx - 1, cy + 4);
      ctx.lineTo(cx + 6, cy - 4);
      ctx.stroke();
    } else if (canSpin) {
      // Ready — show a play triangle
      ctx.fillStyle = ORANGE;
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy - 5);
      ctx.lineTo(cx + 5, cy);
      ctx.lineTo(cx - 3, cy + 5);
      ctx.closePath();
      ctx.fill();
    } else {
      // Not ready
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = MUTED;
      ctx.fill();
    }

    // === POINTER ===
    // Triangle at top, pointing down. Orange always (it's the active element).
    ctx.save();
    ctx.translate(cx, cy - radius - 2);
    ctx.beginPath();
    ctx.moveTo(-7, -10);
    ctx.lineTo(7, -10);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fillStyle = ORANGE;
    ctx.fill();
    ctx.restore();
  }, [isSpinning, canSpin]);

  useEffect(() => {
    draw();
  }, [draw, rotation, choices, isSpinning, winningIndex, hovered, canSpin]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  return (
    <div
      ref={wrapRef}
      role="button"
      tabIndex={canSpin ? 0 : -1}
      aria-label={canSpin ? 'Spin the wheel' : 'Wheel not ready'}
      onClick={() => { if (canSpin && !isSpinning) onSpin(); }}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && canSpin && !isSpinning) {
          e.preventDefault();
          onSpin();
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative inline-block transition-transform"
      style={{
        cursor: canSpin && !isSpinning ? 'pointer' : 'default',
      }}
    >
      <canvas
        ref={canvasRef}
        className="block max-w-full h-auto"
        style={{
          filter: isSpinning
            ? 'drop-shadow(0 0 24px rgba(255, 92, 31, 0.4))'
            : 'drop-shadow(0 0 12px rgba(255, 92, 31, 0.08))',
        }}
        aria-hidden="true"
      />
      {/* Hover hint — only when ready and not spinning */}
      {canSpin && !isSpinning && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-12 font-mono text-[10px] uppercase tracking-[0.2em] opacity-0 transition-opacity duration-200"
          style={{ opacity: hovered ? 0.8 : 0, color: ORANGE }}
        >
          ▶ click to spin
        </div>
      )}
    </div>
  );
}

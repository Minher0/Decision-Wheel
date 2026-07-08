'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Choice } from '@/lib/wheel-types';

type Props = {
  choices: Choice[];
  rotation: number; // current rotation in radians
  size?: number;
  isSpinning: boolean;
  onTick?: () => void; // sound tick when segment boundary passes pointer
};

// Pointer sits at top (12 o'clock), pointing down into the wheel.
const POINTER_ANGLE = -Math.PI / 2;

export default function WheelCanvas({
  choices,
  rotation,
  size = 480,
  isSpinning,
  onTick,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastSegmentRef = useRef<number>(-1);
  const rotationRef = useRef<number>(rotation);
  const choicesRef = useRef<Choice[]>(choices);
  const onTickRef = useRef<((idx: number) => void) | undefined>(undefined);

  // Keep refs in sync without re-subscribing
  useEffect(() => { rotationRef.current = rotation; }, [rotation]);
  useEffect(() => { choicesRef.current = choices; }, [choices]);
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displaySize = size;
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
    const radius = displaySize / 2 - 8;

    const items = choicesRef.current;
    if (items.length === 0) {
      // Empty state - draw a faint ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '14px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add choices to spin', cx, cy);
      return;
    }

    // Compute weighted angles
    const totalWeight = items.reduce((s, c) => s + Math.max(1, c.weight || 1), 0);
    const segments = items.map((c, i) => ({
      choice: c,
      startAngle: 0,
      endAngle: 0,
      midAngle: 0,
      index: i,
    }));
    let acc = 0;
    items.forEach((c, i) => {
      const w = Math.max(1, c.weight || 1);
      const segAngle = (w / totalWeight) * Math.PI * 2;
      segments[i].startAngle = acc;
      segments[i].endAngle = acc + segAngle;
      segments[i].midAngle = acc + segAngle / 2;
      acc += segAngle;
    });

    // Detect tick (segment boundary passing pointer)
    if (isSpinning) {
      // The pointer is at POINTER_ANGLE in screen space.
      // Wheel rotation shifts segment positions: effective angle of a point = POINTER_ANGLE - rotation
      const effectiveAngle = ((POINTER_ANGLE - rotationRef.current) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      // Find which segment is currently under the pointer
      let currentIdx = 0;
      for (let i = 0; i < segments.length; i++) {
        const sa = segments[i].startAngle;
        const ea = segments[i].endAngle;
        if (effectiveAngle >= sa && effectiveAngle < ea) {
          currentIdx = i;
          break;
        }
      }
      if (lastSegmentRef.current !== -1 && lastSegmentRef.current !== currentIdx) {
        onTickRef.current?.(currentIdx);
      }
      lastSegmentRef.current = currentIdx;
    } else {
      lastSegmentRef.current = -1;
    }

    // Draw outer glow
    const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius * 1.15);
    glowGrad.addColorStop(0, 'rgba(255, 0, 110, 0.0)');
    glowGrad.addColorStop(0.5, 'rgba(255, 0, 110, 0.25)');
    glowGrad.addColorStop(1, 'rgba(131, 56, 236, 0.0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Draw segments
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotationRef.current);

    segments.forEach((seg) => {
      // Segment fill
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, seg.startAngle, seg.endAngle);
      ctx.closePath();

      // Gradient fill for premium feel
      const grad = ctx.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius);
      const baseColor = seg.choice.color;
      grad.addColorStop(0, lighten(baseColor, 0.15));
      grad.addColorStop(0.7, baseColor);
      grad.addColorStop(1, darken(baseColor, 0.15));
      ctx.fillStyle = grad;
      ctx.fill();

      // Segment border (subtle gold)
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      const labelAngle = seg.midAngle;
      ctx.save();
      ctx.rotate(labelAngle);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const fontSize = Math.max(11, Math.min(18, 200 / Math.sqrt(items.length)));
      ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;

      // Truncate long labels
      const maxLabelWidth = radius * 0.7;
      let label = seg.choice.label || `Choice ${seg.index + 1}`;
      if (ctx.measureText(label).width > maxLabelWidth) {
        while (label.length > 1 && ctx.measureText(label + '…').width > maxLabelWidth) {
          label = label.slice(0, -1);
        }
        label += '…';
      }

      // Label shadow for readability
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillText(label, radius - 18, 1);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, radius - 18, 0);
      ctx.restore();
    });

    ctx.restore();

    // Center hub
    const hubGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 36);
    hubGrad.addColorStop(0, '#FFD700');
    hubGrad.addColorStop(0.6, '#FFBE0B');
    hubGrad.addColorStop(1, '#FB5607');
    ctx.beginPath();
    ctx.arc(cx, cy, 36, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#1a0b2e';
    ctx.fill();

    // Outer ring (gold)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Studs around the outer ring
    const studCount = 24;
    for (let i = 0; i < studCount; i++) {
      const a = (i / studCount) * Math.PI * 2;
      const sx = cx + Math.cos(a) * radius;
      const sy = cy + Math.sin(a) * radius;
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#FFD700' : '#FF006E';
      ctx.fill();
    }

    // Pointer (triangle at top, pointing down)
    ctx.save();
    ctx.translate(cx, cy - radius - 4);
    ctx.beginPath();
    ctx.moveTo(-14, -10);
    ctx.lineTo(14, -10);
    ctx.lineTo(0, 22);
    ctx.closePath();
    const ptrGrad = ctx.createLinearGradient(0, -10, 0, 22);
    ptrGrad.addColorStop(0, '#FFD700');
    ptrGrad.addColorStop(1, '#FB5607');
    ctx.fillStyle = ptrGrad;
    ctx.fill();
    ctx.strokeStyle = '#1a0b2e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }, [size, isSpinning]);

  // Redraw whenever inputs change
  useEffect(() => {
    draw();
  }, [draw, rotation, choices, isSpinning]);

  // Redraw on resize / dpr change
  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="block max-w-full h-auto"
      style={{ filter: isSpinning ? 'drop-shadow(0 0 30px rgba(255, 0, 110, 0.6))' : 'drop-shadow(0 10px 40px rgba(131, 56, 236, 0.4))' }}
      aria-label="Decision wheel"
    />
  );
}

// --- Color helpers (hex) ---
function clamp(n: number) { return Math.max(0, Math.min(255, n)); }

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => clamp(Math.round(v)).toString(16).padStart(2, '0')).join('');
}

function lighten(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}

function darken(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amt), g * (1 - amt), b * (1 - amt));
}

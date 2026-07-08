'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Choice } from '@/lib/wheel-types';

type Props = {
  open: boolean;
  winner: Choice | null;
  onClose: () => void;
  onSpinAgain: () => void;
  onShare: () => void;
};

export default function ResultModal({ open, winner, onClose, onSpinAgain, onShare }: Props) {
  useEffect(() => {
    if (open && winner) {
      // Celebratory confetti burst
      const colors = [winner.color, '#FFD700', '#FF006E', '#8338EC', '#06FFA5'];
      const end = Date.now() + 1800;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 70,
          origin: { x: 0, y: 0.7 },
          colors,
          scalar: 1.1,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 70,
          origin: { x: 1, y: 0.7 },
          colors,
          scalar: 1.1,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();

      // Big initial burst from center
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { x: 0.5, y: 0.6 },
        colors,
        scalar: 1.3,
        ticks: 250,
      });
    }
  }, [open, winner]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-0 bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] text-white shadow-2xl">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-60 blur-2xl"
          style={{
            background: winner
              ? `radial-gradient(circle at 50% 40%, ${winner.color}55, transparent 60%)`
              : 'transparent',
          }}
        />
        <DialogHeader className="items-center text-center">
          <div
            className="mb-2 flex h-16 w-16 items-center justify-center rounded-full ring-4 ring-white/20"
            style={{
              backgroundColor: winner?.color,
              boxShadow: `0 0 40px ${winner?.color}cc`,
            }}
          >
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="bg-gradient-to-r from-amber-200 via-fuchsia-300 to-amber-200 bg-clip-text text-2xl font-bold text-transparent">
            Winner!
          </DialogTitle>
          <DialogDescription className="sr-only">
            The wheel has selected a winner.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 text-center">
          <p className="text-sm uppercase tracking-widest text-white/50">Your decision is</p>
          <p className="mt-2 break-words text-4xl font-black tracking-tight text-white">
            {winner?.label}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={onSpinAgain}
            className="flex-1 bg-gradient-to-r from-fuchsia-500 to-amber-400 text-black hover:from-fuchsia-400 hover:to-amber-300"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Spin Again
          </Button>
          <Button
            onClick={onShare}
            variant="outline"
            className="flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share Wheel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

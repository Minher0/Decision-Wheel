'use client';

import { useEffect } from 'react';
import { RotateCcw, Share2, X } from 'lucide-react';
import type { Choice } from '@/lib/wheel-types';

type Props = {
  open: boolean;
  winner: Choice | null;
  winnerIndex: number | null;
  onClose: () => void;
  onSpinAgain: () => void;
  onShare: () => void;
};

export default function ResultModal({
  open,
  winner,
  winnerIndex,
  onClose,
  onSpinAgain,
  onShare,
}: Props) {
  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // Keyboard: Esc to close, S to share, Space to spin again
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onSpinAgain(); }
      if (e.key.toLowerCase() === 's') onShare();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, onSpinAgain, onShare]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F2EEE5]">
      {/* Close — top right, minimal */}
      <button
        onClick={onClose}
        className="absolute right-6 top-6 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0A]/50 hover:text-[#E63329]"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Top-left meta */}
      <div className="absolute left-6 top-6 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0A]/50">
        Result
      </div>

      {/* Main content — centered, massive */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {/* Index marker — like a chapter number */}
        {winnerIndex != null && (
          <div className="mb-8 font-mono text-sm tabular-nums text-[#0A0A0A]/40">
            № {String(winnerIndex + 1).padStart(2, '0')}
          </div>
        )}

        {/* The winner — display weight, tight tracking, single line if possible */}
        <h2
          className="break-words text-center font-sans text-6xl font-extrabold leading-[0.95] tracking-tighter text-[#0A0A0A] sm:text-7xl md:text-8xl lg:text-9xl"
          style={{
            // Red underline — the only accent, the only color on the screen
            borderBottom: '6px solid #E63329',
            paddingBottom: '0.1em',
          }}
        >
          {winner?.label || '—'}
        </h2>

        <p className="mt-10 font-mono text-xs uppercase tracking-[0.25em] text-[#0A0A0A]/50">
          The wheel has decided
        </p>
      </div>

      {/* Bottom actions — text links, not buttons */}
      <div className="flex items-center justify-center gap-8 border-t border-[#0A0A0A]/10 py-6">
        <button
          onClick={onSpinAgain}
          className="group flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0A] hover:text-[#E63329]"
        >
          <RotateCcw className="h-3.5 w-3.5 transition-transform group-hover:-rotate-180" />
          Spin again
          <kbd className="ml-1 hidden border border-[#0A0A0A]/20 px-1.5 py-0.5 text-[10px] sm:inline">↵</kbd>
        </button>
        <span className="text-[#0A0A0A]/20">·</span>
        <button
          onClick={onShare}
          className="group flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0A] hover:text-[#E63329]"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
          <kbd className="ml-1 hidden border border-[#0A0A0A]/20 px-1.5 py-0.5 text-[10px] sm:inline">S</kbd>
        </button>
      </div>
    </div>
  );
}

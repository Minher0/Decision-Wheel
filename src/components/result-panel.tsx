'use client';

import { RotateCcw, X, Share2 } from 'lucide-react';
import type { Choice } from '@/lib/wheel-types';

type Props = {
  winner: Choice | null;
  winnerIndex: number | null;
  isSpinning: boolean;
  onRemove: () => void;
  onSpinAgain: () => void;
  onShare: () => void;
  onDismiss: () => void;
};

const ORANGE = '#FF5C1F';
const MUTED = '#5A5E66';
const BONE = '#E4E0D6';

export default function ResultPanel({
  winner,
  winnerIndex,
  isSpinning,
  onRemove,
  onSpinAgain,
  onShare,
  onDismiss,
}: Props) {
  // Three states:
  // 1. Spinning — show "SPINNING..." with animated dots
  // 2. Has winner — show winner + actions
  // 3. Idle — show "READY" placeholder

  return (
    <div
      className="border border-[#E4E0D6]/10 bg-[#0F1115]"
      style={{ minHeight: '120px' }}
    >
      {/* Header bar — status line */}
      <div className="flex items-center justify-between border-b border-[#E4E0D6]/10 px-4 py-2">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em]">
          {/* Status dot */}
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: isSpinning ? ORANGE : winner ? ORANGE : MUTED,
              animation: isSpinning ? 'pulse 1s ease-in-out infinite' : undefined,
            }}
          />
          <span style={{ color: isSpinning ? ORANGE : winner ? ORANGE : MUTED }}>
            {isSpinning ? 'SPINNING' : winner ? 'RESULT' : 'READY'}
          </span>
        </div>
        {winner && !isSpinning && (
          <button
            onClick={onDismiss}
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5A5E66] hover:text-[#E4E0D6]"
            aria-label="Dismiss result"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        {isSpinning ? (
          <div className="flex items-center gap-3">
            <div className="font-mono text-sm text-[#5A5E66]">
              <span className="text-[#FF5C1F]">●</span> computing result
              <span className="ml-1 inline-block animate-pulse">_</span>
            </div>
          </div>
        ) : winner ? (
          <div>
            {/* Winner display */}
            <div className="flex items-baseline gap-3">
              {winnerIndex != null && (
                <span className="font-mono text-xs tabular-nums text-[#5A5E66]">
                  {String(winnerIndex + 1).padStart(2, '0')}
                </span>
              )}
              <h3
                className="font-sans text-3xl font-extrabold tracking-tight sm:text-4xl"
                style={{ color: BONE }}
              >
                {winner.label}
              </h3>
            </div>

            {/* Actions — inline, no modal needed */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={onSpinAgain}
                className="group flex items-center gap-2 border border-[#FF5C1F] bg-[#FF5C1F]/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF5C1F] transition-colors hover:bg-[#FF5C1F] hover:text-[#0A0B0E]"
              >
                <RotateCcw className="h-3 w-3" />
                Spin again
              </button>
              <button
                onClick={onRemove}
                className="group flex items-center gap-2 border border-[#E4E0D6]/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#E4E0D6]/70 transition-colors hover:border-[#FF5C1F] hover:text-[#FF5C1F]"
              >
                <X className="h-3 w-3" />
                Remove & spin
              </button>
              <button
                onClick={onShare}
                className="flex items-center gap-2 border border-[#E4E0D6]/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#E4E0D6]/70 transition-colors hover:border-[#FF5C1F] hover:text-[#FF5C1F]"
              >
                <Share2 className="h-3 w-3" />
                Share
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs text-[#5A5E66]">›</span>
            <p className="font-mono text-sm text-[#5A5E66]">
              Click the wheel or press{' '}
              <kbd className="border border-[#E4E0D6]/20 px-1.5 py-0.5 text-[10px] text-[#E4E0D6]/60">
                ↵
              </kbd>{' '}
              to spin
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

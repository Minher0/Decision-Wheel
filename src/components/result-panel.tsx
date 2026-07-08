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
  return (
    <div
      className="border bg-[#14171C]"
      style={{ minHeight: '120px', borderColor: 'rgba(228, 224, 214, 0.25)' }}
    >
      {/* Header bar — status line, bright text */}
      <div
        className="flex items-center justify-between border-b px-4 py-2"
        style={{ borderColor: 'rgba(228, 224, 214, 0.2)' }}
      >
        <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.2em]">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
              backgroundColor: isSpinning ? ORANGE : winner ? ORANGE : '#7A7E86',
              animation: isSpinning ? 'pulse 1s ease-in-out infinite' : undefined,
            }}
          />
          <span style={{ color: isSpinning ? ORANGE : winner ? ORANGE : '#9CA0A8' }}>
            {isSpinning ? 'SPINNING' : winner ? 'RESULT' : 'READY'}
          </span>
        </div>
        {winner && !isSpinning && (
          <button
            onClick={onDismiss}
            className="font-mono text-xs uppercase tracking-[0.2em] transition-colors"
            style={{ color: '#9CA0A8' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = BONE; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA0A8'; }}
            aria-label="Dismiss result"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        {isSpinning ? (
          <div className="flex items-center gap-3">
            <div className="font-mono text-sm" style={{ color: BONE }}>
              <span style={{ color: ORANGE }}>●</span> computing result
              <span className="ml-1 inline-block animate-pulse">_</span>
            </div>
          </div>
        ) : winner ? (
          <div>
            {/* Winner display */}
            <div className="flex items-baseline gap-3">
              {winnerIndex != null && (
                <span className="font-mono text-sm tabular-nums" style={{ color: '#9CA0A8' }}>
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

            {/* Actions — high contrast, all clearly visible */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {/* Primary — orange filled */}
              <button
                onClick={onSpinAgain}
                className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.15em] transition-all"
                style={{
                  backgroundColor: ORANGE,
                  color: '#0A0B0E',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FF7A3D'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ORANGE; }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Spin again
              </button>
              {/* Secondary — bone outlined, bright */}
              <button
                onClick={onRemove}
                className="flex items-center gap-2 border px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.15em] transition-all"
                style={{
                  borderColor: BONE,
                  color: BONE,
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = BONE;
                  e.currentTarget.style.color = '#0A0B0E';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = BONE;
                }}
              >
                <X className="h-3.5 w-3.5" />
                Remove & spin
              </button>
              {/* Tertiary — bone outlined */}
              <button
                onClick={onShare}
                className="flex items-center gap-2 border px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.15em] transition-all"
                style={{
                  borderColor: BONE,
                  color: BONE,
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = BONE;
                  e.currentTarget.style.color = '#0A0B0E';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = BONE;
                }}
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-sm" style={{ color: '#9CA0A8' }}>›</span>
            <p className="font-mono text-sm" style={{ color: BONE }}>
              Click the wheel or press{' '}
              <kbd
                className="px-1.5 py-0.5 text-xs font-semibold"
                style={{ border: '1px solid rgba(228, 224, 214, 0.4)', color: BONE }}
              >
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

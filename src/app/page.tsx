'use client';

import { useCallback, useEffect, useState } from 'react';
import { Share2, Volume2, VolumeX, Shuffle, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { generateId, type Choice } from '@/lib/wheel-types';
import { useSpinPhysics } from '@/hooks/use-spin-physics';
import { useWheelSound } from '@/hooks/use-wheel-sound';
import WheelCanvas from '@/components/wheel-canvas';
import ChoicesList from '@/components/choices-list';
import ResultPanel from '@/components/result-panel';
import ShareDialog from '@/components/share-dialog';

const DEFAULT_CHOICES: Choice[] = [
  { id: generateId(), label: 'Pizza' },
  { id: generateId(), label: 'Sushi' },
  { id: generateId(), label: 'Burger' },
  { id: generateId(), label: 'Tacos' },
  { id: generateId(), label: 'Salad' },
  { id: generateId(), label: 'Ramen' },
];

const STORAGE_KEY = 'decision-wheel:state';

const BONE = '#E4E0D6';
const MUTED = '#5A5E66';
const ORANGE = '#FF5C1F';
const INK = '#0A0B0E';

type PersistedState = { title: string; choices: Choice[] };

function loadFromUrl(): PersistedState | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const w = params.get('w');
  if (!w) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(w));
    if (parsed && Array.isArray(parsed.choices)) {
      return {
        title: String(parsed.title || 'Untitled').slice(0, 120),
        choices: parsed.choices.map((c: any) => ({
          id: c.id || generateId(),
          label: String(c.label || '').slice(0, 100),
        })),
      };
    }
  } catch {
    // ignore
  }
  return null;
}

function loadFromStorage(): PersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.choices)) {
      return {
        title: String(parsed.title || 'Untitled').slice(0, 120),
        choices: parsed.choices,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

function loadInitialState(): PersistedState {
  if (typeof window === 'undefined') return { title: 'Untitled', choices: DEFAULT_CHOICES };
  const fromUrl = loadFromUrl();
  if (fromUrl) return fromUrl;
  const fromStorage = loadFromStorage();
  if (fromStorage) return fromStorage;
  return { title: 'Untitled', choices: DEFAULT_CHOICES };
}

export default function Home() {
  const [initialState] = useState(loadInitialState);
  const [title, setTitle] = useState(initialState.title);
  const [choices, setChoices] = useState<Choice[]>(initialState.choices);
  const [winner, setWinner] = useState<Choice | null>(null);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [urlCleaned, setUrlCleaned] = useState(false);
  const [removedCount, setRemovedCount] = useState(0);

  const { toast } = useToast();
  const sound = useWheelSound();

  const handleTick = useCallback(() => {
    if (!muted) sound.tick(0.8 + Math.random() * 0.4);
  }, [muted, sound]);

  const handleResult = useCallback((result: { winningIndex: number }) => {
    const w = choices[result.winningIndex];
    if (!w) return;
    setWinner(w);
    setWinnerIndex(result.winningIndex);
    if (!muted) sound.win();
  }, [choices, muted, sound]);

  const { rotation, isSpinning, spin } = useSpinPhysics({
    segmentCount: choices.length,
    onTick: handleTick,
    onResult: handleResult,
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, choices }));
    } catch {
      // ignore
    }
  }, [title, choices]);

  // Clean URL after shared state has loaded
  useEffect(() => {
    if (urlCleaned) return;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.has('w')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    setUrlCleaned(true);
  }, [urlCleaned]);

  // Global keyboard: Enter/Space = spin (when not typing in an input)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Enter' || e.key === ' ') {
        if (choices.length >= 2 && !isSpinning) {
          e.preventDefault();
          handleSpin();
        }
      }
      if (e.key === 'r' && winner) {
        handleRemoveWinner();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleSpin = useCallback(() => {
    if (choices.length < 2) {
      toast({
        title: 'Need more choices',
        description: 'At least two.',
        variant: 'destructive',
      });
      return;
    }
    setWinner(null);
    setWinnerIndex(null);
    if (!muted) {
      sound.ensureCtx();
      sound.whoosh();
    }
    spin();
  }, [choices.length, spin, sound, muted, toast]);

  const handleShuffle = useCallback(() => {
    setChoices((prev) => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
    setWinner(null);
    setWinnerIndex(null);
  }, []);

  const handleClear = useCallback(() => {
    setChoices([]);
    setWinner(null);
    setWinnerIndex(null);
    setRemovedCount(0);
  }, []);

  const handleSpinAgain = useCallback(() => {
    setWinner(null);
    setWinnerIndex(null);
    setTimeout(() => handleSpin(), 100);
  }, [handleSpin]);

  const handleRemoveWinner = useCallback(() => {
    if (!winner) return;
    setChoices((prev) => prev.filter((c) => c.id !== winner.id));
    setRemovedCount((c) => c + 1);
    setWinner(null);
    setWinnerIndex(null);
    toast({
      title: `Removed "${winner.label}"`,
      description: 'Wheel updated. Spin again for the next round.',
    });
    // Auto-spin after a brief delay if there are still 2+ options
    setTimeout(() => {
      setChoices((prev) => {
        if (prev.length >= 2) {
          setTimeout(() => spin(), 200);
        }
        return prev;
      });
    }, 300);
  }, [winner, toast, spin]);

  const handleDismissResult = useCallback(() => {
    setWinner(null);
    setWinnerIndex(null);
  }, []);

  const canSpin = choices.length >= 2 && !isSpinning;

  return (
    <div className="relative flex min-h-[100dvh] flex-col" style={{ backgroundColor: INK, color: BONE }}>
      {/* Subtle grid background — HUD feel */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(${BONE} 1px, transparent 1px), linear-gradient(90deg, ${BONE} 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top bar — thin, terminal-style */}
      <header className="relative flex items-center justify-between border-b px-4 py-3 sm:px-6" style={{ borderColor: 'rgba(228, 224, 214, 0.1)' }}>
        <div className="flex items-center gap-3">
          <span className="font-sans text-sm font-extrabold tracking-tight">DECISION.WHEEL</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] sm:inline" style={{ color: MUTED }}>
            v2.0
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Status indicator */}
          <div className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] sm:flex" style={{ color: MUTED }}>
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: isSpinning ? ORANGE : canSpin ? ORANGE : MUTED,
                animation: isSpinning ? 'pulse 1s ease-in-out infinite' : undefined,
              }}
            />
            <span style={{ color: isSpinning ? ORANGE : canSpin ? BONE : MUTED }}>
              {isSpinning ? 'SPINNING' : canSpin ? 'READY' : 'EMPTY'}
            </span>
          </div>
          <button
            onClick={() => setMuted((m) => !m)}
            className="transition-colors hover:text-[#FF5C1F]"
            style={{ color: MUTED }}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="font-mono text-[10px] uppercase tracking-[0.2em] transition-colors hover:text-[#FF5C1F]"
            style={{ color: MUTED }}
          >
            Share
          </button>
        </div>
      </header>

      {/* Main — single screen, no scroll on desktop.
          Mobile: stacks vertically, may scroll slightly. */}
      <main className="relative flex flex-1 flex-col gap-4 p-4 sm:p-6 lg:grid lg:grid-cols-[1fr_380px] lg:gap-6">
        {/* LEFT — wheel + result panel + title */}
        <section className="flex flex-col items-center gap-4 lg:gap-6">
          {/* Title — compact, top of wheel column */}
          <div className="w-full max-w-2xl">
            <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: MUTED }}>
              <span style={{ color: ORANGE }}>+</span>
              TITLE
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              className="border-none border-b bg-transparent p-0 pb-1 font-sans text-lg font-bold tracking-tight shadow-none focus-visible:border-b focus-visible:ring-0 sm:text-xl"
              style={{ borderColor: 'rgba(228, 224, 214, 0.2)', color: BONE }}
            />
          </div>

          {/* The wheel — clickable */}
          <div className="flex flex-1 items-center justify-center">
            <WheelCanvas
              choices={choices}
              rotation={rotation}
              isSpinning={isSpinning}
              canSpin={canSpin}
              winningIndex={winnerIndex}
              onTick={handleTick}
              onSpin={handleSpin}
              size={Math.min(440, typeof window !== 'undefined' ? Math.min(window.innerWidth - 64, window.innerHeight - 320) : 440)}
            />
          </div>

          {/* Result panel — inline, no modal */}
          <div className="w-full max-w-2xl">
            <ResultPanel
              winner={winner}
              winnerIndex={winnerIndex}
              isSpinning={isSpinning}
              onRemove={handleRemoveWinner}
              onSpinAgain={handleSpinAgain}
              onShare={() => setShareOpen(true)}
              onDismiss={handleDismissResult}
            />
          </div>
        </section>

        {/* RIGHT — options list */}
        <aside
          className="flex flex-col border p-4"
          style={{
            borderColor: 'rgba(228, 224, 214, 0.1)',
            backgroundColor: 'rgba(15, 17, 21, 0.6)',
            maxHeight: 'calc(100dvh - 80px)',
          }}
        >
          <ChoicesList choices={choices} onChange={setChoices} removedCount={removedCount} />

          {/* Footer actions — shuffle / clear */}
          <div className="mt-3 flex gap-2 border-t pt-3" style={{ borderColor: 'rgba(228, 224, 214, 0.1)' }}>
            <button
              onClick={handleShuffle}
              disabled={choices.length < 2}
              className="flex flex-1 items-center justify-center gap-2 border py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors disabled:opacity-30"
              style={{
                borderColor: 'rgba(228, 224, 214, 0.2)',
                color: MUTED,
              }}
              onMouseEnter={(e) => { if (choices.length >= 2) { e.currentTarget.style.borderColor = ORANGE; e.currentTarget.style.color = ORANGE; } }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(228, 224, 214, 0.2)'; e.currentTarget.style.color = MUTED; }}
            >
              <Shuffle className="h-3 w-3" />
              Shuffle
            </button>
            <button
              onClick={handleClear}
              disabled={choices.length === 0}
              className="flex flex-1 items-center justify-center gap-2 border py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors disabled:opacity-30"
              style={{
                borderColor: 'rgba(228, 224, 214, 0.2)',
                color: MUTED,
              }}
              onMouseEnter={(e) => { if (choices.length > 0) { e.currentTarget.style.borderColor = ORANGE; e.currentTarget.style.color = ORANGE; } }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(228, 224, 214, 0.2)'; e.currentTarget.style.color = MUTED; }}
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </button>
          </div>
        </aside>
      </main>

      {/* Footer — minimal */}
      <footer className="relative border-t px-4 py-2 sm:px-6" style={{ borderColor: 'rgba(228, 224, 214, 0.1)' }}>
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: MUTED }}>
          <span>
            <kbd className="border px-1 py-0.5 text-[9px]" style={{ borderColor: 'rgba(228, 224, 214, 0.2)' }}>↵</kbd> spin ·{' '}
            <kbd className="border px-1 py-0.5 text-[9px]" style={{ borderColor: 'rgba(228, 224, 214, 0.2)' }}>R</kbd> remove winner ·{' '}
            click wheel to spin
          </span>
          <a
            href="https://github.com/Minher0/Decision-Wheel"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#FF5C1F]"
          >
            src ↗
          </a>
        </div>
      </footer>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={title}
        choices={choices}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

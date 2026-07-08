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
import ResultModal from '@/components/result-modal';
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
  const [resultOpen, setResultOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [urlCleaned, setUrlCleaned] = useState(false);

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
    // Brief pause so the wheel stops visually before the takeover
    setTimeout(() => {
      setResultOpen(true);
      if (!muted) sound.win();
    }, 450);
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

  const handleSpin = useCallback(() => {
    if (choices.length < 2) {
      toast({
        title: 'Need more choices',
        description: 'At least two.',
        variant: 'destructive',
      });
      return;
    }
    // Reset winner highlight
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
  }, []);

  const handleClear = useCallback(() => {
    setChoices([]);
  }, []);

  const handleSpinAgain = useCallback(() => {
    setResultOpen(false);
    setTimeout(() => handleSpin(), 300);
  }, [handleSpin]);

  return (
    <div className="relative min-h-[100dvh] bg-[#F2EEE5] text-[#0A0A0A]">
      {/* Top bar — thin, mono, like a newspaper masthead */}
      <header className="flex items-center justify-between border-b border-[#0A0A0A]/15 px-6 py-4 sm:px-10">
        <div className="flex items-baseline gap-3">
          <span className="font-sans text-sm font-extrabold tracking-tight">
            Decision Wheel
          </span>
          <span className="hidden font-mono text-xs text-[#0A0A0A]/40 sm:inline">
            № 01 — Spin to decide
          </span>
        </div>
        <div className="flex items-center gap-5">
          <button
            onClick={() => setMuted((m) => !m)}
            className="font-mono text-xs uppercase tracking-[0.15em] text-[#0A0A0A]/60 hover:text-[#E63329]"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="font-mono text-xs uppercase tracking-[0.15em] text-[#0A0A0A]/60 hover:text-[#E63329]"
          >
            Share
          </button>
        </div>
      </header>

      {/* Main — asymmetric 12-col grid.
          Left: massive editorial headline + title input + spin CTA.
          Right: the wheel, large, centered in its column.
          Below (full width on mobile): choices list.
      */}
      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-6 py-12 sm:px-10 lg:grid-cols-12 lg:gap-8 lg:py-16">
        {/* LEFT — headline column */}
        <section className="lg:col-span-5 lg:pt-8">
          {/* Editable title — looks like a section header, behaves like an input */}
          <div className="mb-8">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0A]/40">
              Title
            </span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              className="mt-1 border-none border-b border-[#0A0A0A] bg-transparent p-0 pb-2 font-sans text-3xl font-extrabold tracking-tighter shadow-none placeholder:text-[#0A0A0A]/25 focus-visible:border-b focus-visible:border-[#E63329] focus-visible:ring-0 sm:text-4xl"
            />
          </div>

          {/* Massive headline — the editorial statement */}
          <h1 className="font-sans text-6xl font-extrabold leading-[0.92] tracking-tighter sm:text-7xl lg:text-8xl">
            Can't
            <br />
            decide?
            <br />
            <span className="text-[#E63329]">Spin.</span>
          </h1>

          <p className="mt-8 max-w-md font-mono text-sm leading-relaxed text-[#0A0A0A]/60">
            A wheel for indecisive moments. Add your options, give it a spin,
            accept the result. Or spin again — we won't judge.
          </p>

          {/* Spin CTA — massive black bar */}
          <div className="mt-10">
            <button
              onClick={handleSpin}
              disabled={isSpinning || choices.length < 2}
              className="group relative flex w-full items-center justify-between overflow-hidden bg-[#0A0A0A] px-8 py-6 text-[#F2EEE5] transition-colors hover:bg-[#E63329] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-[#0A0A0A]"
            >
              <span className="font-sans text-2xl font-extrabold tracking-tight sm:text-3xl">
                {isSpinning ? 'Spinning…' : 'Spin'}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-60">
                {choices.length < 2
                  ? 'Add 2+'
                  : isSpinning
                  ? 'Wait'
                  : '↵'}
              </span>
            </button>
            <div className="mt-2 flex items-center justify-between font-mono text-xs text-[#0A0A0A]/40">
              <span>{choices.length} options loaded</span>
              <div className="flex gap-4">
                <button
                  onClick={handleShuffle}
                  disabled={choices.length < 2}
                  className="flex items-center gap-1 hover:text-[#E63329] disabled:opacity-30"
                >
                  <Shuffle className="h-3 w-3" />
                  Shuffle
                </button>
                <button
                  onClick={handleClear}
                  disabled={choices.length === 0}
                  className="flex items-center gap-1 hover:text-[#E63329] disabled:opacity-30"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT — the wheel */}
        <section className="flex items-center justify-center lg:col-span-7">
          <WheelCanvas
            choices={choices}
            rotation={rotation}
            isSpinning={isSpinning}
            winningIndex={winnerIndex}
            onTick={handleTick}
            size={560}
          />
        </section>
      </main>

      {/* Choices list — full width below, with a strong top border */}
      <section className="border-t border-[#0A0A0A] bg-[#EDE8DD]">
        <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0A]/40">
                Section 02
              </span>
              <h2 className="mt-2 font-sans text-4xl font-extrabold tracking-tighter sm:text-5xl">
                Your options
              </h2>
              <p className="mt-4 max-w-sm font-mono text-sm text-[#0A0A0A]/60">
                Drag the numbers to reorder. Click any label to rename. The
                wheel treats every choice as equal weight — that's the point.
              </p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <ChoicesList choices={choices} onChange={setChoices} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer — thin line, mono */}
      <footer className="border-t border-[#0A0A0A]/15 px-6 py-6 sm:px-10">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-2 font-mono text-xs text-[#0A0A0A]/40 sm:flex-row sm:items-center">
          <span>Decision Wheel · A tool for indecisive moments</span>
          <span>
            <a
              href="https://github.com/Minher0/Decision-Wheel"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#E63329]"
            >
              Source ↗
            </a>
          </span>
        </div>
      </footer>

      <ResultModal
        open={resultOpen}
        winner={winner}
        winnerIndex={winnerIndex}
        onClose={() => setResultOpen(false)}
        onSpinAgain={handleSpinAgain}
        onShare={() => {
          setResultOpen(false);
          setShareOpen(true);
        }}
      />

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={title}
        choices={choices}
      />
    </div>
  );
}

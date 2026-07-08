'use client';

import { useCallback, useEffect, useState } from 'react';
import { Share2, Shuffle, Trash2, Volume2, VolumeX, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { generateId, randomColor, type Choice } from '@/lib/wheel-types';
import { useSpinPhysics } from '@/hooks/use-spin-physics';
import { useWheelSound } from '@/hooks/use-wheel-sound';
import WheelCanvas from '@/components/wheel-canvas';
import ChoicesList from '@/components/choices-list';
import ResultModal from '@/components/result-modal';
import ShareDialog from '@/components/share-dialog';

const DEFAULT_CHOICES: Choice[] = [
  { id: generateId(), label: 'Pizza', color: '#FF006E', weight: 1 },
  { id: generateId(), label: 'Sushi', color: '#FB5607', weight: 1 },
  { id: generateId(), label: 'Burger', color: '#FFBE0B', weight: 1 },
  { id: generateId(), label: 'Tacos', color: '#8338EC', weight: 1 },
  { id: generateId(), label: 'Salad', color: '#06FFA5', weight: 1 },
  { id: generateId(), label: 'Ramen', color: '#4CC9F0', weight: 1 },
];

const STORAGE_KEY = 'decision-wheel:state';

type PersistedState = {
  title: string;
  choices: Choice[];
};

function loadFromUrl(): PersistedState | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const w = params.get('w');
  if (!w) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(w));
    if (parsed && Array.isArray(parsed.choices)) {
      return {
        title: String(parsed.title || 'Decision Wheel').slice(0, 120),
        choices: parsed.choices.map((c: any) => ({
          id: c.id || generateId(),
          label: String(c.label || '').slice(0, 100),
          color: String(c.color || randomColor(0)).slice(0, 20),
          weight: Math.max(1, Math.min(100, Number(c.weight) || 1)),
        })),
      };
    }
  } catch {
    // ignore malformed URL state
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
        title: String(parsed.title || 'Decision Wheel').slice(0, 120),
        choices: parsed.choices,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

function loadInitialState(): { title: string; choices: Choice[] } {
  // On SSR, returns defaults. On client, checks URL then storage.
  if (typeof window === 'undefined') {
    return { title: 'Decision Wheel', choices: DEFAULT_CHOICES };
  }
  const fromUrl = loadFromUrl();
  if (fromUrl) return fromUrl;
  const fromStorage = loadFromStorage();
  if (fromStorage) return fromStorage;
  return { title: 'Decision Wheel', choices: DEFAULT_CHOICES };
}

export default function Home() {
  const [initialState] = useState(loadInitialState);
  const [title, setTitle] = useState(initialState.title);
  const [choices, setChoices] = useState<Choice[]>(initialState.choices);
  const [winner, setWinner] = useState<Choice | null>(null);
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
    setTimeout(() => {
      setResultOpen(true);
      if (!muted) sound.win();
    }, 350);
  }, [choices, muted, sound]);

  const { rotation, isSpinning, spin } = useSpinPhysics({
    segmentCount: choices.length,
    onTick: handleTick,
    onResult: handleResult,
  });

  // Persist to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, choices }));
    } catch {
      // ignore quota errors
    }
  }, [title, choices]);

  // Clean the URL after the shared state has been applied (one-time, post-mount).
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
        title: 'Add more choices',
        description: 'You need at least 2 choices to spin.',
        variant: 'destructive',
      });
      return;
    }
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
    toast({ title: 'Choices shuffled' });
  }, [toast]);

  const handleClear = useCallback(() => {
    setChoices([]);
    toast({ title: 'All choices cleared' });
  }, [toast]);

  const handleSpinAgain = useCallback(() => {
    setResultOpen(false);
    setTimeout(() => handleSpin(), 350);
  }, [handleSpin]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0418] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-fuchsia-600/30 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-700/30 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <header className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-amber-400 to-rose-500 text-xl font-black text-black shadow-lg">
            D
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Decision Wheel
            </h1>
            <p className="text-xs text-white/50">
              Spin. Decide. Share.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMuted((m) => !m)}
            className="text-white/60 hover:bg-white/10 hover:text-white"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button
            onClick={() => setShareOpen(true)}
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 sm:px-8 lg:grid-cols-[1fr_420px]">
        {/* Wheel section */}
        <section className="flex flex-col items-center gap-6">
          <div className="w-full max-w-md">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Wheel title"
              className="border-transparent bg-transparent text-center text-2xl font-bold tracking-tight text-white placeholder:text-white/30 focus-visible:border-white/20 focus-visible:ring-0"
            />
          </div>

          <div className="relative flex items-center justify-center">
            <WheelCanvas
              choices={choices}
              rotation={rotation}
              isSpinning={isSpinning}
              onTick={handleTick}
              size={520}
            />
          </div>

          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={handleSpin}
              disabled={isSpinning || choices.length < 2}
              className="group relative h-16 w-64 overflow-hidden rounded-full text-lg font-black uppercase tracking-widest text-black shadow-2xl transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-amber-300 via-fuchsia-400 to-amber-300 bg-[length:200%_100%] transition-all duration-500 group-hover:bg-[position:100%_0]" />
              <span className="relative flex items-center gap-2">
                {isSpinning ? (
                  <>Spinning…</>
                ) : (
                  <>
                    <Play className="h-5 w-5 fill-black" />
                    Spin
                  </>
                )}
              </span>
            </Button>
            <p className="text-xs text-white/40">
              {choices.length < 2
                ? 'Add at least 2 choices to enable spinning'
                : `${choices.length} choices loaded · Good luck!`}
            </p>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
          <ChoicesList choices={choices} onChange={setChoices} />

          <div className="flex gap-2 border-t border-white/10 pt-4">
            <Button
              onClick={handleShuffle}
              variant="outline"
              className="flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10"
              disabled={choices.length < 2}
            >
              <Shuffle className="mr-2 h-4 w-4" />
              Shuffle
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              className="border-white/20 bg-white/5 text-rose-300 hover:bg-rose-500/10"
              disabled={choices.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </aside>
      </main>

      <footer className="mt-auto border-t border-white/5 px-4 py-6 text-center text-xs text-white/30 sm:px-8">
        <p>
          Built with Next.js · Canvas + Web Audio ·{' '}
          <a
            href="https://github.com/Minher0/Decision-Wheel"
            target="_blank"
            rel="noreferrer"
            className="text-white/50 underline-offset-4 hover:text-white/80 hover:underline"
          >
            View source
          </a>
        </p>
      </footer>

      <ResultModal
        open={resultOpen}
        winner={winner}
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

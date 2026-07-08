'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Choice } from '@/lib/wheel-types';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  choices: Choice[];
};

const ORANGE = '#FF5C1F';
const BONE = '#E4E0D6';
const INK = '#0A0B0E';
const MUTED = '#5A5E66';

export default function ShareDialog({ open, onClose, title, choices }: Props) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const encodedState = encodeURIComponent(JSON.stringify({ title, choices }));
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${baseUrl}/?w=${encodedState}`;

  async function copy() {
    if (choices.length < 2) {
      toast({
        title: 'Need more choices',
        description: 'Add at least 2 choices before sharing.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast({ title: 'Copied' });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  }

  async function nativeShare() {
    if (choices.length < 2) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: title || 'Decision Wheel',
          url: shareUrl,
        });
      } catch {
        // cancelled
      }
    } else {
      copy();
    }
  }

  if (!open) return null;

  const tooLong = shareUrl.length > 8000;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(10, 11, 14, 0.92)' }}
    >
      <button
        onClick={onClose}
        className="absolute right-6 top-6 font-mono text-xs uppercase tracking-[0.2em] hover:text-[#FF5C1F]"
        style={{ color: MUTED }}
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="absolute left-6 top-6 font-mono text-xs uppercase tracking-[0.2em]" style={{ color: MUTED }}>
        Share
      </div>

      <div className="w-full max-w-2xl">
        {/* Corner brackets — HUD style */}
        <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: ORANGE }}>
          <span>+</span>
          <span>LINK.GENERATOR</span>
        </div>
        <h2 className="mb-2 font-sans text-4xl font-extrabold tracking-tighter sm:text-5xl" style={{ color: BONE }}>
          Anyone with this link
        </h2>
        <p className="mb-8 max-w-md font-mono text-sm" style={{ color: MUTED }}>
          gets the exact same wheel — title, choices, order. No database, no
          expiration. The whole thing lives in the URL.
        </p>

        <div className="mb-3 flex items-center gap-2 border-b pb-2" style={{ borderColor: BONE }}>
          <Input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="border-none bg-transparent p-0 font-mono text-xs shadow-none focus-visible:ring-0"
            style={{ color: BONE }}
          />
          <button
            onClick={copy}
            className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider hover:underline"
            style={{ color: ORANGE }}
          >
            {copied ? <Check className="h-3 w-3" /> : null}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="mb-8 flex items-center justify-between font-mono text-xs" style={{ color: MUTED }}>
          <span>{shareUrl.length.toLocaleString()} characters</span>
          {tooLong && <span style={{ color: ORANGE }}>long — some apps may truncate</span>}
        </div>

        <button
          onClick={nativeShare}
          className="w-full py-4 font-mono text-xs uppercase tracking-[0.25em] transition-colors"
          style={{
            backgroundColor: INK,
            color: BONE,
            border: `1px solid ${BONE}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = ORANGE;
            e.currentTarget.style.color = INK;
            e.currentTarget.style.borderColor = ORANGE;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = INK;
            e.currentTarget.style.color = BONE;
            e.currentTarget.style.borderColor = BONE;
          }}
        >
          {typeof navigator !== 'undefined' && navigator.share ? 'Share via…' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}

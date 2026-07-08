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

export default function ShareDialog({ open, onClose, title, choices }: Props) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // URL-encoded instant share — all state lives in the URL, no DB
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F2EEE5] p-6">
      <button
        onClick={onClose}
        className="absolute right-6 top-6 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0A]/50 hover:text-[#E63329]"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="absolute left-6 top-6 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0A]/50">
        Share
      </div>

      <div className="w-full max-w-2xl">
        <h2 className="mb-2 font-sans text-4xl font-extrabold tracking-tighter text-[#0A0A0A] sm:text-5xl">
          Anyone with this link
        </h2>
        <p className="mb-10 max-w-md font-mono text-sm text-[#0A0A0A]/60">
          gets the exact same wheel — title, choices, order. No database, no
          expiration. The whole thing lives in the URL.
        </p>

        <div className="mb-3 flex items-center gap-2 border-b border-[#0A0A0A] pb-2">
          <Input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="border-none bg-transparent p-0 font-mono text-xs shadow-none focus-visible:ring-0"
          />
          <button
            onClick={copy}
            className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-[#E63329] hover:underline"
          >
            {copied ? <Check className="h-3 w-3" /> : null}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="mb-10 flex items-center justify-between font-mono text-xs text-[#0A0A0A]/40">
          <span>{shareUrl.length.toLocaleString()} characters</span>
          {tooLong && <span className="text-[#E63329]">long — some apps may truncate</span>}
        </div>

        <button
          onClick={nativeShare}
          className="w-full bg-[#0A0A0A] py-4 font-mono text-xs uppercase tracking-[0.25em] text-[#F2EEE5] transition-colors hover:bg-[#E63329]"
        >
          {typeof navigator !== 'undefined' && navigator.share ? 'Share via…' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}

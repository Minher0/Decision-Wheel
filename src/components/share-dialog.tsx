'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Link2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  const encodedState = encodeURIComponent(
    JSON.stringify({ title, choices })
  );
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
      toast({ title: 'Copied to clipboard!' });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  }

  async function nativeShare() {
    if (choices.length < 2) {
      toast({
        title: 'Need more choices',
        description: 'Add at least 2 choices before sharing.',
        variant: 'destructive',
      });
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: title || 'Decision Wheel',
          text: `Spin my Decision Wheel: ${choices.map((c) => c.label).join(', ')}`,
          url: shareUrl,
        });
      } catch {
        // user cancelled — silent
      }
    } else {
      copy();
    }
  }

  const handleClose = (next: boolean) => {
    if (!next) {
      setCopied(false);
      onClose();
    }
  };

  const tooLong = shareUrl.length > 8000;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-0 bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-amber-300" />
            Share this wheel
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Your entire wheel — title and all choices — is encoded directly in the
            URL. No account, no database, no expiration. Anyone with the link can
            spin the same wheel.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase tracking-widest text-white/50">
              Share link
            </Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="border-white/20 bg-black/40 font-mono text-xs text-white"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                onClick={copy}
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {tooLong && (
              <p className="text-xs text-amber-300/80">
                This URL is quite long ({shareUrl.length.toLocaleString()} characters).
                Some chat apps may truncate it. Consider removing a few choices if
                sharing fails.
              </p>
            )}
            <p className="text-xs text-white/40">
              {shareUrl.length.toLocaleString()} characters · works offline · no storage
            </p>
          </div>

          <Button
            onClick={nativeShare}
            className="bg-gradient-to-r from-fuchsia-500 to-amber-400 text-black hover:from-fuchsia-400 hover:to-amber-300"
          >
            <Link2 className="mr-2 h-4 w-4" />
            {typeof navigator !== 'undefined' && navigator.share
              ? 'Share via…'
              : 'Copy link'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

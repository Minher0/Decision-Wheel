# Decision Wheel

An immersive, stylish decision wheel. Add your choices, spin the wheel, and let fate decide. Share wheels with anyone via a single link — no database, no account, no expiration.

## Features

- **Canvas-based wheel** with physics-based spinning (ease-out cubic, 5-7s deceleration)
- **Web Audio API** for tick sounds during spin and a celebratory chord on win
- **Confetti celebration** when the wheel stops
- **Drag-and-drop reordering** of choices
- **Color picker** per choice (click the colored dot)
- **Inline label editing** (click any choice label)
- **Shareable URLs** — your entire wheel (title + choices + colors) is encoded in the URL
- **Native share sheet** on mobile (`navigator.share`)
- **localStorage persistence** — your wheel is saved between visits
- **Mute toggle** for sound effects
- **Shuffle / Clear** buttons for quick edits
- **Fully responsive** (mobile-first, tested on iPhone 14 viewport)
- **Dark premium theme** with glassmorphism, gradients, and glows

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript 5**
- **Tailwind CSS 4** with **shadcn/ui** components
- **canvas-confetti** for the celebration effect
- **@dnd-kit** for drag-and-drop reordering
- **Web Audio API** for sound effects (no audio files needed)

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Main page (wheel + choices sidebar)
│   ├── layout.tsx            # Root layout with metadata
│   ├── globals.css           # Tailwind globals
│   └── api/
│       └── route.ts          # Health check endpoint
├── components/
│   ├── wheel-canvas.tsx      # Canvas-based wheel renderer
│   ├── choices-list.tsx      # Drag-and-drop choice list
│   ├── result-modal.tsx      # Winner modal with confetti
│   ├── share-dialog.tsx      # Share dialog with URL copy
│   └── ui/                   # shadcn/ui components
├── hooks/
│   ├── use-spin-physics.ts   # Physics-based spin animation
│   ├── use-wheel-sound.ts    # Web Audio sound generator
│   ├── use-toast.ts          # Toast notifications
│   └── use-mobile.ts         # Mobile detection
└── lib/
    ├── wheel-types.ts        # Shared types & color palette
    └── utils.ts              # shadcn utility helpers
```

## How sharing works

There is **no database**. Sharing is done entirely via URL encoding:

1. User clicks **Share**
2. The wheel's title and choices are JSON-serialized and URL-encoded
3. The resulting URL looks like `https://your-app.com/?w=<encoded-state>`
4. Anyone opening that URL gets the exact same wheel, ready to spin
5. After loading, the URL is cleaned (the `?w=` param is removed) so the user sees a clean address bar

This means:
- No backend storage cost
- No privacy concerns (the data is in the URL, not on a server)
- Links work forever (no expiration)
- Works offline (once the page is loaded)

## Development

```bash
bun install
bun run dev      # starts Next.js on port 3000
bun run lint     # ESLint check
```

## Deployment

The app is designed for **Vercel** but works on any Next.js host. No environment variables are required.

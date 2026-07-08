export type Choice = {
  id: string;
  label: string;
  // Kept for backwards-compat with shared URLs, but the wheel no longer uses
  // per-choice colors. The wheel uses a disciplined ink/bone palette with one
  // signal-red accent for the winner.
  color?: string;
  weight?: number;
};

export type Wheel = {
  id: string;
  title: string;
  choices: Choice[];
  createdAt: string;
  spins: number;
};

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

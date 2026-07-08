export type Choice = {
  id: string;
  label: string;
  color: string;
  weight: number;
};

export type Wheel = {
  id: string;
  title: string;
  choices: Choice[];
  createdAt: string;
  spins: number;
};

// Vibrant, premium palette for wheel segments
export const WHEEL_COLORS = [
  "#FF006E", // hot pink
  "#FB5607", // orange
  "#FFBE0B", // amber
  "#8338EC", // purple
  "#3A86FF", // blue (used sparingly for contrast)
  "#06FFA5", // mint green
  "#FF4081", // pink
  "#9D4EDD", // violet
  "#F72585", // magenta
  "#4CC9F0", // cyan
  "#F77F00", // tangerine
  "#B5179E", // dark magenta
];

export function randomColor(index: number): string {
  return WHEEL_COLORS[index % WHEEL_COLORS.length];
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

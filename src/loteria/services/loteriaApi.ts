import type { DrawResult, GameConfig } from '../types';

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/jonatangoncalves3Aj/loteria-analisador/main/data';

export async function fetchLastNDraws(game: GameConfig, n = 200): Promise<DrawResult[]> {
  const url = `${GITHUB_RAW_BASE}/${game.id}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const all: DrawResult[] = await res.json();
    return all.slice(0, n);
  } catch {
    return [];
  }
}

export async function fetchLatestDraw(game: GameConfig): Promise<DrawResult | null> {
  const draws = await fetchLastNDraws(game, 1);
  return draws[0] ?? null;
}

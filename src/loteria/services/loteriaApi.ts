import type { DrawResult, GameConfig } from '../types';

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/jonatangoncalves3Aj/loteria-analisador/main/data';

export async function fetchLastNDraws(game: GameConfig, n = 200): Promise<DrawResult[]> {
  const url = `${GITHUB_RAW_BASE}/${game.id}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw: DrawResult[] = await res.json();

    // Dupla Sena stores 2 draws of 6 per contest (12 numbers total).
    // Split each record into two DrawResult entries so stats stay correct.
    let all: DrawResult[];
    if (game.id === 'duplasena') {
      all = raw.flatMap((d) => {
        const pick = game.pickCount; // 6
        if (d.numbers.length <= pick) return [d];
        return [
          { ...d, numbers: d.numbers.slice(0, pick) },
          { ...d, numbers: d.numbers.slice(pick, pick * 2) },
        ];
      });
    } else {
      all = raw;
    }

    return all.slice(0, n);
  } catch {
    return [];
  }
}

export async function fetchLatestDraw(game: GameConfig): Promise<DrawResult | null> {
  const draws = await fetchLastNDraws(game, 1);
  return draws[0] ?? null;
}

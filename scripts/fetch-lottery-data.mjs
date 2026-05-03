// Busca os últimos N concursos de cada jogo da Caixa e salva em data/
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

const GAMES = [
  { id: 'megasena',   slug: 'megasena',   minNum: 1,  maxNum: 60,  pick: 6,  isSuperSete: false },
  { id: 'lotofacil',  slug: 'lotofacil',  minNum: 1,  maxNum: 25,  pick: 15, isSuperSete: false },
  { id: 'quina',      slug: 'quina',      minNum: 1,  maxNum: 80,  pick: 5,  isSuperSete: false },
  { id: 'lotomania',  slug: 'lotomania',  minNum: 1,  maxNum: 100, pick: 50, isSuperSete: false },
  { id: 'duplasena',  slug: 'duplasena',  minNum: 1,  maxNum: 50,  pick: 6,  isSuperSete: false },
  { id: 'diadesorte', slug: 'diadesorte', minNum: 1,  maxNum: 31,  pick: 7,  isSuperSete: false },
  { id: 'supersete',  slug: 'supersete',  minNum: 0,  maxNum: 9,   pick: 7,  isSuperSete: true  },
];

const HISTORY_SIZE = 500;
const DELAY_MS = 300; // intervalo entre requisições para não sobrecarregar a API
const BASE_URL = 'https://servicebus2.caixa.gov.br/portaldeloterias/api';

const HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'pt-BR,pt;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Referer': 'https://loterias.caixa.gov.br/',
  'Origin': 'https://loterias.caixa.gov.br',
};

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function parseNumbers(data, isSuperSete) {
  if (isSuperSete) {
    if (!data.colunas) return [];
    return data.colunas.flatMap(col => col.dezenas.map(n => parseInt(n, 10)));
  }
  const src =
    data.dezenasSorteadasOrdemSorteio ??
    data.dezenas ??
    data.listaDezenas ??
    data.dezenasSorteadasPrimeiroPremio ??
    [];
  return src.map(n => parseInt(n, 10)).filter(n => !isNaN(n));
}

async function fetchDraw(slug, contest, isSuperSete) {
  const url = `${BASE_URL}/${slug}/${contest ?? ''}`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    const data = await res.json();
    const numbers = parseNumbers(data, isSuperSete);
    if (numbers.length === 0) return null;
    return { contest: data.numero, date: data.dataApuracao, numbers };
  } catch {
    return null;
  }
}

async function fetchGame(game) {
  console.log(`\n🎲 Buscando ${game.id}...`);

  const latest = await fetchDraw(game.slug, undefined, game.isSuperSete);
  if (!latest) {
    console.log(`  ❌ Não foi possível buscar o último concurso de ${game.id}`);
    return [];
  }
  console.log(`  ✓ Último concurso: ${latest.contest} (${latest.date})`);

  const startContest = Math.max(1, latest.contest - HISTORY_SIZE + 1);
  const results = [latest];
  let ok = 0, fail = 0;

  for (let c = startContest; c < latest.contest; c++) {
    await sleep(DELAY_MS);
    const draw = await fetchDraw(game.slug, c, game.isSuperSete);
    if (draw) { results.push(draw); ok++; }
    else fail++;
    if ((ok + fail) % 50 === 0) {
      process.stdout.write(`  ... ${ok + fail}/${latest.contest - startContest} concursos\r`);
    }
  }

  console.log(`  ✓ ${results.length} concursos obtidos (${fail} falhas)`);
  return results.sort((a, b) => b.contest - a.contest);
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  for (const game of GAMES) {
    const draws = await fetchGame(game);
    if (draws.length > 0) {
      const path = join(DATA_DIR, `${game.id}.json`);
      writeFileSync(path, JSON.stringify(draws, null, 0));
      console.log(`  💾 Salvo em data/${game.id}.json`);
    }
  }

  console.log('\n✅ Todos os jogos processados!');
}

main().catch(console.error);

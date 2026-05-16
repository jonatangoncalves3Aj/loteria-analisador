import type { ParsedCurriculum } from '../components/ResumeUpload';

// ── Regex patterns ──────────────────────────────────────────────────────────

const RE_EMAIL = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
const RE_PHONE = /(?:\+55\s?)?(?:\(?\d{2}\)?\s?)(?:9\s?)?\d{4}[\s\-]?\d{4}/;
const RE_LINKEDIN = /(?:linkedin\.com\/in\/|linkedin:\s*)([a-zA-Z0-9\-_]+)/i;
const RE_CREA = /CREA[\s\-]?(?:[A-Z]{2}[\s\-]?)?\d{4,8}[\s\-]?[A-Z]?/i;
const RE_DATE_RANGE = /(\d{2}\/\d{4}|\d{4})\s*(?:[-–—a]|até|to)\s*(\d{2}\/\d{4}|\d{4}|atual|presente|current|atualmente)/i;
const RE_DATE_SINGLE = /\b(\d{2}\/\d{4})\b/;

const ESTADOS: Record<string, string> = {
  'acre': 'AC', 'alagoas': 'AL', 'amapá': 'AP', 'amazonas': 'AM',
  'bahia': 'BA', 'ceará': 'CE', 'distrito federal': 'DF', 'espírito santo': 'ES',
  'goiás': 'GO', 'maranhão': 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS',
  'minas gerais': 'MG', 'pará': 'PA', 'paraíba': 'PB', 'paraná': 'PR',
  'pernambuco': 'PE', 'piauí': 'PI', 'rio de janeiro': 'RJ', 'rio grande do norte': 'RN',
  'rio grande do sul': 'RS', 'rondônia': 'RO', 'roraima': 'RR', 'santa catarina': 'SC',
  'são paulo': 'SP', 'sergipe': 'SE', 'tocantins': 'TO',
  'ac': 'AC', 'al': 'AL', 'ap': 'AP', 'am': 'AM', 'ba': 'BA', 'ce': 'CE',
  'df': 'DF', 'es': 'ES', 'go': 'GO', 'ma': 'MA', 'mt': 'MT', 'ms': 'MS',
  'mg': 'MG', 'pa': 'PA', 'pb': 'PB', 'pr': 'PR', 'pe': 'PE', 'pi': 'PI',
  'rj': 'RJ', 'rn': 'RN', 'rs': 'RS', 'ro': 'RO', 'rr': 'RR', 'sc': 'SC',
  'sp': 'SP', 'se': 'SE', 'to': 'TO',
};

const NIVEL_MAP: [RegExp, string][] = [
  [/doutorado|phd/i, 'Doutorado'],
  [/mestrado|master/i, 'Mestrado'],
  [/mba/i, 'MBA'],
  [/especializa/i, 'Especialização'],
  [/técnico|tecnico/i, 'Técnico'],
  [/graduaç|bacharel|licenciatura|engenharia|arquitetura/i, 'Graduação'],
];

const SKILLS_CIVIL = [
  'AutoCAD', 'Revit', 'SketchUp', 'ArchiCAD', 'BIM', 'Tekla', 'SCCP',
  'SAP2000', 'ETABS', 'Robot', 'CYPECAD', 'TQS', 'Eberick',
  'MS Project', 'Primavera', 'Primavera P6', 'Excel', 'PowerPoint', 'Word',
  'AutoDesk', 'Navisworks', 'Infraworks', 'Civil 3D', 'Plant 3D',
  'QGIS', 'ArcGIS', 'MapInfo',
  'NBR 6118', 'NBR 6120', 'NBR 6122', 'ABNT', 'NR-18', 'NR-35',
  'Gestão de Obras', 'Planejamento de Obras', 'Orçamento', 'Cronograma',
  'Topografia', 'Geotecnia', 'Fundações', 'Estruturas', 'Hidráulica',
  'Saneamento', 'Pavimentação', 'Georreferenciamento',
  'Fiscalização', 'Qualidade', 'PBQP-H', 'ISO 9001', 'SSMA',
  'Python', 'VBA', 'SQL', 'Power BI', 'AutoLISP',
  'Scrum', 'Agile', 'PMBOK', 'PMI', 'PMP',
  'Inglês', 'Espanhol',
];

// ── Section detection ────────────────────────────────────────────────────────

const SECTION_EXP = /^(experi[eê]ncia|hist[oó]rico profissional|atua[cç][aã]o profissional|experi[eê]ncias|trabalho|carreira)/i;
const SECTION_EDU = /^(forma[cç][aã]o|educa[cç][aã]o|gradua[cç][aã]o|acad[eê]mico|instru[cç][aã]o|cursos e forma)/i;
const SECTION_SKILL = /^(habilidades|compet[eê]ncias|conhecimentos|tecnologias|ferramentas|software|aptid[oõ]es|qualifica)/i;
const SECTION_ABOUT = /^(sobre|resumo|perfil|objetivo|apresenta[cç][aã]o|summary|profile)/i;

function splitSections(lines: string[]): Record<string, string[]> {
  const sections: Record<string, string[]> = { header: [], about: [], experience: [], education: [], skills: [], other: [] };
  let current = 'header';
  let headerDone = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (SECTION_EXP.test(trimmed)) { current = 'experience'; headerDone = true; continue; }
    if (SECTION_EDU.test(trimmed)) { current = 'education'; headerDone = true; continue; }
    if (SECTION_SKILL.test(trimmed)) { current = 'skills'; headerDone = true; continue; }
    if (SECTION_ABOUT.test(trimmed)) { current = 'about'; headerDone = true; continue; }
    if (headerDone && trimmed.length < 40 && trimmed === trimmed.toUpperCase() && /[A-ZÁÉÍÓÚ]/.test(trimmed)) {
      current = 'other'; continue;
    }

    sections[current].push(trimmed);
  }
  return sections;
}

// ── Field extractors ─────────────────────────────────────────────────────────

function extractEmail(text: string): string {
  return text.match(RE_EMAIL)?.[0] ?? '';
}

function extractPhone(text: string): string {
  const m = text.match(RE_PHONE);
  return m ? m[0].trim() : '';
}

function extractLinkedIn(text: string): string {
  const m = text.match(RE_LINKEDIN);
  if (!m) return '';
  return `linkedin.com/in/${m[1]}`;
}

function extractCREA(text: string): string {
  return text.match(RE_CREA)?.[0]?.trim() ?? '';
}

function extractCityState(text: string): { cidade: string; estado: string } {
  // Pattern: "São Paulo, SP" or "Rio de Janeiro - RJ" or "São Paulo/SP"
  const cityStateRe = /([A-ZÁÉÍÓÚÂÊÔÃÕÀÜ][a-záéíóúâêôãõàü]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÀÜ][a-záéíóúâêôãõàü]+)*)\s*[,\-\/]\s*([A-Z]{2})\b/;
  const m = text.match(cityStateRe);
  if (m) {
    const estado = ESTADOS[m[2].toLowerCase()];
    if (estado) return { cidade: m[1].trim(), estado };
  }
  // Try state name
  for (const [name, code] of Object.entries(ESTADOS)) {
    if (name.length > 2 && text.toLowerCase().includes(name)) {
      return { cidade: '', estado: code };
    }
  }
  return { cidade: '', estado: '' };
}

function extractName(headerLines: string[]): string {
  for (const line of headerLines.slice(0, 6)) {
    const t = line.trim();
    if (!t || t.length > 60 || t.length < 4) continue;
    if (RE_EMAIL.test(t) || RE_PHONE.test(t)) continue;
    if (/^(tel|fone|cel|e-?mail|linkedin|crea|www|http)/i.test(t)) continue;
    if (/\d{4}/.test(t)) continue;
    // Likely a name: has 2+ words, mostly letters
    const words = t.split(/\s+/);
    if (words.length >= 2 && words.every(w => /^[A-ZÁÉÍÓÚÂÊÔÃÕÀÜ]/.test(w))) {
      return t;
    }
  }
  return '';
}

function extractSummary(aboutLines: string[]): string {
  return aboutLines.filter(l => l.length > 30).slice(0, 3).join(' ');
}

function extractSkills(text: string, skillLines: string[]): string[] {
  const found = new Set<string>();
  const fullText = text + '\n' + skillLines.join('\n');

  for (const skill of SKILLS_CIVIL) {
    const re = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(fullText)) found.add(skill);
  }

  // Also grab comma/bullet separated items from skills section
  for (const line of skillLines) {
    const items = line.split(/[,;•·\|\-–]/);
    for (const item of items) {
      const t = item.trim();
      if (t.length >= 3 && t.length <= 40 && !/^\d+$/.test(t)) {
        found.add(t);
      }
    }
  }

  return [...found].slice(0, 30);
}

// ── Experience parser ────────────────────────────────────────────────────────

function parseExperiences(lines: string[]): ParsedCurriculum['experiencias'] {
  const results: NonNullable<ParsedCurriculum['experiencias']> = [];
  let current: NonNullable<ParsedCurriculum['experiencias']>[0] | null = null;
  const descLines: string[] = [];

  const flush = () => {
    if (current) {
      current.descricao = descLines.join(' ').trim().slice(0, 300);
      results.push(current);
      descLines.length = 0;
    }
  };

  for (const line of lines) {
    const dateMatch = line.match(RE_DATE_RANGE);
    if (dateMatch) {
      flush();
      const inicio = dateMatch[1].includes('/') ? dateMatch[1] : `01/${dateMatch[1]}`;
      const fimRaw = dateMatch[2];
      const atual = /atual|presente|current|atualmente/i.test(fimRaw);
      const fim = atual ? '' : (fimRaw.includes('/') ? fimRaw : `12/${fimRaw}`);
      current = { empresa: '', cargo: '', inicio, fim, atual, descricao: '' };
      // The same line might have company or title
      const cleaned = line.replace(RE_DATE_RANGE, '').trim();
      if (cleaned.length > 2) current.empresa = cleaned.slice(0, 80);
      continue;
    }

    if (!current) continue;

    if (!current.empresa && line.length > 2 && line.length < 80) {
      current.empresa = line.trim();
    } else if (!current.cargo && line.length > 2 && line.length < 80) {
      current.cargo = line.trim();
    } else {
      descLines.push(line);
    }
  }
  flush();

  return results.filter(e => e.empresa || e.cargo);
}

// ── Education parser ─────────────────────────────────────────────────────────

function parseFormacoes(lines: string[]): ParsedCurriculum['formacoes'] {
  const results: NonNullable<ParsedCurriculum['formacoes']> = [];
  let current: NonNullable<ParsedCurriculum['formacoes']>[0] | null = null;

  const flush = () => { if (current) { results.push(current); current = null; } };

  for (const line of lines) {
    const dateMatch = line.match(RE_DATE_RANGE) || line.match(RE_DATE_SINGLE);
    const nivel = detectNivel(line);

    if (nivel || dateMatch) {
      if (nivel && (!current || current.nivel !== nivel)) {
        flush();
        const inicio = dateMatch ? (dateMatch[1]?.includes('/') ? dateMatch[1] : `01/${dateMatch[1]}`) : '';
        const fimRaw = dateMatch ? (dateMatch[2] ?? '') : '';
        const fim = fimRaw.includes('/') ? fimRaw : (fimRaw ? `12/${fimRaw}` : '');
        current = { instituicao: '', curso: '', nivel, inicio, fim, concluido: !!fim };
        const cleaned = line.replace(RE_DATE_RANGE, '').replace(nivel, '').trim();
        if (cleaned.length > 2) current.curso = cleaned.slice(0, 100);
      } else if (current && dateMatch) {
        current.inicio = current.inicio || (dateMatch[1]?.includes('/') ? dateMatch[1] : `01/${dateMatch[1]}`);
        current.fim = current.fim || (dateMatch[2]?.includes('/') ? dateMatch[2] : '');
      }
      continue;
    }

    if (!current) continue;
    if (!current.curso && line.length > 3) current.curso = line.trim().slice(0, 100);
    else if (!current.instituicao && line.length > 3) current.instituicao = line.trim().slice(0, 100);
  }
  flush();

  return results.filter(f => f.curso || f.instituicao);
}

function detectNivel(text: string): string {
  for (const [re, nivel] of NIVEL_MAP) {
    if (re.test(text)) return nivel;
  }
  return '';
}

// ── Main parser ──────────────────────────────────────────────────────────────

export function parseResumeLocally(text: string): ParsedCurriculum {
  const lines = text.split(/\r?\n/);
  const sections = splitSections(lines);

  const email = extractEmail(text);
  const telefone = extractPhone(text);
  const linkedin = extractLinkedIn(text);
  const crea = extractCREA(text);
  const { cidade, estado } = extractCityState(text);
  const nome = extractName(sections.header);
  const resumo = extractSummary(sections.about.length ? sections.about : sections.header.slice(3));
  const habilidades = extractSkills(text, sections.skills);
  const experiencias = parseExperiences(sections.experience);
  const formacoes = parseFormacoes(sections.education);

  return { nome, email, telefone, cidade, estado, linkedin, crea, resumo, habilidades, experiencias, formacoes };
}

// ── Certificate parser ───────────────────────────────────────────────────────

export function parseCertificateLocally(text: string): { habilidades: string[] } {
  const found = new Set<string>();
  for (const skill of SKILLS_CIVIL) {
    const re = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(text)) found.add(skill);
  }
  // grab first line as potential course name
  const firstLine = text.split(/\r?\n/).find(l => l.trim().length > 5)?.trim();
  if (firstLine && firstLine.length < 80) found.add(firstLine);
  return { habilidades: [...found] };
}

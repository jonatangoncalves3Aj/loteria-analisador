import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { ExperienciaItem, FormacaoItem, Perfil } from '../types';
import { parseResumeLocally, parseCertificateLocally } from '../utils/resumeParser';

import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

type Step = 'idle' | 'extracting' | 'parsing' | 'done' | 'error';
type Source = 'local' | 'ia';

export interface ParsedCurriculum {
  nome?: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  linkedin?: string;
  crea?: string;
  resumo?: string;
  habilidades?: string[];
  experiencias?: Omit<ExperienciaItem, 'id'>[];
  formacoes?: Omit<FormacaoItem, 'id'>[];
}

interface Props {
  onCurriculumParsed: (data: ParsedCurriculum) => void;
  onSkillsAdded: (skills: string[]) => void;
  currentPerfil: Perfil;
}

// ── Text extraction ──────────────────────────────────────────────────────────

async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(
      content.items.map((item: unknown) => (item as { str: string }).str).join(' ')
    );
  }
  return pages.join('\n');
}

async function extractTextFromDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

async function extractText(file: File): Promise<string> {
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    return extractTextFromPdf(file);
  }
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.endsWith('.docx')
  ) {
    return extractTextFromDocx(file);
  }
  throw new Error('Formato não suportado. Use PDF ou DOCX.');
}

// ── API call (optional, when ANTHROPIC_API_KEY is configured) ────────────────

async function tryApiParse(text: string, type: 'curriculum' | 'certificate'): Promise<ParsedCurriculum | null> {
  try {
    const res = await fetch('/.netlify/functions/parse-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, type }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Summary helper ───────────────────────────────────────────────────────────

function summarize(data: ParsedCurriculum): string[] {
  const filled: string[] = [];
  if (data.nome) filled.push('Nome');
  if (data.email) filled.push('E-mail');
  if (data.telefone) filled.push('Telefone');
  if (data.cidade) filled.push('Cidade');
  if (data.estado) filled.push('Estado');
  if (data.linkedin) filled.push('LinkedIn');
  if (data.crea) filled.push('CREA');
  if (data.resumo) filled.push('Resumo');
  if (data.habilidades?.length) filled.push(`${data.habilidades.length} habilidades`);
  if (data.experiencias?.length) filled.push(`${data.experiencias.length} experiências`);
  if (data.formacoes?.length) filled.push(`${data.formacoes.length} formações`);
  return filled;
}

// ── Component ────────────────────────────────────────────────────────────────

export function ResumeUpload({ onCurriculumParsed, onSkillsAdded, currentPerfil }: Props) {
  const [step, setStep] = useState<Step>('idle');
  const [source, setSource] = useState<Source>('local');
  const [filledFields, setFilledFields] = useState<string[]>([]);
  const [pendingSkills, setPendingSkills] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragOverCert, setDragOverCert] = useState(false);
  const [certProcessing, setCertProcessing] = useState(false);

  const cvRef = useRef<HTMLInputElement>(null);
  const certRef = useRef<HTMLInputElement>(null);

  const handleCurriculum = async (file: File) => {
    setStep('extracting');
    setFilledFields([]);

    let text: string;
    try {
      text = await extractText(file);
    } catch (e: unknown) {
      setStep('error');
      return;
    }

    setStep('parsing');

    // 1. Run local parser immediately (no API key needed)
    const localData = parseResumeLocally(text);
    onCurriculumParsed(localData);
    setFilledFields(summarize(localData));
    setSource('local');
    setStep('done');

    // 2. Try AI in background — silently upgrades if available
    const aiData = await tryApiParse(text, 'curriculum');
    if (aiData) {
      // Merge: prefer AI values when present, keep local as fallback
      const merged: ParsedCurriculum = {
        nome: aiData.nome || localData.nome,
        email: aiData.email || localData.email,
        telefone: aiData.telefone || localData.telefone,
        cidade: aiData.cidade || localData.cidade,
        estado: aiData.estado || localData.estado,
        linkedin: aiData.linkedin || localData.linkedin,
        crea: aiData.crea || localData.crea,
        resumo: aiData.resumo || localData.resumo,
        habilidades: aiData.habilidades?.length ? aiData.habilidades : localData.habilidades,
        experiencias: aiData.experiencias?.length ? aiData.experiencias : localData.experiencias,
        formacoes: aiData.formacoes?.length ? aiData.formacoes : localData.formacoes,
      };
      onCurriculumParsed(merged);
      setFilledFields(summarize(merged));
      setSource('ia');
    }
  };

  const handleCertificate = async (file: File) => {
    setCertProcessing(true);
    try {
      const text = await extractText(file);

      // Local parse
      const local = parseCertificateLocally(text);
      let skills = local.habilidades;

      // Try AI upgrade
      const ai = await tryApiParse(text, 'certificate') as { habilidades?: string[]; titulo?: string } | null;
      if (ai) {
        const aiSkills = [...(ai.habilidades ?? [])];
        if (ai.titulo) aiSkills.unshift(ai.titulo);
        if (aiSkills.length) skills = aiSkills;
      }

      const newSkills = skills.filter(s => s && !currentPerfil.habilidades.includes(s));
      const unique = [...new Set(newSkills)].filter(Boolean);
      if (unique.length) setPendingSkills(prev => [...new Set([...prev, ...unique])]);
    } catch {
      // silently ignore certificate errors
    } finally {
      setCertProcessing(false);
    }
  };

  const handleDrop = (e: DragEvent, type: 'cv' | 'cert') => {
    e.preventDefault();
    type === 'cv' ? setDragOver(false) : setDragOverCert(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    type === 'cv' ? handleCurriculum(file) : handleCertificate(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'cv' | 'cert') => {
    const file = e.target.files?.[0];
    if (!file) return;
    type === 'cv' ? handleCurriculum(file) : handleCertificate(file);
    e.target.value = '';
  };

  const canClick = step === 'idle' || step === 'done' || step === 'error';

  return (
    <div className="space-y-3 mb-6">
      {/* Currículo */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => handleDrop(e, 'cv')}
        onClick={() => canClick && cvRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors ${
          canClick ? 'cursor-pointer' : 'cursor-default'
        } ${dragOver ? 'border-blue-400 bg-blue-900/20' : 'border-gray-600 hover:border-gray-500'}`}
      >
        <input ref={cvRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => handleFileChange(e, 'cv')} />

        {step === 'idle' && (
          <>
            <p className="text-2xl mb-1">📄</p>
            <p className="text-sm text-gray-300 font-medium">Arraste seu currículo ou clique para selecionar</p>
            <p className="text-xs text-gray-500 mt-1">PDF ou DOCX — preenchimento automático do perfil</p>
          </>
        )}

        {step === 'extracting' && (
          <p className="text-sm text-blue-300 animate-pulse">Lendo arquivo...</p>
        )}

        {step === 'parsing' && (
          <p className="text-sm text-yellow-300 animate-pulse">Analisando currículo...</p>
        )}

        {step === 'done' && (
          <div>
            <p className="text-green-400 font-medium text-sm mb-1">
              Perfil preenchido!
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${source === 'ia' ? 'bg-blue-800 text-blue-200' : 'bg-gray-700 text-gray-300'}`}>
                {source === 'ia' ? '✨ com IA' : '🔍 local'}
              </span>
            </p>
            <p className="text-xs text-gray-400">{filledFields.join(' · ')}</p>
            <p className="text-xs text-gray-500 mt-2 underline cursor-pointer">Clique para enviar outro currículo</p>
          </div>
        )}

        {step === 'error' && (
          <div onClick={e => e.stopPropagation()}>
            <p className="text-red-400 text-sm mb-1">Não foi possível ler o arquivo</p>
            <p className="text-xs text-gray-500">Verifique se o arquivo é PDF ou DOCX válido</p>
            <button onClick={() => setStep('idle')} className="mt-2 text-xs text-blue-400 hover:underline">
              Tentar novamente
            </button>
          </div>
        )}
      </div>

      {/* Certificados */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOverCert(true); }}
        onDragLeave={() => setDragOverCert(false)}
        onDrop={e => handleDrop(e, 'cert')}
        onClick={() => certRef.current?.click()}
        className={`border border-dashed rounded-lg px-4 py-3 text-center cursor-pointer transition-colors ${
          dragOverCert ? 'border-purple-400 bg-purple-900/20' : 'border-gray-700 hover:border-gray-600'
        }`}
      >
        <input ref={certRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => handleFileChange(e, 'cert')} />
        <p className="text-xs text-gray-400">
          {certProcessing ? '🔄 Analisando certificado...' : '🏅 Arraste certificados para extrair habilidades'}
        </p>
      </div>

      {/* Habilidades pendentes de certificados */}
      {pendingSkills.length > 0 && (
        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-3">
          <p className="text-xs text-purple-300 font-medium mb-2">Habilidades extraídas dos certificados:</p>
          <div className="flex flex-wrap gap-1 mb-3">
            {pendingSkills.map(s => (
              <span key={s} className="bg-purple-800 text-purple-100 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                {s}
                <button onClick={() => setPendingSkills(p => p.filter(x => x !== s))} className="text-purple-400 hover:text-red-300">×</button>
              </span>
            ))}
          </div>
          <button onClick={() => { onSkillsAdded(pendingSkills); setPendingSkills([]); }} className="text-xs px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded">
            Adicionar ao perfil
          </button>
        </div>
      )}
    </div>
  );
}

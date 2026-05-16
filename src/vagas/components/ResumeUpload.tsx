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

    const localData = parseResumeLocally(text);
    onCurriculumParsed(localData);
    setFilledFields(summarize(localData));
    setSource('local');
    setStep('done');

    const aiData = await tryApiParse(text, 'curriculum');
    if (aiData) {
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

      const local = parseCertificateLocally(text);
      let skills = local.habilidades;

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
    <div className="space-y-3">
      {/* Currículo */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => handleDrop(e, 'cv')}
        onClick={() => canClick && cvRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
          canClick ? 'cursor-pointer' : 'cursor-default'
        } ${dragOver
          ? 'border-blue-500 bg-blue-950/40'
          : step === 'done'
            ? 'border-green-700 bg-green-950/20'
            : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'
        }`}
      >
        <input ref={cvRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => handleFileChange(e, 'cv')} />

        {step === 'idle' && (
          <>
            <div className="w-12 h-12 rounded-2xl bg-blue-950 border border-blue-800 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📄</span>
            </div>
            <p className="text-sm font-medium text-gray-200 mb-1">Arraste seu currículo aqui</p>
            <p className="text-xs text-gray-500">PDF ou DOCX — preenche o perfil automaticamente</p>
            <span className="inline-block mt-3 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition-colors">
              Ou clique para selecionar
            </span>
          </>
        )}

        {(step === 'extracting' || step === 'parsing') && (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-950 border border-blue-800 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <span className="text-2xl">⚙️</span>
            </div>
            <p className="text-sm text-blue-300 font-medium">
              {step === 'extracting' ? 'Lendo arquivo...' : 'Analisando currículo...'}
            </p>
            <p className="text-xs text-gray-600 mt-1">Aguarde um momento</p>
          </div>
        )}

        {step === 'done' && (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-green-950 border border-green-800 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-sm font-medium text-green-400 mb-1">
              Perfil preenchido!
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                source === 'ia' ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-400'
              }`}>
                {source === 'ia' ? '✨ com IA' : '🔍 automático'}
              </span>
            </p>
            <p className="text-xs text-gray-500">{filledFields.join(' · ')}</p>
            <p className="text-xs text-gray-600 mt-2 underline">Clique para enviar outro arquivo</p>
          </div>
        )}

        {step === 'error' && (
          <div onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-red-950 border border-red-800 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">❌</span>
            </div>
            <p className="text-sm text-red-400 font-medium mb-1">Não foi possível ler o arquivo</p>
            <p className="text-xs text-gray-600 mb-3">Verifique se é um PDF ou DOCX válido</p>
            <button onClick={() => setStep('idle')} className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors">
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
        className={`border border-dashed rounded-2xl px-4 py-3 flex items-center justify-center gap-2 cursor-pointer transition-all ${
          dragOverCert ? 'border-purple-500 bg-purple-950/30' : 'border-gray-800 hover:border-gray-700 bg-gray-900/30'
        }`}
      >
        <input ref={certRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => handleFileChange(e, 'cert')} />
        <span className="text-sm">{certProcessing ? '🔄' : '🏅'}</span>
        <p className="text-xs text-gray-500">
          {certProcessing ? 'Analisando certificado...' : 'Arraste certificados para extrair habilidades'}
        </p>
      </div>

      {/* Habilidades pendentes */}
      {pendingSkills.length > 0 && (
        <div className="bg-purple-950/30 border border-purple-800 rounded-2xl p-4">
          <p className="text-xs font-medium text-purple-300 mb-3">
            🏅 {pendingSkills.length} habilidades extraídas dos certificados:
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {pendingSkills.map(s => (
              <span key={s} className="flex items-center gap-1.5 bg-purple-900/50 border border-purple-800 text-purple-200 text-xs px-2.5 py-1 rounded-full">
                {s}
                <button onClick={() => setPendingSkills(p => p.filter(x => x !== s))} className="text-purple-500 hover:text-red-400 leading-none">×</button>
              </span>
            ))}
          </div>
          <button onClick={() => { onSkillsAdded(pendingSkills); setPendingSkills([]); }}
            className="text-xs px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors">
            Adicionar ao perfil
          </button>
        </div>
      )}
    </div>
  );
}

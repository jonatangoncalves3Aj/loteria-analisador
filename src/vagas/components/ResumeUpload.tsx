import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { Perfil, ExperienciaItem, FormacaoItem } from '../types';

// pdfjs worker via Vite ?url import
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

type Step = 'idle' | 'extracting' | 'parsing' | 'done' | 'error';

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

interface ParsedCertificate {
  titulo?: string;
  instituicao?: string;
  habilidades?: string[];
  cargaHoraria?: string;
  data?: string;
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
    pages.push(content.items.map((item: unknown) => (item as { str: string }).str).join(' '));
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

async function callParseResume(text: string, type: 'curriculum' | 'certificate') {
  const res = await fetch('/.netlify/functions/parse-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, type }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Erro ${res.status}`);
  }
  return res.json();
}

export function ResumeUpload({ onCurriculumParsed, onSkillsAdded, currentPerfil }: Props) {
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState('');
  const [filledFields, setFilledFields] = useState<string[]>([]);
  const [certSkills, setCertSkills] = useState<string[]>([]);
  const [pendingSkills, setPendingSkills] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragOverCert, setDragOverCert] = useState(false);

  const cvRef = useRef<HTMLInputElement>(null);
  const certRef = useRef<HTMLInputElement>(null);

  const handleCurriculum = async (file: File) => {
    setStep('extracting');
    setError('');
    setFilledFields([]);
    try {
      const text = await extractText(file);
      setStep('parsing');
      const data: ParsedCurriculum = await callParseResume(text, 'curriculum');

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

      onCurriculumParsed(data);
      setFilledFields(filled);
      setStep('done');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
      setStep('error');
    }
  };

  const handleCertificate = async (file: File) => {
    setError('');
    try {
      const text = await extractText(file);
      const data: ParsedCertificate = await callParseResume(text, 'certificate');
      const newSkills = (data.habilidades || []).filter(
        s => s && !currentPerfil.habilidades.includes(s),
      );
      if (data.titulo) newSkills.unshift(data.titulo);
      const unique = [...new Set(newSkills)].filter(Boolean);
      setCertSkills(prev => [...new Set([...prev, ...unique])]);
      setPendingSkills(prev => [...new Set([...prev, ...unique])]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao processar certificado');
    }
  };

  const handleDrop = (e: DragEvent, type: 'cv' | 'cert') => {
    e.preventDefault();
    if (type === 'cv') setDragOver(false);
    else setDragOverCert(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (type === 'cv') handleCurriculum(file);
    else handleCertificate(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'cv' | 'cert') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === 'cv') handleCurriculum(file);
    else handleCertificate(file);
    e.target.value = '';
  };

  const handleConfirmSkills = () => {
    onSkillsAdded(pendingSkills);
    setPendingSkills([]);
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Currículo upload */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => handleDrop(e, 'cv')}
        onClick={() => step === 'idle' || step === 'done' || step === 'error' ? cvRef.current?.click() : null}
        className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-900/20' : 'border-gray-600 hover:border-gray-500'
        } ${step === 'extracting' || step === 'parsing' ? 'cursor-default' : ''}`}
      >
        <input
          ref={cvRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={e => handleFileChange(e, 'cv')}
        />

        {step === 'idle' && (
          <>
            <p className="text-2xl mb-1">📄</p>
            <p className="text-sm text-gray-300 font-medium">Arraste seu currículo aqui ou clique para selecionar</p>
            <p className="text-xs text-gray-500 mt-1">PDF ou DOCX — o perfil será preenchido automaticamente com IA</p>
          </>
        )}

        {step === 'extracting' && (
          <div>
            <p className="text-sm text-blue-300 animate-pulse">Extraindo texto do arquivo...</p>
          </div>
        )}

        {step === 'parsing' && (
          <div>
            <p className="text-sm text-yellow-300 animate-pulse">Analisando com IA...</p>
          </div>
        )}

        {step === 'done' && (
          <div>
            <p className="text-green-400 font-medium text-sm mb-1">Perfil preenchido automaticamente!</p>
            <p className="text-xs text-gray-400">{filledFields.join(' · ')}</p>
            <p className="text-xs text-gray-500 mt-2 underline">Clique para enviar outro currículo</p>
          </div>
        )}

        {step === 'error' && (
          <div onClick={e => e.stopPropagation()}>
            <p className="text-red-400 text-sm font-medium mb-1">Erro ao processar</p>
            <p className="text-xs text-gray-400 mb-2">{error}</p>
            {error.includes('ANTHROPIC_API_KEY') && (
              <p className="text-xs text-yellow-300">
                Configure a variável <code className="bg-gray-700 px-1 rounded">ANTHROPIC_API_KEY</code> no painel do Netlify em Site Settings → Environment Variables.
              </p>
            )}
            <button
              onClick={() => { setStep('idle'); setError(''); }}
              className="mt-2 text-xs text-blue-400 hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>

      {/* Certificados upload */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOverCert(true); }}
        onDragLeave={() => setDragOverCert(false)}
        onDrop={e => handleDrop(e, 'cert')}
        onClick={() => certRef.current?.click()}
        className={`border border-dashed rounded-lg px-4 py-3 text-center cursor-pointer transition-colors ${
          dragOverCert ? 'border-purple-400 bg-purple-900/20' : 'border-gray-700 hover:border-gray-600'
        }`}
      >
        <input
          ref={certRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={e => handleFileChange(e, 'cert')}
        />
        <p className="text-xs text-gray-400">
          🏅 Arraste certificados para extrair habilidades automaticamente
        </p>
      </div>

      {/* Skills pendentes de certificados */}
      {pendingSkills.length > 0 && (
        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-3">
          <p className="text-xs text-purple-300 font-medium mb-2">
            Habilidades extraídas dos certificados:
          </p>
          <div className="flex flex-wrap gap-1 mb-3">
            {pendingSkills.map(s => (
              <span key={s} className="bg-purple-800 text-purple-100 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                {s}
                <button
                  onClick={() => setPendingSkills(p => p.filter(x => x !== s))}
                  className="text-purple-400 hover:text-red-300"
                >×</button>
              </span>
            ))}
          </div>
          <button
            onClick={handleConfirmSkills}
            className="text-xs px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded"
          >
            Adicionar ao perfil
          </button>
        </div>
      )}
    </div>
  );
}

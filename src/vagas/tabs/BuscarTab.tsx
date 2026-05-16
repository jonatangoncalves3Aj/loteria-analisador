import { useState } from 'react';
import { useVagasStore } from '../store/useVagasStore';
import type { Candidatura } from '../types';
import { Search, ExternalLink, Plus, ChevronDown, ChevronUp } from 'lucide-react';

interface Portal { nome: string; cor: string; bg: string; url: (q: string, l: string) => string }

const PORTAIS: Portal[] = [
  { nome: 'LinkedIn',        cor: 'text-blue-300',   bg: 'bg-blue-950 border-blue-800 hover:bg-blue-900',   url: (q, l) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l || 'Brasil')}` },
  { nome: 'Indeed',          cor: 'text-indigo-300',  bg: 'bg-indigo-950 border-indigo-800 hover:bg-indigo-900', url: (q, l) => `https://br.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}` },
  { nome: 'Catho',           cor: 'text-orange-300',  bg: 'bg-orange-950 border-orange-800 hover:bg-orange-900', url: (q, l) => `https://www.catho.com.br/vagas/${encodeURIComponent(q.replace(/ /g,'-'))}/${encodeURIComponent(l.replace(/ /g,'-'))}` },
  { nome: 'InfoJobs',        cor: 'text-green-300',   bg: 'bg-green-950 border-green-800 hover:bg-green-900',   url: (q, l) => `https://www.infojobs.com.br/empregos-em-${encodeURIComponent(l.replace(/ /g,'-')||'brasil')}/cargo_${encodeURIComponent(q.replace(/ /g,'-'))}.aspx` },
  { nome: 'Vagas.com',       cor: 'text-teal-300',    bg: 'bg-teal-950 border-teal-800 hover:bg-teal-900',     url: (q, l) => `https://www.vagas.com.br/vagas-de-${encodeURIComponent(q.replace(/ /g,'-'))}?q=${encodeURIComponent(q)}&cidade=${encodeURIComponent(l)}` },
  { nome: 'Empregos.com.br', cor: 'text-purple-300',  bg: 'bg-purple-950 border-purple-800 hover:bg-purple-900', url: (q, l) => `https://www.empregos.com.br/busca?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}` },
  { nome: 'CREA Empregos',   cor: 'text-yellow-300',  bg: 'bg-yellow-950 border-yellow-800 hover:bg-yellow-900', url: (q) => `https://emprego.crea-sp.org.br/vagas?search=${encodeURIComponent(q)}` },
  { nome: 'Gupy',            cor: 'text-pink-300',    bg: 'bg-pink-950 border-pink-800 hover:bg-pink-900',     url: (q) => `https://portal.gupy.io/jobs?searchTerm=${encodeURIComponent(q)}` },
];

const SUGESTOES = ['Engenheiro Civil', 'Engenheiro de Obras', 'Engenheiro Estrutural', 'Coordenador de Obras', 'Fiscal de Obras', 'Projetista Civil'];

const emptyForm = (): Omit<Candidatura, 'id' | 'dataCadastro'> => ({
  empresa: '', cargo: 'Engenheiro Civil', local: '', salario: '',
  url: '', fonte: 'LinkedIn', dataAplicacao: new Date().toISOString().slice(0, 10),
  status: 'interesse', notas: '', contato: '',
});

export function BuscarTab() {
  const { addCandidatura } = useVagasStore();
  const [busca, setBusca] = useState('Engenheiro Civil');
  const [local, setLocal] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [flash, setFlash] = useState(false);

  const handleAdd = () => {
    if (!form.empresa || !form.cargo) return;
    addCandidatura(form);
    setForm(emptyForm());
    setShowAdd(false);
    setFlash(true);
    setTimeout(() => setFlash(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
        <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Buscar em portais</p>

        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Cargo ou palavra-chave"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-600"
            />
          </div>
          <input
            value={local}
            onChange={e => setLocal(e.target.value)}
            placeholder="Cidade (opcional)"
            className="w-36 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Sugestões */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {SUGESTOES.map(s => (
            <button
              key={s}
              onClick={() => setBusca(s)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                busca === s ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Portal grid */}
        <div className="grid grid-cols-2 gap-2">
          {PORTAIS.map(p => (
            <a
              key={p.nome}
              href={p.url(busca, local)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${p.bg} ${p.cor} border rounded-xl px-3 py-2.5 flex items-center justify-between text-xs font-medium transition-all`}
            >
              {p.nome}
              <ExternalLink size={11} className="opacity-60" />
            </a>
          ))}
        </div>
      </div>

      {/* Add job */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <button
          onClick={() => setShowAdd(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <Plus size={14} />
            </div>
            <span className="text-sm font-medium text-gray-200">Adicionar vaga ao rastreador</span>
          </div>
          <div className="flex items-center gap-2">
            {flash && <span className="text-xs text-green-400">Salvo!</span>}
            {showAdd ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
          </div>
        </button>

        {showAdd && (
          <div className="border-t border-gray-700 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FInput label="Empresa *" value={form.empresa} onChange={v => setForm(p => ({ ...p, empresa: v }))} />
              <FInput label="Cargo *" value={form.cargo} onChange={v => setForm(p => ({ ...p, cargo: v }))} />
              <FInput label="Local" value={form.local} onChange={v => setForm(p => ({ ...p, local: v }))} placeholder="Cidade, Estado" />
              <FInput label="Salário" value={form.salario} onChange={v => setForm(p => ({ ...p, salario: v }))} placeholder="A combinar" />
              <FInput label="Link da vaga" value={form.url} onChange={v => setForm(p => ({ ...p, url: v }))} span placeholder="https://..." />
              <div>
                <label className="block text-xs text-gray-500 mb-1">Portal</label>
                <select value={form.fonte} onChange={e => setForm(p => ({ ...p, fonte: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                  {PORTAIS.map(p => <option key={p.nome}>{p.nome}</option>)}
                  <option>Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Candidatura['status'] }))} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                  <option value="interesse">Interesse</option>
                  <option value="aplicado">Aplicado</option>
                  <option value="entrevista">Entrevista</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notas</label>
              <textarea value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} rows={2} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none" placeholder="Requisitos, observações..." />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={!form.empresa || !form.cargo} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors">
                Salvar vaga
              </button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600 text-center">
        Clique num portal para buscar → encontrou uma vaga? → adicione acima para rastrear
      </p>
    </div>
  );
}

function FInput({ label, value, onChange, span, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  span?: boolean; placeholder?: string; type?: string;
}) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-600" />
    </div>
  );
}

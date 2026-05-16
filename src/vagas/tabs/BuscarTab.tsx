import { useState } from 'react';
import { useVagasStore } from '../store/useVagasStore';
import type { Candidatura } from '../types';

interface Portal {
  nome: string;
  cor: string;
  url: (q: string, local: string) => string;
}

const PORTAIS: Portal[] = [
  {
    nome: 'LinkedIn',
    cor: 'bg-blue-700 hover:bg-blue-600',
    url: (q, l) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l || 'Brasil')}`,
  },
  {
    nome: 'Indeed',
    cor: 'bg-indigo-700 hover:bg-indigo-600',
    url: (q, l) => `https://br.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}`,
  },
  {
    nome: 'Catho',
    cor: 'bg-orange-700 hover:bg-orange-600',
    url: (q, l) => `https://www.catho.com.br/vagas/${encodeURIComponent(q.replace(/ /g, '-'))}/${encodeURIComponent(l.replace(/ /g, '-') || '')}`,
  },
  {
    nome: 'InfoJobs',
    cor: 'bg-green-700 hover:bg-green-600',
    url: (q, l) => `https://www.infojobs.com.br/empregos-em-${encodeURIComponent(l.replace(/ /g, '-') || 'brasil')}/cargo_${encodeURIComponent(q.replace(/ /g, '-'))}.aspx`,
  },
  {
    nome: 'Vagas.com',
    cor: 'bg-teal-700 hover:bg-teal-600',
    url: (q, l) => `https://www.vagas.com.br/vagas-de-${encodeURIComponent(q.replace(/ /g, '-'))}?q=${encodeURIComponent(q)}&cidade=${encodeURIComponent(l)}`,
  },
  {
    nome: 'Empregos.com.br',
    cor: 'bg-purple-700 hover:bg-purple-600',
    url: (q, l) => `https://www.empregos.com.br/busca?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}`,
  },
  {
    nome: 'CREA Empregos',
    cor: 'bg-yellow-700 hover:bg-yellow-600',
    url: (q, _l) => `https://emprego.crea-sp.org.br/vagas?search=${encodeURIComponent(q)}`,
  },
  {
    nome: 'Gupy',
    cor: 'bg-pink-700 hover:bg-pink-600',
    url: (q, _l) => `https://portal.gupy.io/jobs?searchTerm=${encodeURIComponent(q)}`,
  },
];

const BUSCA_SUGERIDAS = [
  'Engenheiro Civil',
  'Engenheiro de Obras',
  'Engenheiro Estrutural',
  'Engenheiro de Saneamento',
  'Coordenador de Obras',
  'Gerente de Projetos Civil',
  'Fiscal de Obras',
  'Projetista Civil',
];

const emptyCandidatura = (): Omit<Candidatura, 'id' | 'dataCadastro'> => ({
  empresa: '',
  cargo: 'Engenheiro Civil',
  local: '',
  salario: '',
  url: '',
  fonte: 'LinkedIn',
  dataAplicacao: new Date().toISOString().slice(0, 10),
  status: 'interesse',
  notas: '',
  contato: '',
});

export function BuscarTab() {
  const { addCandidatura } = useVagasStore();
  const [busca, setBusca] = useState('Engenheiro Civil');
  const [local, setLocal] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyCandidatura());
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (!form.empresa || !form.cargo) return;
    addCandidatura(form);
    setForm(emptyCandidatura());
    setShowAdd(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Pesquisa */}
      <section className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Buscar Vagas nos Portais</h3>

        <div className="flex flex-wrap gap-1 mb-3">
          {BUSCA_SUGERIDAS.map(s => (
            <button
              key={s}
              onClick={() => setBusca(s)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${busca === s ? 'bg-blue-700 border-blue-500 text-white' : 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-400'}`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Cargo / palavra-chave"
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
          />
          <input
            value={local}
            onChange={e => setLocal(e.target.value)}
            placeholder="Cidade / Estado (opcional)"
            className="w-44 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PORTAIS.map(p => (
            <a
              key={p.nome}
              href={p.url(busca, local)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${p.cor} text-white text-xs font-medium py-2 px-3 rounded text-center transition-colors`}
            >
              {p.nome}
            </a>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Clique em um portal para abrir a busca em nova aba. Depois adicione as vagas encontradas ao seu rastreador.
        </p>
      </section>

      {/* Adicionar vaga manualmente */}
      <section className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Adicionar Vaga ao Rastreador</h3>
          {added && <span className="text-xs text-green-400">Vaga adicionada!</span>}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded"
          >
            {showAdd ? 'Cancelar' : '+ Nova vaga'}
          </button>
        </div>

        {showAdd && (
          <div className="border border-gray-600 rounded p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <F label="Empresa *" value={form.empresa} onChange={v => setForm(p => ({ ...p, empresa: v }))} />
              <F label="Cargo *" value={form.cargo} onChange={v => setForm(p => ({ ...p, cargo: v }))} />
              <F label="Local" value={form.local} onChange={v => setForm(p => ({ ...p, local: v }))} placeholder="Cidade, Estado" />
              <F label="Salário" value={form.salario} onChange={v => setForm(p => ({ ...p, salario: v }))} placeholder="R$ 5.000 / A combinar" />
              <F label="URL da vaga" value={form.url} onChange={v => setForm(p => ({ ...p, url: v }))} span={2} placeholder="https://..." />
              <div>
                <label className="block text-xs text-gray-400 mb-1">Portal</label>
                <select
                  value={form.fonte}
                  onChange={e => setForm(p => ({ ...p, fonte: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
                >
                  {PORTAIS.map(p => <option key={p.nome}>{p.nome}</option>)}
                  <option>Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Status inicial</label>
                <select
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value as Candidatura['status'] }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
                >
                  <option value="interesse">Interesse</option>
                  <option value="aplicado">Aplicado</option>
                  <option value="entrevista">Entrevista</option>
                </select>
              </div>
              <F label="Data da candidatura" value={form.dataAplicacao} onChange={v => setForm(p => ({ ...p, dataAplicacao: v }))} type="date" />
              <F label="Contato" value={form.contato} onChange={v => setForm(p => ({ ...p, contato: v }))} placeholder="Nome / e-mail do RH" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Notas</label>
              <textarea
                value={form.notas}
                onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
                rows={2}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white resize-none"
                placeholder="Requisitos, observações..."
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!form.empresa || !form.cargo}
              className="px-4 py-1.5 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white rounded text-sm"
            >
              Salvar no rastreador
            </button>
          </div>
        )}

        {!showAdd && (
          <p className="text-xs text-gray-500">
            Após encontrar uma vaga nos portais, clique em "+ Nova vaga" para registrá-la e acompanhar o processo seletivo.
          </p>
        )}
      </section>
    </div>
  );
}

function F({
  label, value, onChange, span, type = 'text', placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  span?: 2; type?: string; placeholder?: string;
}) {
  return (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white placeholder-gray-500"
      />
    </div>
  );
}

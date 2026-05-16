import { useState } from 'react';
import { useVagasStore } from '../store/useVagasStore';
import type { ExperienciaItem, FormacaoItem } from '../types';
import { ResumeUpload } from '../components/ResumeUpload';
import type { ParsedCurriculum } from '../components/ResumeUpload';
import { Plus, Trash2, ChevronUp, CheckCircle } from 'lucide-react';

const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const SKILLS_SUGERIDAS = ['AutoCAD','Revit','SketchUp','BIM','MS Project','Excel','Primavera P6','SAP2000','ETABS','Civil 3D','Gestão de Obras','Orçamento','Topografia','NBR 6118','Inglês'];

const emptyExp = (): Omit<ExperienciaItem, 'id'> => ({ empresa: '', cargo: '', inicio: '', fim: '', atual: false, descricao: '' });
const emptyForm = (): Omit<FormacaoItem, 'id'> => ({ instituicao: '', curso: '', nivel: 'Graduação', inicio: '', fim: '', concluido: false });

import type { Perfil } from '../types';

function useCompletude(perfil: Perfil) {
  const fields = [
    { label: 'Nome', ok: !!perfil.nome },
    { label: 'E-mail', ok: !!perfil.email },
    { label: 'Telefone', ok: !!perfil.telefone },
    { label: 'Cidade', ok: !!perfil.cidade },
    { label: 'Resumo', ok: !!perfil.resumo },
    { label: 'Habilidades', ok: perfil.habilidades.length >= 3 },
    { label: 'Experiência', ok: perfil.experiencias.length > 0 },
    { label: 'Formação', ok: perfil.formacoes.length > 0 },
  ];
  const done = fields.filter(f => f.ok).length;
  return { pct: Math.round((done / fields.length) * 100), missing: fields.filter(f => !f.ok).map(f => f.label), total: fields.length, done };
}

export function PerfilTab() {
  const { perfil, updatePerfil, addHabilidade, removeHabilidade, addExperiencia, removeExperiencia, addFormacao, removeFormacao } = useVagasStore();

  const { pct, missing } = useCompletude(perfil);
  const [novaHab, setNovaHab] = useState('');
  const [showExpForm, setShowExpForm] = useState(false);
  const [showFormForm, setShowFormForm] = useState(false);
  const [novaExp, setNovaExp] = useState(emptyExp());
  const [novaFor, setNovaFor] = useState(emptyForm());
  const [saved, setSaved] = useState(false);

  const handleCurriculumParsed = (data: ParsedCurriculum) => {
    const patch: Partial<typeof perfil> = {};
    if (data.nome) patch.nome = data.nome;
    if (data.email) patch.email = data.email;
    if (data.telefone) patch.telefone = data.telefone;
    if (data.cidade) patch.cidade = data.cidade;
    if (data.estado) patch.estado = data.estado;
    if (data.linkedin) patch.linkedin = data.linkedin;
    if (data.crea) patch.crea = data.crea;
    if (data.resumo) patch.resumo = data.resumo;
    if (Object.keys(patch).length) updatePerfil(patch);
    data.habilidades?.forEach(h => h && addHabilidade(h));
    data.experiencias?.forEach(e => e.empresa && addExperiencia(e));
    data.formacoes?.forEach(f => f.instituicao && addFormacao(f));
  };

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const addExp = () => {
    if (!novaExp.empresa || !novaExp.cargo) return;
    addExperiencia(novaExp); setNovaExp(emptyExp()); setShowExpForm(false);
  };
  const addFor = () => {
    if (!novaFor.instituicao || !novaFor.curso) return;
    addFormacao(novaFor); setNovaFor(emptyForm()); setShowFormForm(false);
  };

  const pctColor = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-blue-500';

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Upload */}
      <ResumeUpload onCurriculumParsed={handleCurriculumParsed} onSkillsAdded={skills => skills.forEach(s => addHabilidade(s))} currentPerfil={perfil} />

      {/* Completude */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-300">Perfil completo</span>
          <span className={`text-xs font-bold ${pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-blue-400'}`}>{pct}%</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div className={`h-full ${pctColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
        {missing.length > 0 && (
          <p className="text-xs text-gray-600 mt-2">Faltando: {missing.join(', ')}</p>
        )}
      </div>

      {/* Dados pessoais */}
      <Section title="Dados Pessoais">
        <div className="grid grid-cols-2 gap-3">
          <F label="Nome completo" value={perfil.nome} onChange={v => updatePerfil({ nome: v })} span />
          <F label="E-mail" value={perfil.email} onChange={v => updatePerfil({ email: v })} type="email" />
          <F label="Telefone" value={perfil.telefone} onChange={v => updatePerfil({ telefone: v })} />
          <F label="Cidade" value={perfil.cidade} onChange={v => updatePerfil({ cidade: v })} />
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Estado</label>
            <select value={perfil.estado} onChange={e => updatePerfil({ estado: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600">
              <option value="">Selecione</option>
              {ESTADOS_BR.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <F label="LinkedIn" value={perfil.linkedin} onChange={v => updatePerfil({ linkedin: v })} placeholder="linkedin.com/in/seu-perfil" span />
          <F label="CREA" value={perfil.crea} onChange={v => updatePerfil({ crea: v })} placeholder="CREA-XX 000000-D" />
        </div>
        <div className="mt-3">
          <label className="block text-xs text-gray-500 mb-1.5">Resumo profissional</label>
          <textarea value={perfil.resumo} onChange={e => updatePerfil({ resumo: e.target.value })} rows={3}
            placeholder="Engenheiro Civil com X anos de experiência em..."
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-blue-600" />
        </div>
        <button onClick={handleSave}
          className={`mt-3 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            saved ? 'bg-green-700 text-green-100' : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}>
          {saved ? <><CheckCircle size={14} /> Salvo!</> : 'Salvar dados'}
        </button>
      </Section>

      {/* Habilidades */}
      <Section title="Habilidades Técnicas">
        <div className="flex flex-wrap gap-2 mb-3 min-h-6">
          {perfil.habilidades.map(h => (
            <span key={h} className="flex items-center gap-1.5 bg-blue-950 border border-blue-800 text-blue-200 px-2.5 py-1 rounded-full text-xs">
              {h}
              <button onClick={() => removeHabilidade(h)} className="text-blue-500 hover:text-red-400 leading-none">×</button>
            </span>
          ))}
          {perfil.habilidades.length === 0 && <p className="text-xs text-gray-600">Nenhuma habilidade adicionada</p>}
        </div>
        <div className="flex gap-2 mb-3">
          <input value={novaHab} onChange={e => setNovaHab(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && novaHab.trim()) { addHabilidade(novaHab.trim()); setNovaHab(''); } }}
            placeholder="Digite e pressione Enter..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-600" />
          <button onClick={() => { if (novaHab.trim()) { addHabilidade(novaHab.trim()); setNovaHab(''); } }}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SKILLS_SUGERIDAS.filter(s => !perfil.habilidades.includes(s)).map(s => (
            <button key={s} onClick={() => addHabilidade(s)}
              className="text-xs px-2.5 py-1 rounded-full border border-gray-700 text-gray-500 hover:border-blue-700 hover:text-blue-300 transition-colors">
              + {s}
            </button>
          ))}
        </div>
      </Section>

      {/* Experiência */}
      <Section title="Experiência Profissional" action={<AddBtn onClick={() => setShowExpForm(v => !v)} open={showExpForm} />}>
        {showExpForm && (
          <div className="border border-gray-700 rounded-xl p-3 mb-3 space-y-3 bg-gray-900/50">
            <div className="grid grid-cols-2 gap-3">
              <F label="Empresa" value={novaExp.empresa} onChange={v => setNovaExp(p => ({ ...p, empresa: v }))} />
              <F label="Cargo" value={novaExp.cargo} onChange={v => setNovaExp(p => ({ ...p, cargo: v }))} />
              <F label="Início" value={novaExp.inicio} onChange={v => setNovaExp(p => ({ ...p, inicio: v }))} placeholder="MM/AAAA" />
              <div>
                <F label="Fim" value={novaExp.fim} onChange={v => setNovaExp(p => ({ ...p, fim: v }))} placeholder="MM/AAAA" />
                <label className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5 cursor-pointer">
                  <input type="checkbox" checked={novaExp.atual} onChange={e => setNovaExp(p => ({ ...p, atual: e.target.checked, fim: '' }))} className="rounded" />
                  Emprego atual
                </label>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1.5">Descrição</label>
                <textarea value={novaExp.descricao} onChange={e => setNovaExp(p => ({ ...p, descricao: e.target.value }))} rows={2}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-blue-600" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addExp} className="px-4 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-medium">Salvar</button>
              <button onClick={() => setShowExpForm(false)} className="px-4 py-1.5 text-gray-500 hover:text-white text-xs">Cancelar</button>
            </div>
          </div>
        )}
        <div className="space-y-2">
          {perfil.experiencias.map(e => (
            <div key={e.id} className="flex items-start gap-3 bg-gray-900/50 border border-gray-800 rounded-xl p-3">
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm">🏢</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{e.cargo}</p>
                <p className="text-xs text-gray-400">{e.empresa}</p>
                <p className="text-xs text-gray-600 mt-0.5">{e.inicio} – {e.atual ? 'Atual' : e.fim}</p>
                {e.descricao && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{e.descricao}</p>}
              </div>
              <button onClick={() => removeExperiencia(e.id)} className="text-gray-700 hover:text-red-400 transition-colors flex-shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {perfil.experiencias.length === 0 && <p className="text-xs text-gray-600 py-2">Nenhuma experiência cadastrada</p>}
        </div>
      </Section>

      {/* Formação */}
      <Section title="Formação Acadêmica" action={<AddBtn onClick={() => setShowFormForm(v => !v)} open={showFormForm} />}>
        {showFormForm && (
          <div className="border border-gray-700 rounded-xl p-3 mb-3 space-y-3 bg-gray-900/50">
            <div className="grid grid-cols-2 gap-3">
              <F label="Instituição" value={novaFor.instituicao} onChange={v => setNovaFor(p => ({ ...p, instituicao: v }))} />
              <F label="Curso" value={novaFor.curso} onChange={v => setNovaFor(p => ({ ...p, curso: v }))} />
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Nível</label>
                <select value={novaFor.nivel} onChange={e => setNovaFor(p => ({ ...p, nivel: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white">
                  {['Técnico','Graduação','Especialização','MBA','Mestrado','Doutorado'].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <F label="Início" value={novaFor.inicio} onChange={v => setNovaFor(p => ({ ...p, inicio: v }))} placeholder="MM/AAAA" />
              <F label="Conclusão" value={novaFor.fim} onChange={v => setNovaFor(p => ({ ...p, fim: v }))} placeholder="MM/AAAA" />
            </div>
            <div className="flex gap-2">
              <button onClick={addFor} className="px-4 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-medium">Salvar</button>
              <button onClick={() => setShowFormForm(false)} className="px-4 py-1.5 text-gray-500 hover:text-white text-xs">Cancelar</button>
            </div>
          </div>
        )}
        <div className="space-y-2">
          {perfil.formacoes.map(f => (
            <div key={f.id} className="flex items-start gap-3 bg-gray-900/50 border border-gray-800 rounded-xl p-3">
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm">🎓</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{f.curso}</p>
                <p className="text-xs text-gray-400">{f.instituicao} · {f.nivel}</p>
                <p className="text-xs text-gray-600 mt-0.5">{f.inicio} – {f.fim || 'Em andamento'}</p>
              </div>
              <button onClick={() => removeFormacao(f.id)} className="text-gray-700 hover:text-red-400 transition-colors flex-shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {perfil.formacoes.length === 0 && <p className="text-xs text-gray-600 py-2">Nenhuma formação cadastrada</p>}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function AddBtn({ onClick, open }: { onClick: () => void; open: boolean }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
      {open ? <ChevronUp size={12} /> : <Plus size={12} />}
      {open ? 'Fechar' : 'Adicionar'}
    </button>
  );
}

function F({ label, value, onChange, span, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  span?: boolean; type?: string; placeholder?: string;
}) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-600" />
    </div>
  );
}

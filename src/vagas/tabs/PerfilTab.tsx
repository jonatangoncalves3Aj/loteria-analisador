import { useState } from 'react';
import { useVagasStore } from '../store/useVagasStore';
import type { ExperienciaItem, FormacaoItem } from '../types';

const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const emptyExp = (): Omit<ExperienciaItem, 'id'> => ({
  empresa: '', cargo: '', inicio: '', fim: '', atual: false, descricao: '',
});

const emptyForm = (): Omit<FormacaoItem, 'id'> => ({
  instituicao: '', curso: '', nivel: 'Graduação', inicio: '', fim: '', concluido: false,
});

export function PerfilTab() {
  const {
    perfil, updatePerfil,
    addHabilidade, removeHabilidade,
    addExperiencia, updateExperiencia, removeExperiencia,
    addFormacao, updateFormacao, removeFormacao,
  } = useVagasStore();

  const [novaHabilidade, setNovaHabilidade] = useState('');
  const [novaExp, setNovaExp] = useState(emptyExp());
  const [showExpForm, setShowExpForm] = useState(false);
  const [novaForm, setNovaForm] = useState(emptyForm());
  const [showFormForm, setShowFormForm] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddHabilidade = () => {
    const h = novaHabilidade.trim();
    if (h) { addHabilidade(h); setNovaHabilidade(''); }
  };

  const handleAddExp = () => {
    if (!novaExp.empresa || !novaExp.cargo) return;
    addExperiencia(novaExp);
    setNovaExp(emptyExp());
    setShowExpForm(false);
  };

  const handleAddForm = () => {
    if (!novaForm.instituicao || !novaForm.curso) return;
    addFormacao(novaForm);
    setNovaForm(emptyForm());
    setShowFormForm(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Dados pessoais */}
      <section className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Dados Pessoais</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome completo" value={perfil.nome} onChange={v => updatePerfil({ nome: v })} span={2} />
          <Field label="E-mail" value={perfil.email} onChange={v => updatePerfil({ email: v })} type="email" />
          <Field label="Telefone" value={perfil.telefone} onChange={v => updatePerfil({ telefone: v })} />
          <Field label="Cidade" value={perfil.cidade} onChange={v => updatePerfil({ cidade: v })} />
          <div>
            <label className="block text-xs text-gray-400 mb-1">Estado</label>
            <select
              value={perfil.estado}
              onChange={e => updatePerfil({ estado: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
            >
              <option value="">Selecione</option>
              {ESTADOS_BR.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <Field label="LinkedIn" value={perfil.linkedin} onChange={v => updatePerfil({ linkedin: v })} span={2} placeholder="linkedin.com/in/seu-perfil" />
          <Field label="CREA" value={perfil.crea} onChange={v => updatePerfil({ crea: v })} placeholder="CREA-XX 000000-D" />
        </div>
        <div className="mt-3">
          <label className="block text-xs text-gray-400 mb-1">Resumo Profissional</label>
          <textarea
            value={perfil.resumo}
            onChange={e => updatePerfil({ resumo: e.target.value })}
            rows={3}
            placeholder="Engenheiro Civil com X anos de experiência em..."
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white resize-none"
          />
        </div>
        <button
          onClick={handleSave}
          className={`mt-2 px-4 py-1.5 rounded text-sm font-medium transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
        >
          {saved ? 'Salvo!' : 'Salvar'}
        </button>
      </section>

      {/* Habilidades */}
      <section className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Habilidades</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {perfil.habilidades.map(h => (
            <span key={h} className="flex items-center gap-1 bg-blue-900 text-blue-200 px-2 py-0.5 rounded text-xs">
              {h}
              <button onClick={() => removeHabilidade(h)} className="text-blue-400 hover:text-red-400 ml-1">×</button>
            </span>
          ))}
          {perfil.habilidades.length === 0 && <span className="text-xs text-gray-500">Nenhuma habilidade adicionada</span>}
        </div>
        <div className="flex gap-2">
          <input
            value={novaHabilidade}
            onChange={e => setNovaHabilidade(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddHabilidade()}
            placeholder="Ex: AutoCAD, Revit, AECO..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
          />
          <button onClick={handleAddHabilidade} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm">
            Adicionar
          </button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {['AutoCAD','Revit','SketchUp','BIM','SCCP','Excel','MS Project','Primavera P6','NormasBR','NBR 6118','Orçamento','Gestão de Obras','Topografia','Fundações'].map(s => (
            <button key={s} onClick={() => addHabilidade(s)} className="text-xs text-gray-400 hover:text-blue-300 border border-gray-600 hover:border-blue-600 rounded px-1.5 py-0.5">
              + {s}
            </button>
          ))}
        </div>
      </section>

      {/* Experiência */}
      <section className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Experiência Profissional</h3>
          <button onClick={() => setShowExpForm(!showExpForm)} className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded">
            + Adicionar
          </button>
        </div>

        {showExpForm && (
          <div className="bg-gray-750 border border-gray-600 rounded p-3 mb-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Empresa" value={novaExp.empresa} onChange={v => setNovaExp(p => ({ ...p, empresa: v }))} />
              <Field label="Cargo" value={novaExp.cargo} onChange={v => setNovaExp(p => ({ ...p, cargo: v }))} />
              <Field label="Início" value={novaExp.inicio} onChange={v => setNovaExp(p => ({ ...p, inicio: v }))} placeholder="MM/AAAA" />
              <div>
                <Field label="Fim" value={novaExp.fim} onChange={v => setNovaExp(p => ({ ...p, fim: v }))} placeholder="MM/AAAA" />
                <label className="flex items-center gap-1 text-xs text-gray-400 mt-1 cursor-pointer">
                  <input type="checkbox" checked={novaExp.atual} onChange={e => setNovaExp(p => ({ ...p, atual: e.target.checked, fim: '' }))} />
                  Emprego atual
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Descrição</label>
              <textarea
                value={novaExp.descricao}
                onChange={e => setNovaExp(p => ({ ...p, descricao: e.target.value }))}
                rows={2}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddExp} className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-xs">Salvar</button>
              <button onClick={() => setShowExpForm(false)} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs">Cancelar</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {perfil.experiencias.map(exp => (
            <div key={exp.id} className="border border-gray-700 rounded p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-white">{exp.cargo}</p>
                  <p className="text-xs text-gray-400">{exp.empresa} · {exp.inicio} – {exp.atual ? 'Atual' : exp.fim}</p>
                  {exp.descricao && <p className="text-xs text-gray-300 mt-1">{exp.descricao}</p>}
                </div>
                <button onClick={() => removeExperiencia(exp.id)} className="text-gray-500 hover:text-red-400 text-xs ml-2">Remover</button>
              </div>
            </div>
          ))}
          {perfil.experiencias.length === 0 && <p className="text-xs text-gray-500">Nenhuma experiência cadastrada</p>}
        </div>
      </section>

      {/* Formação */}
      <section className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Formação Acadêmica</h3>
          <button onClick={() => setShowFormForm(!showFormForm)} className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded">
            + Adicionar
          </button>
        </div>

        {showFormForm && (
          <div className="border border-gray-600 rounded p-3 mb-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Instituição" value={novaForm.instituicao} onChange={v => setNovaForm(p => ({ ...p, instituicao: v }))} />
              <Field label="Curso" value={novaForm.curso} onChange={v => setNovaForm(p => ({ ...p, curso: v }))} />
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nível</label>
                <select
                  value={novaForm.nivel}
                  onChange={e => setNovaForm(p => ({ ...p, nivel: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
                >
                  {['Técnico','Graduação','Especialização','MBA','Mestrado','Doutorado'].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <Field label="Início" value={novaForm.inicio} onChange={v => setNovaForm(p => ({ ...p, inicio: v }))} placeholder="MM/AAAA" />
              <Field label="Conclusão" value={novaForm.fim} onChange={v => setNovaForm(p => ({ ...p, fim: v }))} placeholder="MM/AAAA" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddForm} className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-xs">Salvar</button>
              <button onClick={() => setShowFormForm(false)} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs">Cancelar</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {perfil.formacoes.map(f => (
            <div key={f.id} className="border border-gray-700 rounded p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-white">{f.curso} <span className="text-gray-500 text-xs">({f.nivel})</span></p>
                  <p className="text-xs text-gray-400">{f.instituicao} · {f.inicio} – {f.fim || 'Em andamento'}</p>
                </div>
                <button onClick={() => removeFormacao(f.id)} className="text-gray-500 hover:text-red-400 text-xs ml-2">Remover</button>
              </div>
            </div>
          ))}
          {perfil.formacoes.length === 0 && <p className="text-xs text-gray-500">Nenhuma formação cadastrada</p>}
        </div>
      </section>
    </div>
  );
}

function Field({
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

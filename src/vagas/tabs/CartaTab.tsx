import { useState } from 'react';
import { useVagasStore } from '../store/useVagasStore';
import { Copy, Check, Wand2 } from 'lucide-react';

function gerarCarta(p: {
  nome: string; cargo: string; empresa: string; cidade: string;
  resumo: string; habilidades: string[]; anos: string; motivacao: string; crea: string;
}): string {
  const data = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  const hab = p.habilidades.slice(0, 5).join(', ');
  return `${p.cidade || '[Cidade]'}, ${data}

Prezados(as) recrutadores(as) da ${p.empresa || '[Empresa]'},

Venho por meio desta carta apresentar minha candidatura à vaga de ${p.cargo || 'Engenheiro Civil'}.

${p.resumo || `Sou Engenheiro Civil com ${p.anos || 'X'} anos de experiência em projetos e gestão de obras.`}

Durante minha trajetória, desenvolvi sólidas competências em ${hab || 'diversas áreas da engenharia civil'}, sempre comprometido com a excelência técnica e a qualidade das entregas.${p.motivacao ? `\n\n${p.motivacao}` : ''}

Estou convicto de que meu perfil pode contribuir positivamente para os projetos da ${p.empresa || '[Empresa]'}. Coloco-me à disposição para uma entrevista no momento mais conveniente.

Atenciosamente,

${p.nome || '[Seu Nome]'}${p.crea ? `\n${p.crea}` : ''}`;
}

export function CartaTab() {
  const { perfil, candidaturas } = useVagasStore();

  const [empresa, setEmpresa] = useState('');
  const [cargo, setCargo] = useState('Engenheiro Civil');
  const [anos, setAnos] = useState('');
  const [motivacao, setMotivacao] = useState('');
  const [carta, setCarta] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [vagaId, setVagaId] = useState('');

  const temPerfil = !!(perfil.nome || perfil.resumo);

  const handleVaga = (id: string) => {
    setVagaId(id);
    const v = candidaturas.find(c => c.id === id);
    if (v) { setEmpresa(v.empresa); setCargo(v.cargo); }
  };

  const handleGerar = () => {
    setCarta(gerarCarta({
      nome: perfil.nome, cargo, empresa, cidade: perfil.cidade,
      resumo: perfil.resumo, habilidades: perfil.habilidades,
      anos, motivacao, crea: perfil.crea,
    }));
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(carta);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-4">
      {!temPerfil && (
        <div className="bg-yellow-950 border border-yellow-800 rounded-2xl p-4 flex gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-sm text-yellow-200 font-medium">Perfil incompleto</p>
            <p className="text-xs text-yellow-400 mt-0.5">Preencha seu perfil para gerar cartas mais completas.</p>
          </div>
        </div>
      )}

      {/* Layout split */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Formulário */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Wand2 size={14} className="text-blue-400" />
            Configurar carta
          </h3>

          {candidaturas.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Usar dados de candidatura salva</label>
              <select value={vagaId} onChange={e => handleVaga(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white">
                <option value="">Preencher manualmente</option>
                {candidaturas.map(c => (
                  <option key={c.id} value={c.id}>{c.empresa} — {c.cargo}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <ReadOnly label="Seu nome" value={perfil.nome} placeholder="Cadastre no Perfil" />
            <ReadOnly label="Cidade" value={perfil.cidade} placeholder="Cadastre no Perfil" />
            <CI label="Empresa *" value={empresa} onChange={setEmpresa} placeholder="Nome da empresa" />
            <CI label="Cargo *" value={cargo} onChange={setCargo} />
            <CI label="Anos de experiência" value={anos} onChange={setAnos} placeholder="Ex: 5" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Por que essa empresa? <span className="text-gray-700">(opcional)</span></label>
            <textarea value={motivacao} onChange={e => setMotivacao(e.target.value)} rows={3}
              placeholder="Admiro a atuação da empresa em..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-blue-600" />
          </div>

          <button onClick={handleGerar}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <Wand2 size={14} />
            Gerar carta
          </button>
        </div>

        {/* Preview */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-200">Prévia</h3>
            {carta && (
              <button onClick={handleCopiar}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  copiado ? 'bg-green-700 text-green-100' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}>
                {copiado ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar</>}
              </button>
            )}
          </div>

          {carta ? (
            <textarea value={carta} onChange={e => setCarta(e.target.value)} rows={18}
              className="flex-1 w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-3 text-xs text-gray-300 resize-none font-mono leading-relaxed focus:outline-none focus:border-blue-600" />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 border-2 border-dashed border-gray-700 rounded-xl">
              <p className="text-4xl mb-3">✉️</p>
              <p className="text-gray-500 text-sm">Preencha os campos ao lado<br/>e clique em <strong className="text-gray-400">Gerar carta</strong></p>
            </div>
          )}
          {carta && <p className="text-xs text-gray-600 mt-2 text-center">Edite o texto acima antes de copiar</p>}
        </div>
      </div>
    </div>
  );
}

function ReadOnly({ label, value, placeholder }: { label: string; value: string; placeholder: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-500 truncate">
        {value || placeholder}
      </div>
    </div>
  );
}

function CI({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-600" />
    </div>
  );
}

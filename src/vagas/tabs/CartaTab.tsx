import { useState } from 'react';
import { useVagasStore } from '../store/useVagasStore';

function gerarCarta(params: {
  nome: string;
  cargo: string;
  empresa: string;
  cidade: string;
  resumo: string;
  habilidades: string[];
  anos: string;
  motivacao: string;
  crea: string;
}): string {
  const { nome, cargo, empresa, cidade, resumo, habilidades, anos, motivacao, crea } = params;
  const data = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  const hab = habilidades.slice(0, 5).join(', ');

  return `${cidade || '[Cidade]'}, ${data}

Prezados(as) recrutadores(as) da ${empresa || '[Empresa]'},

Venho por meio desta carta apresentar minha candidatura à vaga de ${cargo || 'Engenheiro Civil'} em sua empresa.

${resumo || `Sou Engenheiro Civil com ${anos || 'X'} anos de experiência na área, atuando em projetos de ${cargo || 'engenharia civil'}.`}

Durante minha trajetória profissional, desenvolvi sólidas competências em ${hab || 'diversas áreas da engenharia civil'}, sempre comprometido com a excelência técnica, os prazos e a qualidade das entregas.

${motivacao ? `${motivacao}\n\n` : ''}Estou convicto de que meu perfil técnico e minha dedicação ao trabalho podem contribuir positivamente para os projetos e objetivos da ${empresa || '[Empresa]'}. Coloco-me à disposição para uma entrevista no momento que for mais conveniente para a equipe de recrutamento.

Agradeço pela atenção e aguardo o retorno.

Atenciosamente,

${nome || '[Seu Nome]'}
Engenheiro Civil${crea ? ` – ${crea}` : ''}`;
}

export function CartaTab() {
  const { perfil, candidaturas } = useVagasStore();

  const [empresa, setEmpresa] = useState('');
  const [cargo, setCargo] = useState('Engenheiro Civil');
  const [anos, setAnos] = useState('');
  const [motivacao, setMotivacao] = useState('');
  const [carta, setCarta] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [vagaSelecionada, setVagaSelecionada] = useState('');

  const handleGerarCarta = () => {
    const texto = gerarCarta({
      nome: perfil.nome,
      cargo,
      empresa,
      cidade: perfil.cidade,
      resumo: perfil.resumo,
      habilidades: perfil.habilidades,
      anos,
      motivacao,
      crea: perfil.crea,
    });
    setCarta(texto);
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(carta);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleSelecionarVaga = (id: string) => {
    setVagaSelecionada(id);
    const vaga = candidaturas.find(c => c.id === id);
    if (vaga) {
      setEmpresa(vaga.empresa);
      setCargo(vaga.cargo);
    }
  };

  const temPerfil = perfil.nome || perfil.resumo || perfil.habilidades.length > 0;

  return (
    <div className="space-y-4 max-w-3xl">
      {!temPerfil && (
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-3 text-xs text-yellow-200">
          Dica: preencha seu <strong>Perfil</strong> primeiro para gerar cartas mais completas e personalizadas.
        </div>
      )}

      <section className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Gerar Carta de Apresentação</h3>

        <div className="space-y-3">
          {candidaturas.length > 0 && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Usar dados de uma candidatura salva</label>
              <select
                value={vagaSelecionada}
                onChange={e => handleSelecionarVaga(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
              >
                <option value="">Preencher manualmente</option>
                {candidaturas.map(c => (
                  <option key={c.id} value={c.id}>{c.empresa} – {c.cargo}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nome (do perfil)</label>
              <input
                value={perfil.nome || ''}
                readOnly
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-400 cursor-not-allowed"
                placeholder="Cadastre no Perfil"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Cidade (do perfil)</label>
              <input
                value={perfil.cidade || ''}
                readOnly
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-400 cursor-not-allowed"
                placeholder="Cadastre no Perfil"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Empresa *</label>
              <input
                value={empresa}
                onChange={e => setEmpresa(e.target.value)}
                placeholder="Nome da empresa"
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Cargo *</label>
              <input
                value={cargo}
                onChange={e => setCargo(e.target.value)}
                placeholder="Cargo desejado"
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Anos de experiência</label>
              <input
                value={anos}
                onChange={e => setAnos(e.target.value)}
                placeholder="Ex: 5"
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Por que quer trabalhar nessa empresa? <span className="text-gray-600">(opcional)</span>
            </label>
            <textarea
              value={motivacao}
              onChange={e => setMotivacao(e.target.value)}
              rows={2}
              placeholder="Ex: Admiro a atuação da empresa em projetos de infraestrutura sustentável..."
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white resize-none"
            />
          </div>

          <button
            onClick={handleGerarCarta}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium"
          >
            Gerar Carta
          </button>
        </div>
      </section>

      {carta && (
        <section className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Carta Gerada</h3>
            <button
              onClick={handleCopiar}
              className={`text-xs px-3 py-1 rounded transition-colors ${copiado ? 'bg-green-700 text-green-100' : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
            >
              {copiado ? 'Copiado!' : 'Copiar texto'}
            </button>
          </div>
          <textarea
            value={carta}
            onChange={e => setCarta(e.target.value)}
            rows={22}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 resize-none font-mono leading-relaxed"
          />
          <p className="text-xs text-gray-500 mt-2">Você pode editar o texto acima antes de copiar.</p>
        </section>
      )}
    </div>
  );
}

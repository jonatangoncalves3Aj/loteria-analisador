import { Building2 } from 'lucide-react';
import { usePCPStore } from '../../store/usePCPStore';
import { NavButtons } from '../wizard/NavButtons';

export function Step01_Identificacao() {
  const companyInfo = usePCPStore(s => s.companyInfo);
  const setCompanyInfo = usePCPStore(s => s.setCompanyInfo);
  const nextStep = usePCPStore(s => s.nextStep);

  const canGoNext = companyInfo.empresa.trim().length > 0 && companyInfo.responsavel.trim().length > 0;

  const field = (
    label: string,
    key: keyof typeof companyInfo,
    placeholder: string,
    type = 'text',
  ) => (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={companyInfo[key]}
        onChange={e => setCompanyInfo({ [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Title card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Identificação da Empresa</h2>
            <p className="text-sm text-slate-500">Preencha os dados do empreendimento a ser avaliado</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        {field('Empresa *', 'empresa', 'Nome da empresa construtora')}
        {field('CNPJ', 'cnpj', '00.000.000/0000-00')}
        <div className="grid grid-cols-2 gap-4">
          {field('Responsável *', 'responsavel', 'Nome completo')}
          {field('Cargo', 'cargo', 'Engenheiro, Gerente de Obras...')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {field('Data do Diagnóstico', 'data', '', 'date')}
          {field('Obra / Projeto', 'obraProjeto', 'Nome da obra ou projeto')}
        </div>
        <p className="text-xs text-slate-400">* Campos obrigatórios</p>
      </div>

      <NavButtons
        currentStep="identificacao"
        onPrev={() => {}}
        onNext={nextStep}
        canGoNext={canGoNext}
      />
    </div>
  );
}

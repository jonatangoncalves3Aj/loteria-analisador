import type { CalcResult } from '../utils/calc';

/** Painel de resultados + memória de cálculo passo a passo. */
export function Resultado({ res, titulo }: { res: CalcResult | null; titulo: string }) {
  if (!res) return null;

  if (!res.ok) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        ⚠️ {res.erro}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resultados em destaque */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-emerald-700">
          Resultado — {titulo}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {res.outputs.map((o) => (
            <div
              key={o.label}
              className={`rounded-lg border p-3 ${
                o.destaque ? 'border-emerald-400 bg-white shadow-sm' : 'border-emerald-100 bg-white/60'
              }`}
            >
              <div className="text-[11px] font-medium text-gray-500">{o.label}</div>
              <div className={`mt-0.5 font-bold ${o.destaque ? 'text-lg text-emerald-700' : 'text-sm text-gray-800'}`}>
                {o.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Memória de cálculo */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-600">
          📐 Memória de cálculo
        </h3>
        <ol className="space-y-3">
          {res.steps.map((s, i) => (
            <li key={i} className="border-l-2 border-blue-200 pl-3">
              <div className="text-sm font-semibold text-gray-800">{s.label}</div>
              {s.formula && (
                <div className="mt-1 font-mono text-xs text-blue-700">{s.formula}</div>
              )}
              {s.substitution && (
                <div className="mt-0.5 font-mono text-xs text-gray-600">{s.substitution}</div>
              )}
              {s.result && (
                <div className="mt-1 font-mono text-sm font-bold text-gray-900">= {s.result}</div>
              )}
              {s.note && <div className="mt-1 text-[11px] italic text-gray-500">{s.note}</div>}
            </li>
          ))}
        </ol>
      </div>

      {/* Avisos */}
      {res.avisos.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700">
            Observações técnicas
          </h3>
          <ul className="space-y-1 text-xs text-amber-800">
            {res.avisos.map((a, i) => (
              <li key={i} className="flex gap-1.5">
                <span>•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Campo numérico rotulado. */
export function Campo({
  label,
  value,
  onChange,
  min,
  step = 1,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  suffix?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        {suffix && <span className="whitespace-nowrap text-xs text-gray-500">{suffix}</span>}
      </div>
      {hint && <span className="mt-1 block text-[11px] text-gray-400">{hint}</span>}
    </label>
  );
}

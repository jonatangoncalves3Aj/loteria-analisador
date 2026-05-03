export function TaskListHeader() {
  return (
    <div className="flex items-center border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide select-none sticky top-0 z-10" style={{ height: 72 }}>
      <div className="flex-1 px-3">Tarefa</div>
      <div className="w-24 px-2 text-center">Início</div>
      <div className="w-24 px-2 text-center">Término</div>
      <div className="w-14 px-2 text-center">Dur.</div>
      <div className="w-14 px-2 text-center">%</div>
    </div>
  );
}

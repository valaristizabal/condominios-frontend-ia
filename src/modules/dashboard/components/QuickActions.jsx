function QuickActions() {
  const actions = [
    { title: "Registro de visitantes", status: "Próximamente" },
    { title: "Ingreso de vehículos", status: "Próximamente" },
    { title: "Correspondencia", status: "Próximamente" },
    { title: "Control de personal", status: "Próximamente" },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {actions.map((action) => (
        <div
          key={action.title}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
        >
          <p className="text-sm font-semibold text-slate-800">{action.title}</p>
          <p className="mt-1 text-xs text-slate-500">{action.status}</p>
        </div>
      ))}
    </div>
  );
}

export default QuickActions;


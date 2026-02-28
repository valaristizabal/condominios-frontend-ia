import { NavLink } from "react-router-dom";

const platformModules = [
  { to: "/condominiums", label: "Condominios" },
  { to: null, label: "Usuarios globales" },
];

function PlatformLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-6">
          <h2 className="text-lg font-extrabold text-slate-900">CondoManager</h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Platform Console
          </p>
        </div>

        <nav className="space-y-1 px-4 py-5">
          <p className="px-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
            Plataforma
          </p>

          <div className="mt-2 space-y-1">
            {platformModules.map((item) =>
              item.to ? (
                <NavLink key={item.label} to={item.to} className="block">
                  {({ isActive }) => (
                    <div
                      className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                      }`}
                    >
                      {item.label}
                    </div>
                  )}
                </NavLink>
              ) : (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400"
                >
                  <span>{item.label}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase">
                    Próx.
                  </span>
                </div>
              )
            )}
          </div>
        </nav>
      </aside>

      <main className="p-4 lg:p-8">{children}</main>
    </div>
  );
}

export default PlatformLayout;


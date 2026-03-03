import { NavLink } from "react-router-dom";

const platformModules = [
  { to: "/condominiums", label: "Condominios" },
  { to: null, label: "Usuarios globales" },
];

function PlatformLayout({ children }) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[320px_1fr]">
      <aside className="border-r border-slate-200 bg-white">
        <div className="px-7 pb-5 pt-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img src="/image/isotipo1.png" alt="GenAccess" className="h-8 w-auto object-contain" />
            </div>
            <div className="leading-tight">
              <h2 className="text-lg font-extrabold text-slate-900">GenAccess</h2>
              <p className="text-xs font-bold tracking-widest text-slate-400">PLATFORM CONSOLE</p>
            </div>
          </div>
        </div>

        <nav className="space-y-1 px-5 py-2">
          <p className="mb-2 px-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
            Plataforma
          </p>

          <div className="space-y-1">
            {platformModules.map((item) =>
              item.to ? (
                <NavLink key={item.label} to={item.to} className="block">
                  {({ isActive }) => (
                    <div
                      className={`group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span
                        className={`absolute bottom-2 left-0 top-2 w-1 rounded-full transition ${
                          isActive ? "bg-blue-600" : "bg-transparent"
                        }`}
                      />
                      <span
                        className={`h-2.5 w-2.5 rounded-full transition ${
                          isActive ? "bg-blue-600" : "bg-slate-300 group-hover:bg-slate-500"
                        }`}
                      />
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

      <main className="bg-slate-50 p-4 lg:p-6">{children}</main>
    </div>
  );
}

export default PlatformLayout;

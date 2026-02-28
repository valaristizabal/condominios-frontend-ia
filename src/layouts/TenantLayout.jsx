import { NavLink } from "react-router-dom";
import { useState } from "react";

const tenantModules = [
  { to: "/dashboard", label: "Dashboard", enabled: true },
  { to: null, label: "Usuarios", enabled: false },
  { to: null, label: "Visitas", enabled: false },
  { to: null, label: "Vehículos", enabled: false },
  { to: null, label: "Correspondencia", enabled: false },
  { to: null, label: "Aseo", enabled: false },
  { to: null, label: "Emergencias", enabled: false },
  { to: null, label: "Inventario", enabled: false },
  { to: null, label: "Ingreso de personal", enabled: false },
];

function TenantLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="hidden border-r border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          />
          <div className="absolute left-0 top-0 h-full w-72 border-r border-slate-200 bg-white shadow-xl">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="fixed right-4 top-4 z-30 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm lg:hidden"
        onClick={() => setMobileOpen(true)}
      >
        Menú
      </button>

      <div className="lg:pl-72">
        <main className="min-h-screen p-4 pt-16 lg:p-8 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }) {
  return (
    <>
      <div className="border-b border-slate-200 px-6 py-6">
        <h2 className="text-lg font-extrabold text-slate-900">CondoManager</h2>
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Tenant Workspace
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
        <p className="px-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
          Operación
        </p>

        <div className="mt-2 space-y-1">
          {tenantModules.map((item) =>
            item.enabled ? (
              <NavLink key={item.label} to={item.to} className="block" onClick={onNavigate}>
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
    </>
  );
}

export default TenantLayout;


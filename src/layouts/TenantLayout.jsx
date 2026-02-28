import { NavLink, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { ActiveCondominiumContext } from "../context/ActiveCondominiumContext";
import { useAuthContext } from "../context/useAuthContext";

function getSidebarSections(basePath) {
  const resolvePath = (path) => `${basePath}${path}`;

  return [
    {
      title: "Operacion",
      items: [
        { label: "Dashboard", to: resolvePath("/dashboard"), enabled: true },
        { label: "Visitantes", enabled: false },
        { label: "Vehiculos", enabled: false },
        { label: "Correspondencia", enabled: false },
        { label: "Emergencias", enabled: false },
        { label: "Aseo", enabled: false },
        { label: "Inventario", enabled: false },
      ],
    },
    {
      title: "Configuracion",
      items: [{ label: "Ajustes", to: resolvePath("/settings"), enabled: true }],
    },
  ];
}

function TenantLayout({ children }) {
  const { id } = useParams();
  const { user } = useAuthContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isSuperAdmin = user?.role === "super_admin";

  const activeContextValue = useMemo(() => {
    if (isSuperAdmin) {
      const parsed = Number(id);
      return {
        activeCondominiumId: Number.isFinite(parsed) && parsed > 0 ? parsed : null,
        source: "route-param",
      };
    }

    return {
      activeCondominiumId: user?.condominium_id ?? null,
      source: "backend-me",
    };
  }, [id, isSuperAdmin, user?.condominium_id]);

  const basePath = isSuperAdmin && id ? `/condominio/${id}` : "";
  const sidebarSections = useMemo(() => getSidebarSections(basePath), [basePath]);

  return (
    <ActiveCondominiumContext.Provider value={activeContextValue}>
      <div className="min-h-screen bg-slate-50">
        <aside className="hidden border-r border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
          <SidebarContent sections={sidebarSections} />
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menu"
            />
            <div className="absolute left-0 top-0 h-full w-72 border-r border-slate-200 bg-white shadow-xl">
              <SidebarContent sections={sidebarSections} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="fixed right-4 top-4 z-30 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm lg:hidden"
          onClick={() => setMobileOpen(true)}
        >
          Menu
        </button>

        <div className="lg:pl-72">
          <main className="min-h-screen p-4 pt-16 lg:p-8 lg:pt-8">{children}</main>
        </div>
      </div>
    </ActiveCondominiumContext.Provider>
  );
}

function SidebarContent({ sections = [], onNavigate }) {
  return (
    <>
      <div className="border-b border-slate-200 px-6 py-6">
        <h2 className="text-lg font-extrabold text-slate-900">CondoManager</h2>
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Tenant Workspace
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                {section.title}
              </p>

              <div className="mt-2 space-y-1">
                {section.items.map((item) =>
                  item.enabled && item.to ? (
                    <NavLink key={`${section.title}-${item.label}`} to={item.to} className="block" onClick={onNavigate}>
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
                      key={`${section.title}-${item.label}`}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400"
                    >
                      <span>{item.label}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase">
                        Prox.
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}

export default TenantLayout;

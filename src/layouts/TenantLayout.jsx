import { NavLink, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  Sparkles,
  Users,
  Car,
} from "lucide-react";
import { ActiveCondominiumContext } from "../context/ActiveCondominiumContext";
import { useAuthContext } from "../context/useAuthContext";
import { canAccessInventoryOperation, isSuperUser } from "../utils/roles";

function getSidebarSections(basePath, canInventoryOperate) {
  const resolvePath = (path) => `${basePath}${path}`;

  return [
    {
      title: "Operacion",
      items: [
        { label: "Dashboard", to: resolvePath("/dashboard"), enabled: true },
        { label: "Visitantes", to: resolvePath("/visits"), enabled: true },
        { label: "Vehiculos", to: resolvePath("/vehicles"), enabled: true },
        { label: "Correspondencia", to: resolvePath("/correspondence"), enabled: true },
        { label: "Emergencias", to: resolvePath("/emergencies"), enabled: true },
        { label: "Aseo", to: resolvePath("/cleaning"), enabled: true },
        { label: "Inventario", to: resolvePath("/inventory"), enabled: canInventoryOperate },
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
  const isSuperAdmin = isSuperUser(user?.role);

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
  const canInventoryOperate = canAccessInventoryOperation(user);
  const sidebarSections = useMemo(
    () => getSidebarSections(basePath, canInventoryOperate),
    [basePath, canInventoryOperate]
  );

  return (
    <ActiveCondominiumContext.Provider value={activeContextValue}>
      <div className="min-h-screen bg-white">
        <aside className="hidden border-r border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
          <SidebarContent sections={sidebarSections} />
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-[999] lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menu"
            />
            <div className="absolute left-0 top-0 h-full w-[300px] border-r border-slate-200 bg-white shadow-xl">
              <SidebarContent sections={sidebarSections} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="fixed right-4 top-4 z-[998] flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-md lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
        >
          <MenuIcon />
        </button>

        <div className="flex min-h-screen flex-col bg-slate-50 lg:pl-80">
          <main className="flex-1 p-4 pb-24 pt-20 lg:p-6 lg:pb-8 lg:pt-6">{children}</main>
        </div>
      </div>
    </ActiveCondominiumContext.Provider>
  );
}

function SidebarContent({ sections = [], onNavigate }) {
  return (
    <>
      <div className="px-7 pb-5 pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <img src="/image/isotipo1.png" alt="GenAccess" className="h-8 w-auto object-contain" />
          </div>
          <div className="leading-tight">
            <h2 className="text-lg font-extrabold text-slate-900">GenAccess</h2>
            <p className="text-xs font-bold tracking-widest text-slate-400">GESTION INTEGRAL</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) =>
                  item.enabled && item.to ? (
                    <SidebarLink
                      key={`${section.title}-${item.label}`}
                      to={item.to}
                      label={item.label}
                      onClick={onNavigate ? () => onNavigate() : undefined}
                    />
                  ) : (
                    <div
                      key={`${section.title}-${item.label}`}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400"
                    >
                      <span className="flex items-center gap-3">
                        {iconByLabel(item.label)}
                        <span>{item.label}</span>
                      </span>
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

function SidebarLink({ to, label, onClick }) {
  return (
    <NavLink to={to} className="block" onClick={onClick}>
      {({ isActive }) => (
        <div
          className={[
            "group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
            isActive
              ? "bg-blue-50 text-blue-700 shadow-sm"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
          ].join(" ")}
        >
          <span
            className={[
              "absolute bottom-2 left-0 top-2 w-1 rounded-full transition",
              isActive ? "bg-blue-600" : "bg-transparent",
            ].join(" ")}
          />
          <span className={isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}>
            {iconByLabel(label)}
          </span>
          <span className="truncate">{label}</span>
        </div>
      )}
    </NavLink>
  );
}

function MenuIcon() {
  return <Menu className="h-5 w-5" aria-hidden="true" />;
}

function iconByLabel(label) {
  const className = "h-4 w-4";
  const map = {
    Dashboard: <LayoutDashboard className={className} />,
    Visitantes: <Users className={className} />,
    Vehiculos: <Car className={className} />,
    Correspondencia: <ClipboardList className={className} />,
    Emergencias: <Bell className={className} />,
    Aseo: <Sparkles className={className} />,
    Inventario: <Package className={className} />,
    Ajustes: <Settings className={className} />,
  };

  return map[label] ?? <LayoutDashboard className={className} />;
}

export default TenantLayout;

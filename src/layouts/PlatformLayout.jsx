import { NavLink } from "react-router-dom";
import { Building2, LogOut } from "lucide-react";
import { useAuthContext } from "../context/useAuthContext";

const platformModules = [
  { to: "/condominiums", label: "Propiedades" },
];

function PlatformLayout({ children }) {
  const { logout } = useAuthContext();

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[320px_1fr]">
      <aside className="flex flex-col border-r border-slate-200 bg-white">
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

        <nav className="flex-1 space-y-1 px-5 py-2">
          <p className="mb-2 px-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
            Plataforma
          </p>

          <div className="space-y-1">
            {platformModules.map((item) => (
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
                      className={`transition ${
                        isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    >
                      {iconByLabel(item.label)}
                    </span>
                    {item.label}
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={logout}
            className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4 text-slate-400 transition group-hover:text-slate-600" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="bg-slate-50 p-4 lg:p-6">{children}</main>
    </div>
  );
}

function iconByLabel(label) {
  const className = "h-4 w-4";
  const map = {
    Propiedades: <Building2 className={className} />,
  };

  return map[label] ?? <Building2 className={className} />;
}

export default PlatformLayout;

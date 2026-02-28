import { useNavigate, useParams } from "react-router-dom";

function SectionCard({ children, className = "" }) {
  return (
    <section className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

function ActionRow({ icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:bg-slate-50 active:scale-[0.99]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-700">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-900">{title}</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{description}</p>
        </div>
      </div>

      <span className="shrink-0 text-slate-400">{">"}</span>
    </button>
  );
}

function SettingsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const basePath = id ? `/condominio/${id}` : "";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Configuracion</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Ajustes</h1>
          <p className="mt-1 max-w-[52ch] text-sm text-slate-500">
            Administra la configuracion operativa del condominio y accede a los modulos de gestion.
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xs font-extrabold text-slate-700 shadow-sm">
          CFG
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <SectionCard>
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Gestion del sistema
            </p>

            <div className="mt-4 space-y-3">
              <ActionRow
                icon="OP"
                title="Operativos"
                description="Gestiona personal operativo y su configuracion laboral"
                onClick={() => navigate(`${basePath}/settings/operatives`)}
              />

              <ActionRow
                icon="RS"
                title="Residentes"
                description="Gestiona residentes, estados y relacion con apartamentos"
                onClick={() => navigate(`${basePath}/settings/residents`)}
              />

              <ActionRow
                icon="AP"
                title="Apartamentos"
                description="Administra unidades y apartamentos del condominio"
                onClick={() => navigate(`${basePath}/settings/apartments`)}
              />

              <ActionRow
                icon="AS"
                title="Aseo"
                description="Configura zonas de aseo, checklists y seguimiento"
                onClick={() => navigate(`${basePath}/settings/cleaning`)}
              />
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5 lg:col-span-4">
          <SectionCard>
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Alcance del modulo
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              Este espacio centraliza la configuracion tenant sin mezclar operaciones diarias.
            </p>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-extrabold text-slate-700">Nota</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Cada seccion conserva su propio dominio y flujo de backend.
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

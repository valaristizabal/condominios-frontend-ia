import { useNavigate, useParams } from "react-router-dom";

function Card({ children, className = "" }) {
  return (
    <div className={["rounded-3xl border border-slate-200 bg-white p-5 shadow-sm", className].join(" ")}>
      {children}
    </div>
  );
}

function PageTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-[52ch] text-sm text-slate-500">{subtitle}</p> : null}
      </div>

      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm">
        <GearIcon />
      </div>
    </div>
  );
}

function ItemRow({ title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:bg-slate-50 active:scale-[0.99]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-700">
          <span className="text-xs font-extrabold">{title.slice(0, 2).toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-900">{title}</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{description}</p>
        </div>
      </div>

      <ChevronRightIcon />
    </button>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const basePath = id ? `/condominio/${id}` : "";

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <PageTitle
          eyebrow="Configuracion"
          title="Ajustes"
          subtitle="Administra la parametrizacion del condominio: unidades, apartamentos, residentes, operativos y tipos de vehiculos."
        />

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            <Card>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">1. Gestion del sistema</p>

              <div className="mt-4 space-y-3">
                <ItemRow
                  title="Operativos"
                  description="Gestiona personal operativo y su configuracion laboral"
                  onClick={() => navigate(`${basePath}/settings/operatives`)}
                />
                <ItemRow
                  title="Residentes"
                  description="Gestiona residentes, estados y relacion con apartamentos"
                  onClick={() => navigate(`${basePath}/settings/residents`)}
                />
                <ItemRow
                  title="Tipos de unidad"
                  description="Configura los tipos de unidad disponibles en el condominio"
                  onClick={() => navigate(`${basePath}/settings/unit-types`)}
                />
                <ItemRow
                  title="Apartamentos"
                  description="Administra unidades y apartamentos del condominio"
                  onClick={() => navigate(`${basePath}/settings/apartments`)}
                />
                <ItemRow
                  title="Tipos de vehiculos"
                  description="Configura los tipos de vehiculo permitidos en el condominio"
                  onClick={() => navigate(`${basePath}/settings/vehicle-types`)}
                />
                <ItemRow
                  title="Tipos de emergencia"
                  description="Configura tipos de emergencia y su nivel de criticidad"
                  onClick={() => navigate(`${basePath}/settings/emergency-types`)}
                />
                <ItemRow
                  title="Aseo"
                  description="Configura zonas de aseo, checklists y seguimiento"
                  onClick={() => navigate(`${basePath}/settings/cleaning`)}
                />
              </div>
            </Card>
          </div>

          <div className="space-y-5 lg:col-span-4">
            <Card>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Rol restringido</p>
              <p className="mt-1 text-sm font-extrabold text-slate-900">Administrador de Condominios</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Acceso a parametrizacion y mantenimiento del sistema en condominio activo.
              </p>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-extrabold text-slate-700">Recomendacion</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Mantener la gestion por contexto tenant activo y evitar datos cruzados entre condominios.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400" aria-hidden="true">
      <path fill="currentColor" d="m9.29 6.71 1.42-1.42L17.41 12l-6.7 6.71-1.42-1.42L14.59 12 9.29 6.71Z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M10.2 2h3.6l.5 2.24a8 8 0 0 1 1.66.96l2.08-.85 1.8 3.12-1.58 1.55c.12.39.2.79.25 1.2l2.14.79v3.6l-2.14.79a7.4 7.4 0 0 1-.25 1.2l1.58 1.55-1.8 3.12-2.08-.85a8 8 0 0 1-1.66.96L13.8 22h-3.6l-.5-2.24a8 8 0 0 1-1.66-.96l-2.08.85-1.8-3.12 1.58-1.55a7.4 7.4 0 0 1-.25-1.2L3.35 13v-3.6l2.14-.79c.05-.41.13-.81.25-1.2L4.16 5.86l1.8-3.12 2.08.85a8 8 0 0 1 1.66-.96L10.2 2Zm1.8 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
    </svg>
  );
}


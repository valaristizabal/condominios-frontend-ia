import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthContext } from "../../../context/useAuthContext";
import { useActiveCondominium } from "../../../context/useActiveCondominium";
import apiClient from "../../../services/apiClient";
import { canAccessInventorySettings, canManageUserPermissions } from "../../../utils/roles";
import {
  exportDailyMinutaWorkbook,
  exportMonthlyMinutaWorkbook,
  monthDates,
} from "./minutaExcel";

function Card({ children, className = "" }) {
  return (
    <div className={["rounded-3xl border border-slate-200 bg-white p-5 shadow-sm", className].join(" ")}>
      {children}
    </div>
  );
}

function PageTitle({ eyebrow, title }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900">{title}</h1>
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
  const { activeCondominiumId } = useActiveCondominium();
  const { user } = useAuthContext();
  const basePath = id ? `/condominio/${id}` : "";
  const canSeeInventorySettings = canAccessInventorySettings(user);
  const canSeeUsersPermissions = canManageUserPermissions(user);
  const [downloading, setDownloading] = useState("");
  const [downloadError, setDownloadError] = useState("");

  const resolvedCondominiumId = useMemo(() => {
    const contextId = Number(activeCondominiumId);
    if (Number.isFinite(contextId) && contextId > 0) return contextId;

    const routeId = Number(id);
    if (Number.isFinite(routeId) && routeId > 0) return routeId;

    return null;
  }, [activeCondominiumId, id]);

  const requestConfig = useMemo(
    () =>
      resolvedCondominiumId
        ? {
            headers: {
              "X-Active-Condominium-Id": String(resolvedCondominiumId),
            },
          }
        : undefined,
    [resolvedCondominiumId]
  );

  const downloadDailyLog = async () => {
    if (!resolvedCondominiumId) return;

    setDownloadError("");
    setDownloading("daily");

    try {
      const today = new Date().toISOString().slice(0, 10);
      const response = await apiClient.get(`/reports/daily-log?date=${today}`, requestConfig);
      await exportDailyMinutaWorkbook({
        payload: response.data,
        fileName: `minuta-diaria-${today}.xlsx`,
        condominiumLabel: `Propiedad #${resolvedCondominiumId}`,
      });
    } catch (err) {
      setDownloadError(normalizeApiError(err, "No fue posible descargar la minuta diaria."));
    } finally {
      setDownloading("");
    }
  };

  const downloadMonthlySummary = async () => {
    if (!resolvedCondominiumId) return;

    setDownloadError("");
    setDownloading("monthly");

    try {
      const month = new Date().toISOString().slice(0, 7);
      const summaryResponse = await apiClient.get(`/reports/monthly-summary?month=${month}`, requestConfig);

      const dates = monthDates(month);
      const dailyLogs = await Promise.all(
        dates.map(async (date) => {
          const dailyResponse = await apiClient.get(`/reports/daily-log?date=${date}`, requestConfig);
          return dailyResponse.data;
        })
      );

      await exportMonthlyMinutaWorkbook({
        month,
        monthlySummary: summaryResponse.data,
        dailyLogs,
        fileName: `minuta-mensual-${month}.xlsx`,
        condominiumLabel: `Propiedad #${resolvedCondominiumId}`,
      });
    } catch (err) {
      setDownloadError(normalizeApiError(err, "No fue posible descargar la minuta mensual."));
    } finally {
      setDownloading("");
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <PageTitle eyebrow="Configuracion" title="Ajustes" />

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            <Card>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">1. Gestion del sistema</p>

              <div className="mt-4 space-y-3">
                <p className="px-1 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                  Configuracion inicial
                </p>
                <ItemRow
                  title="Tipos de unidad"
                  description="Configura los tipos de unidad disponibles en la propiedad"
                  onClick={() => navigate(`${basePath}/settings/unit-types`)}
                />
                <ItemRow
                  title="Inmuebles / Unidades"
                  description="Administra unidades y inmuebles de la propiedad"
                  onClick={() => navigate(`${basePath}/settings/apartments`)}
                />
                <ItemRow
                  title="Residentes"
                  description="Gestiona residentes, estados y relacion con inmuebles"
                  onClick={() => navigate(`${basePath}/settings/residents`)}
                />
                <ItemRow
                  title="Operativos"
                  description="Gestiona personal operativo y su configuracion laboral"
                  onClick={() => navigate(`${basePath}/settings/operatives`)}
                />
                {canSeeUsersPermissions ? (
                  <ItemRow
                    title="Usuarios y permisos"
                    description="Configura permisos por modulo para usuarios del condominio"
                    onClick={() => navigate(`${basePath}/settings/users`)}
                  />
                ) : null}
                <ItemRow
                  title="Tipos de vehiculos"
                  description="Configura los tipos de vehiculo permitidos en la propiedad"
                  onClick={() => navigate(`${basePath}/settings/vehicle-types`)}
                />

                <p className="px-1 pt-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                  Seguridad
                </p>
                <ItemRow
                  title="Tipos de emergencia"
                  description="Configura tipos de emergencia y su nivel de criticidad"
                  onClick={() => navigate(`${basePath}/settings/emergency-types`)}
                />
                <ItemRow
                  title="Emergencias"
                  description="Configura contactos y numeros de emergencia por propiedad"
                  onClick={() => navigate(`${basePath}/settings/emergency-contacts`)}
                />

                <p className="px-1 pt-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                  Operacion interna
                </p>
                <ItemRow
                  title="Aseo"
                  description="Configura zonas de aseo, checklists y seguimiento"
                  onClick={() => navigate(`${basePath}/settings/cleaning`)}
                />
                {canSeeInventorySettings ? (
                  <ItemRow
                    title="Inventario"
                    description="Gestiona inventarios y categorias de productos"
                    onClick={() => navigate(`${basePath}/settings/inventory`)}
                  />
                ) : null}
              </div>
            </Card>
          </div>

          <div className="space-y-5 lg:col-span-4">
            <Card>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Rol restringido</p>
              <p className="mt-1 text-sm font-extrabold text-slate-900">Administrador de Propiedades</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Acceso a parametrizacion y mantenimiento del sistema en propiedad activa.
              </p>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-extrabold text-slate-700">Recomendacion</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Mantener la gestion por contexto tenant activo y evitar datos cruzados entre propiedades.
                </p>
              </div>
            </Card>

            <Card>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Descargas</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Genera minutas automaticas de la propiedad activa.
              </p>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={downloadDailyLog}
                  disabled={!resolvedCondominiumId || downloading === "daily"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <DownloadIcon />
                  {downloading === "daily" ? "Descargando..." : "Descargar minuta diaria"}
                </button>

                <button
                  type="button"
                  onClick={downloadMonthlySummary}
                  disabled={!resolvedCondominiumId || downloading === "monthly"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <DownloadIcon />
                  {downloading === "monthly" ? "Descargando..." : "Descargar minuta mensual"}
                </button>
              </div>

              {downloadError ? (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {downloadError}
                </p>
              ) : null}
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

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.3 1.4 1.42-4.7 4.7-4.7-4.7 1.4-1.42 2.3 2.3V4a1 1 0 0 1 1-1Zm-7 14h14v2H5v-2Z" />
    </svg>
  );
}

function normalizeApiError(err, fallbackMessage) {
  const responseData = err?.response?.data;
  const errors = responseData?.errors;

  if (errors && typeof errors === "object") {
    const firstFieldErrors = Object.values(errors).find(
      (fieldErrors) => Array.isArray(fieldErrors) && fieldErrors.length > 0
    );
    if (firstFieldErrors) {
      return String(firstFieldErrors[0]);
    }
  }

  return responseData?.message || err?.message || fallbackMessage;
}


import ExcelJS from "exceljs";

const MODULE_ORDER = [
  "visits",
  "employee_entries",
  "vehicle_entries",
  "correspondences",
  "cleaning_records",
  "emergencies",
];

const MODULE_LABELS = {
  visits: "Visitas del día",
  employee_entries: "Ingresos de personal",
  vehicle_entries: "Ingresos vehiculares",
  correspondences: "Correspondencia recibida",
  cleaning_records: "Registros de aseo",
  emergencies: "Emergencias reportadas",
};

const MODULE_SHEETS = {
  visits: {
    name: "VISITAS",
    columns: [
      { header: "Fecha", value: (row) => formatDate(row?.created_at || row?.check_in_at) },
      { header: "Nombre visitante", value: (row) => row?.full_name || "-" },
      { header: "Documento", value: (row) => row?.document_number || "-" },
      { header: "Inmueble", value: (row) => humanizeApartment(row) },
      { header: "Hora ingreso", value: (row) => formatTime(row?.check_in_at) },
      { header: "Hora salida", value: (row) => formatTime(row?.check_out_at) },
      { header: "Registrado por", value: (row) => humanizeUser(row?.registered_by || row?.registeredBy, row?.registered_by_id, "Usuario") },
      { header: "Estado", value: (row) => humanizeStatus(row?.status) },
    ],
  },
  employee_entries: {
    name: "PERSONAL",
    columns: [
      { header: "Fecha", value: (row) => formatDate(row?.check_in_at || row?.created_at) },
      { header: "Operario", value: (row) => humanizeOperative(row) },
      { header: "Cargo", value: (row) => humanizePosition(row?.position) },
      { header: "Hora ingreso", value: (row) => formatTime(row?.check_in_at) },
      { header: "Hora salida", value: (row) => formatTime(row?.check_out_at) },
      { header: "Estado", value: (row) => humanizeStatus(row?.status) },
      { header: "Observaciones", value: (row) => row?.observations || row?.notes || "-" },
    ],
  },
  vehicle_entries: {
    name: "VEHICULOS",
    columns: [
      { header: "Fecha", value: (row) => formatDate(row?.check_in_at || row?.created_at) },
      { header: "Vehículo", value: (row) => humanizeVehicle(row) },
      { header: "Hora ingreso", value: (row) => formatTime(row?.check_in_at) },
      { header: "Hora salida", value: (row) => formatTime(row?.check_out_at) },
      { header: "Estado", value: (row) => humanizeStatus(row?.status) },
      { header: "Observaciones", value: (row) => row?.observations || row?.notes || "-" },
    ],
  },
  correspondences: {
    name: "CORRESPONDENCIA",
    columns: [
      { header: "Fecha", value: (row) => formatDate(row?.created_at) },
      { header: "Hora", value: (row) => formatTime(row?.created_at) },
      { header: "Empresa", value: (row) => row?.courier_company || "-" },
      { header: "Tipo paquete", value: (row) => humanizePackageType(row?.package_type) },
      { header: "Estado", value: (row) => humanizeStatus(row?.status) },
      { header: "Recibido por", value: (row) => humanizeUser(row?.received_by || row?.receivedBy, row?.received_by_id, "Usuario") },
      { header: "Entregado por", value: (row) => humanizeUser(row?.delivered_by || row?.deliveredBy, row?.delivered_by_id, "Usuario") },
      { header: "Fecha entrega", value: (row) => formatDate(row?.delivered_at) },
      { header: "Hora entrega", value: (row) => formatTime(row?.delivered_at) },
    ],
  },
  cleaning_records: {
    name: "ASEO",
    columns: [
      { header: "Fecha", value: (row) => formatDate(row?.cleaning_date) },
      { header: "Área", value: (row) => humanizeCleaningArea(row) },
      { header: "Operario", value: (row) => humanizeOperative(row) },
      { header: "Estado", value: (row) => humanizeStatus(row?.status) },
      { header: "Hora inicio", value: (row) => formatTime(row?.started_at || row?.created_at) },
      { header: "Hora finalización", value: (row) => formatTime(row?.finished_at) },
      { header: "Observaciones", value: (row) => row?.observations || row?.notes || "-" },
      { header: "Registrado por", value: (row) => humanizeUser(row?.registered_by || row?.registeredBy, row?.registered_by_id, "Usuario") },
    ],
  },
  emergencies: {
    name: "EMERGENCIAS",
    columns: [
      { header: "Fecha", value: (row) => formatDate(row?.event_date || row?.created_at) },
      { header: "Hora", value: (row) => formatTime(row?.event_date || row?.created_at) },
      { header: "Tipo de emergencia", value: (row) => humanizeEmergencyType(row) },
      { header: "Nivel", value: (row) => humanizeLevel(row?.level) },
      { header: "Ubicación", value: (row) => row?.event_location || row?.location || "-" },
      { header: "Descripción", value: (row) => row?.description || "-" },
      { header: "Estado", value: (row) => humanizeStatus(row?.status) },
    ],
  },
};
const BORDER_ALL = {
  top: { style: "thin", color: { argb: "FFD1D5DB" } },
  left: { style: "thin", color: { argb: "FFD1D5DB" } },
  bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
  right: { style: "thin", color: { argb: "FFD1D5DB" } },
};

export async function exportDailyMinutaWorkbook({ payload, fileName, condominiumLabel }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Propiedades IA";
  workbook.created = new Date();

  const date = String(payload?.date || "");
  const counts = moduleCounts(payload);

  addDailyCoverSheet(workbook, {
    condominiumLabel,
    date,
    generatedAt: new Date(),
    counts,
  });

  addSummarySheet(workbook, "RESUMEN", `Resumen diario ${date}`, counts);

  MODULE_ORDER.forEach((moduleKey) => {
    addDetailSheet(workbook, moduleKey, payload?.[moduleKey] || []);
  });

  await downloadWorkbook(workbook, fileName);
}

export async function exportMonthlyMinutaWorkbook({
  month,
  monthlySummary,
  dailyLogs = [],
  fileName,
  condominiumLabel,
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Propiedades IA";
  workbook.created = new Date();

  const details = aggregateDailyLogs(dailyLogs);
  const counts = {
    visits: Number(monthlySummary?.visits_total || 0),
    employee_entries: Number(monthlySummary?.employee_entries_total || 0),
    vehicle_entries: Number(monthlySummary?.vehicle_entries_total || 0),
    correspondences: Number(monthlySummary?.correspondences_total || 0),
    cleaning_records: Number(monthlySummary?.cleaning_records_total || 0),
    emergencies: Number(monthlySummary?.emergencies_total || 0),
  };

  addMonthlyCoverSheet(workbook, {
    condominiumLabel,
    month,
    generatedAt: new Date(),
    counts,
  });

  addSummarySheet(workbook, "RESUMEN", `Resumen mensual ${month}`, counts);

  MODULE_ORDER.forEach((moduleKey) => {
    addDetailSheet(workbook, moduleKey, details[moduleKey] || []);
  });

  await downloadWorkbook(workbook, fileName);
}

export function monthDates(month) {
  const safeMonth = String(month || "");
  if (!/^\d{4}-\d{2}$/.test(safeMonth)) return [];

  const [year, monthNumber] = safeMonth.split("-").map(Number);
  const end = new Date(year, monthNumber, 0);
  const dates = [];

  for (let day = 1; day <= end.getDate(); day += 1) {
    const date = new Date(year, monthNumber - 1, day);
    dates.push(toDateInput(date));
  }

  return dates;
}

function addDailyCoverSheet(workbook, { condominiumLabel, date, generatedAt, counts }) {
  const sheet = workbook.addWorksheet("MINUTA");

  sheet.columns = [{ width: 30 }, { width: 38 }, { width: 28 }, { width: 22 }];
  sheet.mergeCells("A1:D1");
  sheet.getCell("A1").value = "MINUTA OPERATIVA DE LA PROPIEDAD";
  sheet.getCell("A1").font = { bold: true, size: 18, color: { argb: "FF0F172A" } };
  sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 34;

  sheet.addRow([]);
  sheet.addRow(["Propiedad:", condominiumLabel || "-"]);
  sheet.addRow(["Fecha:", formatDate(date)]);
  sheet.addRow(["Generado el:", formatDateTime(generatedAt)]);
  sheet.addRow([]);

  const header = sheet.addRow(["Indicador", "Cantidad"]);
  styleHeaderRow(header);
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
  });

  MODULE_ORDER.forEach((moduleKey) => {
    const row = sheet.addRow([MODULE_LABELS[moduleKey], counts[moduleKey] || 0]);
    styleDataRow(row);
  });

  sheet.views = [{ state: "frozen", ySplit: 7 }];
}

function addMonthlyCoverSheet(workbook, { condominiumLabel, month, generatedAt, counts }) {
  const sheet = workbook.addWorksheet("RESUMEN MENSUAL");

  sheet.columns = [{ width: 32 }, { width: 34 }, { width: 26 }, { width: 22 }];
  sheet.mergeCells("A1:D1");
  sheet.getCell("A1").value = "MINUTA MENSUAL DE LA PROPIEDAD";
  sheet.getCell("A1").font = { bold: true, size: 18, color: { argb: "FF0F172A" } };
  sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 34;

  sheet.addRow([]);
  sheet.addRow(["Propiedad:", condominiumLabel || "-"]);
  sheet.addRow(["Mes:", month || "-"]);
  sheet.addRow(["Generado el:", formatDateTime(generatedAt)]);
  sheet.addRow([]);

  const header = sheet.addRow(["Indicador", "Total"]);
  styleHeaderRow(header);
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
  });

  MODULE_ORDER.forEach((moduleKey) => {
    const row = sheet.addRow([MODULE_LABELS[moduleKey], counts[moduleKey] || 0]);
    styleDataRow(row);
  });

  sheet.views = [{ state: "frozen", ySplit: 7 }];
}

function addSummarySheet(workbook, sheetName, title, counts) {
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = [{ width: 34 }, { width: 14 }];
  sheet.mergeCells("A1:B1");
  sheet.getCell("A1").value = title;
  sheet.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF0F172A" } };
  sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 26;
  sheet.addRow([]);

  const header = sheet.addRow(["Módulo", "Cantidad"]);
  styleHeaderRow(header);

  MODULE_ORDER.forEach((moduleKey) => {
    const count = Number(counts[moduleKey] || 0);
    const row = sheet.addRow([MODULE_LABELS[moduleKey], count]);
    styleDataRow(row);
  });

  sheet.views = [{ state: "frozen", ySplit: 3 }];
  sheet.autoFilter = "A3:B3";
}
function addDetailSheet(workbook, moduleKey, rows) {
  const config = MODULE_SHEETS[moduleKey];
  if (!config) return;

  const sheet = workbook.addWorksheet(config.name);
  const columns = config.columns || [];

  sheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.header,
    width: Math.max(14, Math.min(40, column.header.length + 4)),
  }));

  const headerRow = sheet.getRow(1);
  styleHeaderRow(headerRow, {
    fillColor: "FFDBEAFE",
    fontColor: "FF1E3A8A",
  });

  (Array.isArray(rows) ? rows : []).forEach((sourceRow) => {
    const values = columns.map((column) => formatCellValue(column.value(sourceRow)));
    const row = sheet.addRow(values);
    styleDataRow(row);
  });

  const rowCount = Math.max(1, sheet.rowCount);
  const lastCol = colLetter(columns.length || 1);
  sheet.autoFilter = `A1:${lastCol}1`;
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  autoFitColumns(sheet, columns.length || 1, 14, 44);

  for (let rowIndex = 1; rowIndex <= rowCount; rowIndex += 1) {
    for (let col = 1; col <= (columns.length || 1); col += 1) {
      const cell = sheet.getRow(rowIndex).getCell(col);
      if (!cell.border) cell.border = BORDER_ALL;
    }
  }
}

function styleHeaderRow(row, options = {}) {
  const fillColor = options.fillColor || "FFDBEAFE";
  const fontColor = options.fontColor || "FF1E3A8A";

  row.height = 22;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: fontColor } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: fillColor },
    };
    cell.border = BORDER_ALL;
  });
}

function styleDataRow(row) {
  row.eachCell((cell) => {
    cell.alignment = { vertical: "middle" };
    cell.border = BORDER_ALL;
  });
}

function autoFitColumns(sheet, columnCount, min = 12, max = 45) {
  for (let col = 1; col <= columnCount; col += 1) {
    let longest = min;
    sheet.eachRow((row) => {
      const value = row.getCell(col)?.value;
      const length = String(value ?? "").length;
      if (length > longest) longest = length;
    });
    sheet.getColumn(col).width = Math.max(min, Math.min(max, longest + 2));
  }
}

function moduleCounts(payload) {
  return {
    visits: countRows(payload?.visits),
    employee_entries: countRows(payload?.employee_entries),
    vehicle_entries: countRows(payload?.vehicle_entries),
    correspondences: countRows(payload?.correspondences),
    cleaning_records: countRows(payload?.cleaning_records),
    emergencies: countRows(payload?.emergencies),
  };
}

function aggregateDailyLogs(dailyLogs) {
  const base = {
    visits: [],
    employee_entries: [],
    vehicle_entries: [],
    correspondences: [],
    cleaning_records: [],
    emergencies: [],
  };

  (Array.isArray(dailyLogs) ? dailyLogs : []).forEach((log) => {
    MODULE_ORDER.forEach((key) => {
      if (Array.isArray(log?.[key])) {
        base[key].push(...log[key]);
      }
    });
  });

  return base;
}

function countRows(rows) {
  return Array.isArray(rows) ? rows.length : 0;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("es-CO");
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function humanizeApartment(row) {
  const apartment = row?.apartment;
  const unitTypeName = apartment?.unit_type?.name || apartment?.unitType?.name || row?.unit_type_name;
  if (apartment?.number) {
    const location = apartment?.tower ? `Torre ${apartment.tower} - ${apartment.number}` : String(apartment.number);
    return unitTypeName ? `${unitTypeName} - ${location}` : location;
  }
  if (row?.apartment_number) {
    return unitTypeName ? `${unitTypeName} - ${row.apartment_number}` : row.apartment_number;
  }
  return "No disponible";
}
function humanizeOperative(row) {
  const operative = row?.operative;
  const fullName = operative?.user?.full_name || operative?.full_name || row?.full_name || row?.employee_name;
  if (fullName) return fullName;
  return labelFromId("Operario", row?.operative_id);
}

function humanizeVehicle(row) {
  const vehicle = row?.vehicle;
  if (vehicle?.plate) return `Placa ${vehicle.plate}`;
  if (row?.plate) return `Placa ${row.plate}`;
  return labelFromId("Vehículo", row?.vehicle_id);
}

function humanizeCleaningArea(row) {
  const area = row?.cleaningArea || row?.area;
  return area?.name || row?.cleaning_area_name || "No disponible";
}
function humanizeEmergencyType(row) {
  const type = row?.emergencyType || row?.type;
  return type?.name || row?.emergency_type_name || "No disponible";
}

function humanizeUser(user, fallbackId, label = "Usuario") {
  const fullName = user?.full_name || user?.name;
  if (fullName) return fullName;
  return "No disponible";
}
function humanizePosition(value) {
  return humanizeSimpleValue(value) || "-";
}

function humanizePackageType(value) {
  return humanizeSimpleValue(value) || "-";
}

function humanizeLevel(value) {
  return humanizeSimpleValue(value) || "-";
}

function humanizeStatus(value) {
  return humanizeSimpleValue(value) || "-";
}

function humanizeSimpleValue(value) {
  if (value === null || value === undefined || value === "") return "";
  const raw = String(value).trim();
  if (!raw) return "";

  const normalized = raw.toLowerCase();
  const labels = {
    inside: "Dentro",
    outside: "Fuera",
    active: "Activo",
    inactive: "Inactivo",
    pending: "Pendiente",
    delivered: "Entregado",
    received_by_security: "Recibido por seguridad",
    completed: "Completado",
    cancelled: "Cancelado",
    canceled: "Cancelado",
    entry: "Entrada",
    exit: "Salida",
    owner: "Dueño",
    resident: "Residente",
    visitor: "Visitante",
    check_in: "Ingreso",
    check_out: "Salida",
    low: "Bajo",
    medium: "Medio",
    high: "Alto",
    critical: "Crítico",
    asset: "Activo fijo",
    consumable: "Consumible",
    cleaning: "Aseo",
    security: "Seguridad",
  };

  if (labels[normalized]) return labels[normalized];
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
function labelFromId(label, id) {
  if (!id) return "-";
  return `${label} #${id}`;
}

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function colLetter(index) {
  let n = Math.max(1, Number(index));
  let result = "";
  while (n > 0) {
    const mod = (n - 1) % 26;
    result = String.fromCharCode(65 + mod) + result;
    n = Math.floor((n - mod) / 26);
  }
  return result;
}

function formatCellValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "SI" : "NO";
  if (typeof value === "string") return humanizeSimpleValue(value) || "-";
  return value;
}
async function downloadWorkbook(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}


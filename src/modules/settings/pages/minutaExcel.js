import ExcelJS from "exceljs";

const MODULE_ORDER = [
  "visits",
  "employee_entries",
  "vehicle_entries",
  "correspondences",
  "cleaning_records",
  "inventory_movements",
  "emergencies",
];

const MODULE_LABELS = {
  visits: "Visitas del dia",
  employee_entries: "Ingresos de personal",
  vehicle_entries: "Ingresos vehiculares",
  correspondences: "Correspondencia recibida",
  cleaning_records: "Registros de aseo",
  inventory_movements: "Movimientos de inventario",
  emergencies: "Emergencias reportadas",
};

const MODULE_SHEETS = {
  visits: {
    name: "VISITAS",
    columns: [
      { header: "Fecha", value: (row) => formatDateTime(row?.created_at || row?.check_in_at) },
      { header: "Nombre visitante", value: (row) => row?.full_name || "-" },
      { header: "Documento", value: (row) => row?.document_number || "-" },
      { header: "Apartamento", value: (row) => row?.apartment_id || "-" },
      { header: "Hora ingreso", value: (row) => formatDateTime(row?.check_in_at) },
      { header: "Hora salida", value: (row) => formatDateTime(row?.check_out_at) },
      { header: "Registrado por", value: (row) => row?.registered_by_id || "-" },
      { header: "Estado", value: (row) => row?.status || "-" },
    ],
  },
  employee_entries: {
    name: "PERSONAL",
    columns: [
      { header: "Fecha", value: (row) => formatDateTime(row?.check_in_at || row?.created_at) },
      { header: "Operario ID", value: (row) => row?.operative_id || "-" },
      { header: "Cargo", value: (row) => row?.position || "-" },
      { header: "Hora ingreso", value: (row) => formatDateTime(row?.check_in_at) },
      { header: "Hora salida", value: (row) => formatDateTime(row?.check_out_at) },
      { header: "Estado", value: (row) => row?.status || "-" },
      { header: "Observaciones", value: (row) => row?.observations || "-" },
    ],
  },
  vehicle_entries: {
    name: "VEHICULOS",
    columns: [
      { header: "Fecha", value: (row) => formatDateTime(row?.check_in_at || row?.created_at) },
      { header: "Vehiculo ID", value: (row) => row?.vehicle_id || "-" },
      { header: "Hora ingreso", value: (row) => formatDateTime(row?.check_in_at) },
      { header: "Hora salida", value: (row) => formatDateTime(row?.check_out_at) },
      { header: "Estado", value: (row) => row?.status || "-" },
      { header: "Observaciones", value: (row) => row?.observations || "-" },
    ],
  },
  correspondences: {
    name: "CORRESPONDENCIA",
    columns: [
      { header: "Fecha", value: (row) => formatDateTime(row?.created_at) },
      { header: "Empresa", value: (row) => row?.courier_company || "-" },
      { header: "Tipo paquete", value: (row) => row?.package_type || "-" },
      { header: "Estado", value: (row) => row?.status || "-" },
      { header: "Recibido por", value: (row) => row?.received_by_id || "-" },
      { header: "Entregado por", value: (row) => row?.delivered_by_id || "-" },
      { header: "Fecha entrega", value: (row) => formatDateTime(row?.delivered_at) },
    ],
  },
  cleaning_records: {
    name: "ASEO",
    columns: [
      { header: "Fecha", value: (row) => formatDate(row?.cleaning_date) },
      { header: "Area", value: (row) => row?.cleaning_area_id || "-" },
      { header: "Operario", value: (row) => row?.operative_id || "-" },
      { header: "Estado", value: (row) => row?.status || "-" },
      { header: "Observaciones", value: (row) => row?.observations || "-" },
      { header: "Registrado por", value: (row) => row?.registered_by_id || "-" },
    ],
  },
  inventory_movements: {
    name: "INVENTARIO",
    columns: [
      { header: "Fecha", value: (row) => formatDate(row?.movement_date || row?.created_at) },
      { header: "Producto ID", value: (row) => row?.product_id || "-" },
      { header: "Tipo", value: (row) => row?.type || "-" },
      { header: "Cantidad", value: (row) => row?.quantity ?? "-" },
      { header: "Registrado por", value: (row) => row?.registered_by_id || "-" },
      { header: "Observaciones", value: (row) => row?.observations || "-" },
    ],
  },
  emergencies: {
    name: "EMERGENCIAS",
    columns: [
      { header: "Fecha", value: (row) => formatDateTime(row?.event_date || row?.created_at) },
      { header: "Tipo de emergencia", value: (row) => row?.emergency_type_id || "-" },
      { header: "Nivel", value: (row) => row?.level || "-" },
      { header: "Ubicacion", value: (row) => row?.event_location || "-" },
      { header: "Descripcion", value: (row) => row?.description || "-" },
      { header: "Estado", value: (row) => row?.status || "-" },
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
    inventory_movements: Number(monthlySummary?.inventory_movements_total || 0),
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
  sheet.getCell("A1").value = "MINUTA OPERATIVA DEL CONDOMINIO";
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
  sheet.getCell("A1").value = "MINUTA MENSUAL DEL CONDOMINIO";
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
  sheet.columns = [{ width: 34 }, { width: 14 }, { width: 42 }];
  sheet.mergeCells("A1:C1");
  sheet.getCell("A1").value = title;
  sheet.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF0F172A" } };
  sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 26;
  sheet.addRow([]);

  const header = sheet.addRow(["Modulo", "Cantidad", "Grafico de barras"]);
  styleHeaderRow(header);

  const max = Math.max(...MODULE_ORDER.map((key) => Number(counts[key] || 0)), 1);

  MODULE_ORDER.forEach((moduleKey) => {
    const count = Number(counts[moduleKey] || 0);
    const bars = "â–ˆ".repeat(Math.max(0, Math.round((count / max) * 30)));
    const row = sheet.addRow([MODULE_LABELS[moduleKey], count, bars]);
    styleDataRow(row);
  });

  sheet.views = [{ state: "frozen", ySplit: 3 }];
  sheet.autoFilter = "A3:C3";
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
    inventory_movements: countRows(payload?.inventory_movements),
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
    inventory_movements: [],
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

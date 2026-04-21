import ExcelJS from "exceljs";

const WORKBOOK_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function exportRevenuePortfolioWorkbook({
  portfolioRows = [],
  collectionRows = [],
  fileName,
  period,
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "GenAccess";
  workbook.created = new Date();

  buildPortfolioSheet(workbook, portfolioRows, period);
  buildCollectionsSheet(workbook, collectionRows, period);

  await downloadWorkbook(workbook, fileName);
}

function buildPortfolioSheet(workbook, rows, period) {
  const sheet = workbook.addWorksheet("Estado de cartera");
  sheet.columns = [
    { header: "Unidad / Apto", key: "unit", width: 18 },
    { header: "Propietario", key: "owner", width: 30 },
    { header: "Dia de corte", key: "cutoffDay", width: 14 },
    { header: "Valor corte", key: "cutoffValue", width: 18 },
    { header: "Saldo pendiente", key: "pendingBalance", width: 18 },
    { header: "Saldo a favor", key: "creditBalance", width: 18 },
    { header: "Fecha de vencimiento", key: "dueDate", width: 22 },
    { header: "Dias en mora", key: "daysOverdue", width: 16 },
    { header: "Estado", key: "status", width: 18 },
  ];

  decorateSheetHeader(sheet, `Estado de cartera - ${period || "-"}`, 9);

  if (!rows.length) {
    const emptyRow = sheet.addRow({
      unit: "Sin datos disponibles",
      owner: "-",
      cutoffDay: "-",
      cutoffValue: "-",
      pendingBalance: "-",
      creditBalance: "-",
      dueDate: "-",
      daysOverdue: "-",
      status: "-",
    });
    styleDataRow(emptyRow);
  }

  rows.forEach((row) => {
    const dataRow = sheet.addRow({
      unit: row?.unit || "-",
      owner: row?.owner || "-",
      cutoffDay: formatCutoffDay(row?.dueDate),
      cutoffValue: row?.cutoffValueLabel || "$0",
      pendingBalance: row?.pendingBalanceLabel || row?.debtLabel || "$0",
      creditBalance: row?.creditBalanceLabel || "$0",
      dueDate: row?.dueDateLabel || "-",
      daysOverdue: row?.daysOverdueLabel || "-",
      status: row?.status || "-",
    });
    styleDataRow(dataRow);
  });

  sheet.views = [{ state: "frozen", ySplit: 3 }];
  sheet.autoFilter = "A3:I3";
}

function buildCollectionsSheet(workbook, rows, period) {
  const sheet = workbook.addWorksheet("Historial de recaudos");
  sheet.columns = [
    { header: "Unidad / Apto", key: "unit", width: 18 },
    { header: "Propietario", key: "owner", width: 30 },
    { header: "Valor recaudado", key: "amount", width: 18 },
    { header: "Fecha recaudo", key: "collectedAt", width: 18 },
  ];

  decorateSheetHeader(sheet, `Historial de recaudos - ${period || "-"}`, 4);

  if (!rows.length) {
    const emptyRow = sheet.addRow({
      unit: "Sin datos disponibles",
      owner: "-",
      amount: "-",
      collectedAt: "-",
    });
    styleDataRow(emptyRow);
  }

  rows.forEach((record) => {
    const dataRow = sheet.addRow({
      unit: record?.unit || "-",
      owner: record?.owner || "-",
      amount: record?.amountLabel || "$0",
      collectedAt: record?.dateLabel || "-",
    });
    styleDataRow(dataRow);
  });

  sheet.views = [{ state: "frozen", ySplit: 3 }];
  sheet.autoFilter = "A3:D3";
}

function decorateSheetHeader(sheet, title, columnCount) {
  const lastColumn = numberToColumn(columnCount);
  sheet.insertRow(1, [title]);
  sheet.mergeCells(`A1:${lastColumn}1`);
  sheet.getCell("A1").font = { bold: true, size: 14 };
  sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 24;

  sheet.insertRow(2, [`Generado: ${new Date().toLocaleString("es-CO")}`]);
  sheet.mergeCells(`A2:${lastColumn}2`);
  sheet.getRow(2).height = 20;

  const headerRow = sheet.getRow(3);
  headerRow.values = sheet.columns.map((column) => column.header);
  headerRow.font = { bold: true, color: { argb: "FF1E3A8A" } };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
    cell.border = BORDER_ALL;
  });
}

function styleDataRow(row) {
  row.eachCell((cell) => {
    cell.border = BORDER_ALL;
    cell.alignment = { vertical: "middle" };
  });
}

function formatCutoffDay(value) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";

  return String(date.getDate());
}

function numberToColumn(number) {
  let result = "";
  let current = number;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    current = Math.floor((current - 1) / 26);
  }
  return result;
}

async function downloadWorkbook(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: WORKBOOK_MIME_TYPE });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const BORDER_ALL = {
  top: { style: "thin", color: { argb: "FFD1D5DB" } },
  left: { style: "thin", color: { argb: "FFD1D5DB" } },
  bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
  right: { style: "thin", color: { argb: "FFD1D5DB" } },
};

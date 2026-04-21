import ExcelJS from "exceljs";

const WORKBOOK_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function exportAdministrativeExpensesWorkbook({
  rows = [],
  fileName = "gastos_administrativos.xlsx",
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "GenAccess";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Gastos administrativos");
  sheet.columns = [
    { header: "Fecha de registro", key: "registeredAt", width: 20 },
    { header: "Tipo de gasto", key: "expenseType", width: 24 },
    { header: "Valor", key: "amount", width: 18 },
    { header: "Medio de pago", key: "paymentMethod", width: 22 },
    { header: "Responsable de registro", key: "registeredBy", width: 28 },
    { header: "Observaciones", key: "observations", width: 36 },
    { header: "Estado", key: "status", width: 20 },
    { header: "Soporte", key: "support", width: 28 },
  ];

  decorateSheetHeader(sheet);

  if (!rows.length) {
    const emptyRow = sheet.addRow({
      registeredAt: "Sin datos disponibles",
      expenseType: "-",
      amount: "-",
      paymentMethod: "-",
      registeredBy: "-",
      observations: "-",
      status: "-",
      support: "-",
    });
    styleDataRow(emptyRow);
  }

  rows.forEach((expense) => {
    const row = sheet.addRow({
      registeredAt: expense?.dateLabel || "-",
      expenseType: expense?.expenseTypeLabel || "-",
      amount: expense?.amountLabel || "$0",
      paymentMethod: expense?.paymentMethodLabel || "-",
      registeredBy: expense?.registeredBy || "-",
      observations: String(expense?.observations || "").trim() || "-",
      status: expense?.statusLabel || "-",
      support: expense?.supportName || "-",
    });
    styleDataRow(row);
  });

  sheet.views = [{ state: "frozen", ySplit: 3 }];
  sheet.autoFilter = "A3:H3";

  await downloadWorkbook(workbook, fileName);
}

function decorateSheetHeader(sheet) {
  sheet.insertRow(1, ["Gastos administrativos"]);
  sheet.mergeCells("A1:H1");
  sheet.getCell("A1").font = { bold: true, size: 14 };
  sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 24;

  sheet.insertRow(2, [`Generado: ${new Date().toLocaleString("es-CO")}`]);
  sheet.mergeCells("A2:H2");
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
    cell.alignment = { vertical: "middle", wrapText: true };
  });
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

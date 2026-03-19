import ExcelJS from "exceljs";

export async function exportInventoryWorkbook({
  products = [],
  movements = [],
  fileName = "inventario.xlsx",
  condominiumLabel = "-",
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Propiedades IA";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("INVENTARIO");
  sheet.columns = [
    { header: "Producto", key: "name", width: 30 },
    { header: "Tipo", key: "type", width: 16 },
    { header: "Inventario", key: "inventory", width: 24 },
    { header: "Categoria", key: "category", width: 22 },
    { header: "Proveedor", key: "supplier", width: 22 },
    { header: "Serial", key: "serial", width: 20 },
    { header: "Stock", key: "stock", width: 12 },
    { header: "Stock minimo", key: "minimum_stock", width: 14 },
    { header: "Costo unitario", key: "unit_cost", width: 16 },
    { header: "Valor total", key: "total_value", width: 16 },
    { header: "Estado", key: "status", width: 14 },
  ];

  sheet.insertRow(1, [`Inventario - ${condominiumLabel}`]);
  sheet.mergeCells("A1:K1");
  sheet.getCell("A1").font = { bold: true, size: 14 };
  sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 24;
  sheet.insertRow(2, [`Generado: ${new Date().toLocaleString("es-CO")}`]);
  sheet.mergeCells("A2:K2");
  sheet.getRow(2).height = 20;

  const headerRow = sheet.getRow(3);
  headerRow.values = sheet.columns.map((column) => column.header);
  headerRow.font = { bold: true, color: { argb: "FF1E3A8A" } };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
    cell.border = BORDER_ALL;
  });

  const rows = Array.isArray(products) ? products : [];
  rows.forEach((item) => {
    const stock = Number(item?.stock_actual ?? item?.stock ?? 0);
    const minimum = Number(item?.minimum_stock ?? 0);
    const totalValue = item?.total_value ?? (Number(item?.unit_cost || 0) * stock);

    const row = sheet.addRow({
      name: item?.name || "-",
      type: item?.type === "asset" ? "Activo fijo" : "Consumible",
      inventory: item?.inventory?.name || item?.inventory_name || "-",
      category: item?.category?.name || item?.category || "-",
      supplier: item?.supplier?.name || "-",
      serial: item?.serial || "-",
      stock,
      minimum_stock: minimum,
      unit_cost: normalizeNumber(item?.unit_cost),
      total_value: normalizeNumber(totalValue),
      status: resolveStatus(item, stock, minimum),
    });
    row.eachCell((cell) => {
      cell.border = BORDER_ALL;
      cell.alignment = { vertical: "middle" };
    });
  });

  sheet.views = [{ state: "frozen", ySplit: 3 }];
  sheet.autoFilter = "A3:K3";

  const movementSheet = workbook.addWorksheet("MOVIMIENTOS");
  movementSheet.columns = [
    { header: "Producto", key: "product_name", width: 28 },
    { header: "Inventario", key: "inventory_name", width: 24 },
    { header: "Tipo", key: "type", width: 14 },
    { header: "Cantidad", key: "quantity", width: 12 },
    { header: "Fecha movimiento", key: "movement_date", width: 18 },
    { header: "Fecha entrada", key: "fecha_entrada", width: 22 },
    { header: "Fecha salida", key: "fecha_salida", width: 22 },
    { header: "Usuario", key: "user", width: 28 },
    { header: "Observaciones", key: "observations", width: 32 },
  ];

  const movementHeader = movementSheet.getRow(1);
  movementHeader.values = movementSheet.columns.map((column) => column.header);
  movementHeader.font = { bold: true, color: { argb: "FF166534" } };
  movementHeader.alignment = { horizontal: "center", vertical: "middle" };
  movementHeader.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
    cell.border = BORDER_ALL;
  });

  movements.forEach((item) => {
    const row = movementSheet.addRow({
      product_name: item?.product_name || "-",
      inventory_name: item?.inventory_name || item?.product?.inventory?.name || "-",
      type: item?.type === "entry" ? "Entrada" : "Salida",
      quantity: Number(item?.quantity ?? 0),
      movement_date: formatExcelDate(item?.movement_date || item?.created_at),
      fecha_entrada: formatExcelDate(item?.fecha_entrada),
      fecha_salida: formatExcelDate(item?.fecha_salida),
      user: resolveUserLabel(item),
      observations: String(item?.observations || "").trim() || "-",
    });
    row.eachCell((cell) => {
      cell.border = BORDER_ALL;
      cell.alignment = { vertical: "middle" };
    });
  });

  movementSheet.views = [{ state: "frozen", ySplit: 1 }];
  movementSheet.autoFilter = "A1:I1";

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

function resolveStatus(item, stock, minimum) {
  if (item?.type === "asset") {
    return item?.dado_de_baja || !item?.is_active ? "INACTIVO" : "Activo";
  }
  if (stock <= 0) return "Sin stock";
  if (stock <= minimum) return "Bajo";
  return "Correcto";
}

function normalizeNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number;
}

function formatExcelDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("es-CO");
}

function resolveUserLabel(row) {
  const user = row?.registeredBy || row?.registered_by;
  if (!user) return "-";
  return user.full_name || user.email || "-";
}

const BORDER_ALL = {
  top: { style: "thin", color: { argb: "FFD1D5DB" } },
  left: { style: "thin", color: { argb: "FFD1D5DB" } },
  bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
  right: { style: "thin", color: { argb: "FFD1D5DB" } },
};

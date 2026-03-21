import ExcelJS from "exceljs";

export async function exportInventoryWorkbook({ products = [], fileName = "inventario.xlsx", condominiumLabel = "-" }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Propiedades IA";
  workbook.created = new Date();

  const rows = Array.isArray(products) ? products : [];
  const movements = rows
    .flatMap((item) =>
      Array.isArray(item?.last_movements)
        ? item.last_movements.map((movement) => ({
            ...movement,
            product_name: item?.name || "-",
            product_type: item?.type === "asset" ? "Activo fijo" : "Consumible",
            inventory_name: item?.inventory?.name || item?.inventory_name || "-",
            supplier_name: item?.supplier?.name || "-",
            serial: item?.serial || "-",
            unit_cost: normalizeNumber(item?.unit_cost),
          }))
        : []
    )
    .sort((a, b) => new Date(b.movement_date || b.created_at || 0).getTime() - new Date(a.movement_date || a.created_at || 0).getTime());

  buildProductsSheet(workbook, rows, condominiumLabel);
  buildMovementsSheet(workbook, movements, condominiumLabel);

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

function buildProductsSheet(workbook, rows, condominiumLabel) {
  const sheet = workbook.addWorksheet("PRODUCTOS");
  sheet.columns = [
    { header: "Producto", key: "name", width: 30 },
    { header: "Serial", key: "serial", width: 22 },
    { header: "Tipo", key: "type", width: 16 },
    { header: "Inventario", key: "inventory", width: 24 },
    { header: "Categoría", key: "category", width: 22 },
    { header: "Proveedor", key: "supplier", width: 22 },
    { header: "Stock", key: "stock", width: 12 },
    { header: "Stock mínimo", key: "minimum_stock", width: 14 },
    { header: "Costo unitario", key: "unit_cost", width: 16 },
    { header: "Valor total", key: "total_value", width: 16 },
    { header: "Última entrada", key: "fecha_entrada", width: 22 },
    { header: "Última salida", key: "fecha_salida", width: 22 },
    { header: "Estado", key: "status", width: 14 },
  ];

  decorateSheetHeader(sheet, `Inventario - ${condominiumLabel}`, 13);

  rows.forEach((item) => {
    const stock = Number(item?.stock_actual ?? item?.stock ?? 0);
    const minimum = Number(item?.minimum_stock ?? 0);
    const totalValue = item?.total_value ?? (Number(item?.unit_cost || 0) * stock);
    const lastMovement = Array.isArray(item?.last_movements) && item.last_movements.length > 0 ? item.last_movements[0] : null;

    const row = sheet.addRow({
      name: item?.name || "-",
      serial: item?.serial || "-",
      type: item?.type === "asset" ? "Activo fijo" : "Consumible",
      inventory: item?.inventory?.name || item?.inventory_name || "-",
      category: item?.category?.name || item?.category || "-",
      supplier: item?.supplier?.name || "-",
      stock,
      minimum_stock: minimum,
      unit_cost: normalizeNumber(item?.unit_cost),
      total_value: normalizeNumber(totalValue),
      fecha_entrada: formatDateTime(item?.fecha_entrada || lastMovement?.fecha_entrada),
      fecha_salida: formatDateTime(item?.fecha_salida || lastMovement?.fecha_salida),
      status: resolveStatus(item, stock, minimum),
    });
    styleDataRow(row);
  });

  sheet.views = [{ state: "frozen", ySplit: 3 }];
  sheet.autoFilter = "A3:M3";
}

function buildMovementsSheet(workbook, movements, condominiumLabel) {
  const sheet = workbook.addWorksheet("MOVIMIENTOS");
  sheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Producto", key: "product_name", width: 28 },
    { header: "Serial", key: "serial", width: 20 },
    { header: "Tipo de producto", key: "product_type", width: 18 },
    { header: "Inventario", key: "inventory_name", width: 22 },
    { header: "Proveedor", key: "supplier_name", width: 22 },
    { header: "Movimiento", key: "type", width: 14 },
    { header: "Cantidad", key: "quantity", width: 12 },
    { header: "Fecha", key: "fecha", width: 14 },
    { header: "Hora", key: "hora", width: 12 },
    { header: "Fecha entrada", key: "fecha_entrada", width: 22 },
    { header: "Fecha salida", key: "fecha_salida", width: 22 },
    { header: "Costo unitario", key: "unit_cost", width: 16 },
    { header: "Observación", key: "observations", width: 28 },
  ];

  decorateSheetHeader(sheet, `Movimientos - ${condominiumLabel}`, 14);

  movements.forEach((movement) => {
    const row = sheet.addRow({
      id: movement?.id ?? "-",
      product_name: movement?.product_name || "-",
      serial: movement?.serial || "-",
      product_type: movement?.product_type || "-",
      inventory_name: movement?.inventory_name || "-",
      supplier_name: movement?.supplier_name || "-",
      type: movement?.type === "entry" ? "Entrada" : "Salida",
      quantity: Number(movement?.quantity || 0),
      fecha: formatDateOnly(movement?.movement_date || movement?.created_at),
      hora: formatTimeOnly(movement?.created_at),
      fecha_entrada: formatDateTime(movement?.fecha_entrada),
      fecha_salida: formatDateTime(movement?.fecha_salida),
      unit_cost: normalizeNumber(movement?.unit_cost),
      observations: String(movement?.observations || "").trim() || "-",
    });
    styleDataRow(row);
  });

  sheet.views = [{ state: "frozen", ySplit: 3 }];
  sheet.autoFilter = "A3:N3";
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

function resolveStatus(item, stock, minimum) {
  if (item?.type === "asset") {
    return item?.dado_de_baja ? "Inactivo" : item?.is_active ? "Activo" : "Inactivo";
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

function formatDateOnly(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-CO");
}

function formatTimeOnly(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString("es-CO")} ${date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
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

const BORDER_ALL = {
  top: { style: "thin", color: { argb: "FFD1D5DB" } },
  left: { style: "thin", color: { argb: "FFD1D5DB" } },
  bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
  right: { style: "thin", color: { argb: "FFD1D5DB" } },
};

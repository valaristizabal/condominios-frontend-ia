import ExcelJS from "exceljs";

export async function exportInventoryWorkbook({ products = [], fileName = "inventario.xlsx", condominiumLabel = "-" }) {
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
    { header: "Stock", key: "stock", width: 12 },
    { header: "Stock minimo", key: "minimum_stock", width: 14 },
    { header: "Costo unitario", key: "unit_cost", width: 16 },
    { header: "Valor total", key: "total_value", width: 16 },
    { header: "Estado", key: "status", width: 14 },
  ];

  sheet.insertRow(1, [`Inventario - ${condominiumLabel}`]);
  sheet.mergeCells("A1:J1");
  sheet.getCell("A1").font = { bold: true, size: 14 };
  sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 24;
  sheet.insertRow(2, [`Generado: ${new Date().toLocaleString("es-CO")}`]);
  sheet.mergeCells("A2:J2");
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
  sheet.autoFilter = "A3:J3";

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
    return item?.is_active ? "Activo" : "Inactivo";
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

const BORDER_ALL = {
  top: { style: "thin", color: { argb: "FFD1D5DB" } },
  left: { style: "thin", color: { argb: "FFD1D5DB" } },
  bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
  right: { style: "thin", color: { argb: "FFD1D5DB" } },
};

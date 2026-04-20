export const expenseTypeOptions = [
  { value: "servicios", label: "Servicios publicos" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "honorarios", label: "Honorarios" },
  { value: "papeleria", label: "Papeleria" },
  { value: "seguridad", label: "Seguridad" },
  { value: "aseo", label: "Aseo" },
];

export const paymentMethodOptions = [
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
  { value: "debito", label: "Debito automatico" },
  { value: "tarjeta", label: "Tarjeta corporativa" },
  { value: "consignacion", label: "Consignacion" },
];

export const expenseStatusOptions = [
  { value: "registrado", label: "Registrado" },
  { value: "con-soporte", label: "Con soporte" },
  { value: "pendiente-soporte", label: "Pendiente soporte" },
];

export const mockAdministrativeExpenses = [
  {
    id: "ga-1001",
    registeredAt: "2026-04-18",
    expenseType: "mantenimiento",
    amount: 450000,
    paymentMethod: "transferencia",
    observations: "Cambio de luminarias en zonas comunes.",
    supportName: "factura-mantenimiento-abril.pdf",
    registeredBy: "Laura Mendoza",
    status: "con-soporte",
  },
  {
    id: "ga-1002",
    registeredAt: "2026-04-17",
    expenseType: "servicios",
    amount: 980000,
    paymentMethod: "debito",
    observations: "Pago mensual del servicio de energia.",
    supportName: "recibo-energia-marzo.pdf",
    registeredBy: "Carlos Pineda",
    status: "con-soporte",
  },
  {
    id: "ga-1003",
    registeredAt: "2026-04-15",
    expenseType: "honorarios",
    amount: 1200000,
    paymentMethod: "transferencia",
    observations: "Honorarios por cierre contable del mes.",
    supportName: "honorarios-contabilidad.pdf",
    registeredBy: "Sandra Diaz",
    status: "registrado",
  },
  {
    id: "ga-1004",
    registeredAt: "2026-04-13",
    expenseType: "papeleria",
    amount: 185000,
    paymentMethod: "efectivo",
    observations: "Compra de insumos para administracion.",
    supportName: "",
    registeredBy: "Miguel Rojas",
    status: "pendiente-soporte",
  },
  {
    id: "ga-1005",
    registeredAt: "2026-04-11",
    expenseType: "seguridad",
    amount: 760000,
    paymentMethod: "consignacion",
    observations: "Reposicion de elementos de dotacion del personal.",
    supportName: "dotacion-seguridad.png",
    registeredBy: "Laura Mendoza",
    status: "con-soporte",
  },
];

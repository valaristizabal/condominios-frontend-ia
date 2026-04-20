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
    supportName: "dotacion-seguridad.png",
    registeredBy: "Laura Mendoza",
    status: "con-soporte",
  },
];

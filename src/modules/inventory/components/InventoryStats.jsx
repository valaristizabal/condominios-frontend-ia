import { AlertTriangle, Coffee, Package, Wrench } from "lucide-react";

function InventoryStats({ stats }) {
  const cards = [
    {
      label: "Total Productos",
      value: stats.totalProducts,
      icon: <Package className="h-5 w-5" />,
      iconClass: "text-blue-700 bg-blue-50",
    },
    {
      label: "Consumibles",
      value: stats.consumables,
      icon: <Coffee className="h-5 w-5" />,
      iconClass: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "Activos Fijos",
      value: stats.assets,
      icon: <Wrench className="h-5 w-5" />,
      iconClass: "text-indigo-700 bg-indigo-50",
    },
    {
      label: "Stock Bajo",
      value: stats.lowStock,
      icon: <AlertTriangle className="h-5 w-5" />,
      iconClass: "text-amber-700 bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-500">{card.label}</p>
            <span className={`rounded-xl p-2 ${card.iconClass}`}>{card.icon}</span>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-gray-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

export default InventoryStats;


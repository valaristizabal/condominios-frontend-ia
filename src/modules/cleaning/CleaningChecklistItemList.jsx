function CleaningChecklistItemList({ items, canEdit, onToggleItem }) {
  if (!items?.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center">
        <p className="text-sm font-semibold text-slate-600">Este registro no tiene items de checklist.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2"
        >
          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={Boolean(item.completed)}
              onChange={(event) => onToggleItem(item.id, event.target.checked)}
              disabled={!canEdit}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-300 disabled:opacity-50"
            />
            <span
              className={[
                "truncate text-sm",
                item.completed ? "font-semibold text-emerald-700 line-through" : "text-slate-700",
              ].join(" ")}
            >
              {item.item_name}
            </span>
          </label>

          <span
            className={[
              "rounded-full px-2 py-1 text-[10px] font-bold uppercase",
              item.completed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600",
            ].join(" ")}
          >
            {item.completed ? "Hecho" : "Pendiente"}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default CleaningChecklistItemList;

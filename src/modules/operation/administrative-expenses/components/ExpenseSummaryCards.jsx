import { Landmark, ReceiptText, Wallet } from "lucide-react";

const iconById = {
  total: { icon: Wallet, className: "bg-blue-50 text-blue-700" },
  count: { icon: ReceiptText, className: "bg-amber-50 text-amber-700" },
  latest: { icon: Landmark, className: "bg-slate-100 text-slate-700" },
};

function ExpenseSummaryCards({ cards = [] }) {
  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const config = iconById[card.id] || iconById.total;
        const Icon = config.icon;

        return (
          <article
            key={card.id}
            className="min-h-[152px] rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="flex h-full items-start justify-between gap-5">
              <div className="flex h-full min-w-0 flex-1 flex-col justify-between">
                <p className="text-sm font-semibold text-gray-500 sm:text-[15px]">{card.label}</p>
                <p className="pr-3 text-2xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-[28px]">
                  {card.value}
                </p>
              </div>

              <span
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  config.className,
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default ExpenseSummaryCards;

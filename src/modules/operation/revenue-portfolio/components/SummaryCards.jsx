import { AlertTriangle, CalendarRange, Landmark, Wallet } from "lucide-react";

const toneStyles = {
  blue: {
    iconWrap: "bg-blue-50 text-blue-700",
  },
  amber: {
    iconWrap: "bg-amber-50 text-amber-700",
  },
  red: {
    iconWrap: "bg-rose-50 text-rose-700",
  },
  emerald: {
    iconWrap: "bg-emerald-50 text-emerald-700",
  },
};

const iconMap = {
  wallet: Wallet,
  portfolio: Landmark,
  overdue: AlertTriangle,
  calendar: CalendarRange,
};

function SummaryCards({ cards = [] }) {
  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = iconMap[card.icon] || Wallet;
        const styles = toneStyles[card.tone] || toneStyles.blue;

        return (
          <article
            key={card.id}
            className="min-h-[152px] rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="flex h-full justify-between items-start gap-5">
              <div className="flex h-full min-w-0 flex-1 flex-col justify-between">
                <p className="text-sm font-semibold text-gray-500 sm:text-[15px]">
                  {card.label}
                </p>
                <p className="pr-3 text-2xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-[28px]">
                  {card.value}
                </p>
              </div>

              <div
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  styles.iconWrap,
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default SummaryCards;

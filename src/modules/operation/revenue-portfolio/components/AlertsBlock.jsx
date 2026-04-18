import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";

const toneStyles = {
  danger: {
    border: "border-rose-200",
    bg: "bg-rose-50",
    text: "text-rose-700",
    badge: "bg-rose-100 text-rose-700",
    icon: AlertCircle,
  },
  warning: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    icon: Clock3,
  },
  success: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
  },
};

function AlertsBlock({ alerts = [] }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm">
      <h2 className="text-xl font-bold text-gray-800">Alertas de Cartera</h2>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {alerts.map((alert) => {
          const styles = toneStyles[alert.tone] || toneStyles.warning;
          const Icon = styles.icon;

          return (
            <article
              key={alert.id}
              className={[
                "rounded-2xl border px-5 py-5",
                styles.border,
                styles.bg,
              ].join(" ")}
            >
              <div className="flex items-start gap-4">
                <div className={["mt-0.5 rounded-xl p-2.5", styles.badge].join(" ")}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <span
                    className={[
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide",
                      styles.badge,
                    ].join(" ")}
                  >
                    {alert.badge}
                  </span>
                  <p className={["mt-3 text-sm font-bold leading-6 sm:text-[15px]", styles.text].join(" ")}>
                    {alert.title}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}


export default AlertsBlock;

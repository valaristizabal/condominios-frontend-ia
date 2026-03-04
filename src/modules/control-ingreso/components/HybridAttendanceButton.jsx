import { LogIn, LogOut } from "lucide-react";

function HybridAttendanceButton({ isPresent = false, disabled = false, onToggle }) {
  const isCheckout = Boolean(isPresent);

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-extrabold transition",
        "disabled:cursor-not-allowed disabled:opacity-60",
        isCheckout
          ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
      ].join(" ")}
    >
      {isCheckout ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
      {isCheckout ? "REGISTRAR SALIDA" : "REGISTRAR INGRESO"}
    </button>
  );
}

export default HybridAttendanceButton;

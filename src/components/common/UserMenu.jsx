import { ChevronDown, LogOut, Mail, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/useAuthContext";

function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!user) return null;

  const displayName = user?.full_name || user?.name || "Usuario";
  const displayEmail = user?.email || "";

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <UserRound className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-slate-900">{displayName}</span>
          {displayEmail ? <span className="block truncate text-xs text-slate-500">{displayEmail}</span> : null}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="rounded-xl bg-slate-50 px-3 py-3">
            <p className="truncate text-sm font-bold text-slate-900">{displayName}</p>
            {displayEmail ? (
              <p className="mt-1 flex items-center gap-2 truncate text-xs text-slate-500">
                <Mail className="h-3.5 w-3.5" />
                {displayEmail}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4 text-slate-400" />
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default UserMenu;

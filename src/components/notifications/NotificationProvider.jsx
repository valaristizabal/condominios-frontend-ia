import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, TriangleAlert, X, XCircle } from "lucide-react";

const NotificationContext = createContext(null);

let notifyBridge = null;

function setNotifyBridge(handler) {
  notifyBridge = handler;
}

function dispatchNotification(type, message, options = {}) {
  if (typeof notifyBridge !== "function") return null;
  return notifyBridge({ type, message, ...options });
}

export const notify = {
  show(options) {
    if (!options?.message) return null;
    return dispatchNotification(options.type || "success", options.message, options);
  },
  success(message, options) {
    return dispatchNotification("success", message, options);
  },
  error(message, options) {
    return dispatchNotification("error", message, options);
  },
  warning(message, options) {
    return dispatchNotification("warning", message, options);
  },
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const timeoutsRef = useRef(new Map());
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }

    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (options) => {
      if (!options?.message) return null;

      const id = idRef.current + 1;
      idRef.current = id;

      const nextNotification = {
        id,
        type: options.type || "success",
        title: options.title || "",
        message: options.message,
        duration: Math.max(3000, Math.min(options.duration ?? 4000, 5000)),
      };

      setNotifications((current) => [...current, nextNotification]);

      const timeoutId = window.setTimeout(() => {
        dismiss(id);
      }, nextNotification.duration);

      timeoutsRef.current.set(id, timeoutId);
      return id;
    },
    [dismiss]
  );

  const success = useCallback((message, options = {}) => show({ ...options, type: "success", message }), [show]);
  const error = useCallback((message, options = {}) => show({ ...options, type: "error", message }), [show]);
  const warning = useCallback((message, options = {}) => show({ ...options, type: "warning", message }), [show]);

  useEffect(() => {
    setNotifyBridge(show);

    return () => {
      setNotifyBridge(null);
      timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutsRef.current.clear();
    };
  }, [show]);

  const value = useMemo(
    () => ({ show, success, error, warning, dismiss }),
    [show, success, error, warning, dismiss]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationViewport notifications={notifications} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider.");
  }

  return context;
}

function NotificationViewport({ notifications, onDismiss }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,24rem)] flex-col gap-3 sm:right-6 sm:top-6">
      {notifications.map((notification) => (
        <NotificationToast key={notification.id} notification={notification} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function NotificationToast({ notification, onDismiss }) {
  const tone = getTone(notification.type);
  const Icon = tone.icon;

  return (
    <div
      className={`pointer-events-auto overflow-hidden rounded-3xl border bg-white shadow-2xl ring-1 ring-slate-950/5 ${tone.border}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${tone.badge}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-slate-900">{notification.title || tone.title}</p>
          <p className="mt-1 text-sm font-medium leading-5 text-slate-600">{notification.message}</p>
        </div>

        <button
          type="button"
          onClick={() => onDismiss(notification.id)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Cerrar notificacion"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className={`h-1 w-full ${tone.progress}`} />
    </div>
  );
}

function getTone(type) {
  switch (type) {
    case "error":
      return {
        title: "Error",
        icon: XCircle,
        border: "border-red-200",
        badge: "bg-red-50 text-red-600",
        progress: "bg-red-500",
      };
    case "warning":
      return {
        title: "Advertencia",
        icon: TriangleAlert,
        border: "border-amber-200",
        badge: "bg-amber-50 text-amber-600",
        progress: "bg-amber-500",
      };
    case "success":
    default:
      return {
        title: "Operacion exitosa",
        icon: CheckCircle2,
        border: "border-emerald-200",
        badge: "bg-emerald-50 text-emerald-600",
        progress: "bg-emerald-500",
      };
  }
}

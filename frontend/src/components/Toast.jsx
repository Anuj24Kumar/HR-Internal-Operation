import { useEffect } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

const variants = {
  success: {
    icon: CheckCircle2,
    styles: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  error: {
    icon: XCircle,
    styles: "border-rose-200 bg-rose-50 text-rose-800",
  },
  info: {
    icon: Info,
    styles: "border-blue-200 bg-blue-50 text-blue-800",
  },
};

function Toast({ toast, onClose }) {
  useEffect(() => {
    const timeout = window.setTimeout(() => onClose(toast.id), 4000);
    return () => window.clearTimeout(timeout);
  }, [onClose, toast.id]);

  const variant = variants[toast.type] || variants.info;
  const Icon = variant.icon;

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg ${variant.styles}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        {toast.title && <p className="text-sm font-bold">{toast.title}</p>}
        {toast.message && <p className="mt-0.5 text-sm opacity-90">{toast.message}</p>}
      </div>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ToastStack({ toasts, onClose }) {
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[220] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

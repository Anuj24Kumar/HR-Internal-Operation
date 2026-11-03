import { useEffect } from "react";
import { AlertTriangle, Info, Trash2, X, Loader2 } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this action?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // 'danger' | 'warning' | 'primary'
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen && !loading) {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const iconConfig = {
    danger: {
      bg: "bg-rose-100 text-rose-600",
      button: "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500",
      icon: <Trash2 className="h-6 w-6 text-rose-600" />,
    },
    warning: {
      bg: "bg-amber-100 text-amber-600",
      button: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
      icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
    },
    primary: {
      bg: "bg-blue-100 text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      icon: <Info className="h-6 w-6 text-blue-600" />,
    },
  }[type] || {
    bg: "bg-rose-100 text-rose-600",
    button: "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500",
    icon: <AlertTriangle className="h-6 w-6 text-rose-600" />,
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all scale-100"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${iconConfig.bg}`}
          >
            {iconConfig.icon}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3
              id="confirm-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              {title}
            </h3>

            <div
              id="confirm-modal-desc"
              className="mt-2 text-sm leading-relaxed text-slate-600"
            >
              {typeof message === "string" ? <p>{message}</p> : message}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition focus:outline-none disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-2xs transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${iconConfig.button}`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";

export default function PromptModal({
  isOpen,
  title = "Input required",
  message = "",
  placeholder = "",
  defaultValue = "",
  confirmText = "Submit",
  required = true,
  multiline = false,
  onConfirm,
  onCancel,
}) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError("");
    }
  }, [defaultValue, isOpen]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && isOpen) onCancel();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  function submit(event) {
    event.preventDefault();
    if (required && !value.trim()) {
      setError("This field is required");
      return;
    }
    onConfirm(value);
  }

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xs">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-modal-title"
        onSubmit={submit}
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-600">
            <Info className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id="prompt-modal-title" className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            {message && (
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
            )}
          </div>
        </div>

        {multiline ? (
          <textarea
            autoFocus
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError("");
            }}
            placeholder={placeholder}
            aria-label={title}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "prompt-modal-error" : undefined}
            className="mt-5 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          />
        ) : (
          <input
            autoFocus
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError("");
            }}
            placeholder={placeholder}
            aria-label={title}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "prompt-modal-error" : undefined}
            className="mt-5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          />
        )}
        {error && (
          <p id="prompt-modal-error" className="mt-1.5 text-sm text-rose-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {confirmText}
          </button>
        </div>
      </form>
    </div>
  );
}

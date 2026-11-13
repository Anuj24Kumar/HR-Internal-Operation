import { createContext, useCallback, useContext, useRef, useState } from "react";
import ConfirmModal from "./ConfirmModal.jsx";
import PromptModal from "./PromptModal.jsx";
import ToastStack from "./Toast.jsx";

const AlertContext = createContext(null);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider.");
  }
  return context;
}

export function AlertProvider({ children }) {
  const [confirmState, setConfirmState] = useState({ open: false });
  const [promptState, setPromptState] = useState({ open: false });
  const [toasts, setToasts] = useState([]);
  const confirmResolver = useRef(null);
  const promptResolver = useRef(null);

  const finishConfirm = useCallback((resolver, result) => {
    if (confirmResolver.current !== resolver) return;
    confirmResolver.current = null;
    setConfirmState({ open: false });
    resolver(result);
  }, []);

  const confirm = useCallback(
    (opts = {}) =>
      new Promise((resolve) => {
        confirmResolver.current?.(false);
        confirmResolver.current = resolve;
        setConfirmState({
          open: true,
          type: opts.type || "warning",
          title: opts.title || "Are you sure?",
          message: opts.message || "",
          confirmText: opts.confirmText || "Confirm",
          cancelText: opts.cancelText || "Cancel",
          onConfirm: () => finishConfirm(resolve, true),
          onCancel: () => finishConfirm(resolve, false),
        });
      }),
    [finishConfirm]
  );

  const alert = useCallback(
    (opts = {}) =>
      new Promise((resolve) => {
        confirmResolver.current?.(false);
        confirmResolver.current = resolve;
        setConfirmState({
          open: true,
          type: opts.type || "primary",
          title: opts.title || "Notice",
          message: opts.message || "",
          confirmText: opts.confirmText || "OK",
          cancelText: null,
          onConfirm: () => finishConfirm(resolve, true),
          onCancel: () => finishConfirm(resolve, true),
        });
      }),
    [finishConfirm]
  );

  const prompt = useCallback(
    (opts = {}) =>
      new Promise((resolve) => {
        promptResolver.current?.(null);
        promptResolver.current = resolve;
        setPromptState({
          open: true,
          title: opts.title || "Input required",
          message: opts.message || "",
          placeholder: opts.placeholder || "",
          defaultValue: opts.defaultValue || "",
          confirmText: opts.confirmText || "Submit",
          required: opts.required !== false,
          multiline: Boolean(opts.multiline),
          onConfirm: (value) => {
            if (promptResolver.current !== resolve) return;
            promptResolver.current = null;
            setPromptState({ open: false });
            resolve(value);
          },
          onCancel: () => {
            if (promptResolver.current !== resolve) return;
            promptResolver.current = null;
            setPromptState({ open: false });
            resolve(null);
          },
        });
      }),
    []
  );

  const toast = useCallback((type, title, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, type, title, message }]);
  }, []);

  const toastSuccess = useCallback(
    (title, message) => toast("success", title, message),
    [toast]
  );
  const toastError = useCallback(
    (title, message) => toast("error", title, message),
    [toast]
  );
  const toastInfo = useCallback(
    (title, message) => toast("info", title, message),
    [toast]
  );
  const dismissToast = useCallback(
    (id) => setToasts((current) => current.filter((item) => item.id !== id)),
    []
  );

  return (
    <AlertContext.Provider
      value={{ confirm, alert, prompt, toast, toastSuccess, toastError, toastInfo }}
    >
      {children}
      <ConfirmModal {...confirmState} isOpen={confirmState.open} />
      <PromptModal {...promptState} isOpen={promptState.open} />
      <ToastStack toasts={toasts} onClose={dismissToast} />
    </AlertContext.Provider>
  );
}

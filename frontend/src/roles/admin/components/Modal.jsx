import React, { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ isOpen, onClose, title, children, footer, size = "md" }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = size === "lg" ? "modal-lg" : size === "xl" ? "modal-xl" : "";

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className={`admin-modal-box ${sizeClass}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="admin-icon-btn"
            style={{ width: "28px", height: "28px" }}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
        {footer && <div className="admin-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

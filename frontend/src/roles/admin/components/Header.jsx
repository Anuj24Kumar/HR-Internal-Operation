import React, { useState, useRef, useEffect } from "react";
import { Search, Bell, ChevronDown, LogOut } from "lucide-react";

export default function Header({ user, onLogout, onOpenSearch }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AD";

  return (
    <header className="admin-header">
      {/* Search trigger */}
      <div className="admin-search-trigger" onClick={onOpenSearch}>
        <Search size={16} />
        <span>Search anything...</span>
        <span className="admin-search-kbd">⌘ K</span>
      </div>

      {/* Right Actions */}
      <div className="admin-header-actions" ref={menuRef}>
        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="View notifications"
          >
            <Bell size={17} />
            <span className="admin-unread-dot" />
          </button>

          {notificationsOpen && (
            <div
              style={{
                position: "absolute",
                top: "45px",
                right: "0",
                width: "280px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                padding: "12px",
                zIndex: 50,
              }}
            >
              <div
                style={{
                  fontWeight: "700",
                  fontSize: "13px",
                  marginBottom: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Notifications</span>
                <span style={{ fontSize: "11px", color: "#2563eb", cursor: "pointer" }}>
                  Mark all read
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                🔒 <strong>System Audit:</strong> Immutable logs active
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", padding: "6px 0" }}>
                📋 <strong>Workflows:</strong> Approval routing operational
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="admin-user-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="admin-avatar">{initials}</div>
            <div className="admin-user-details">
              <div className="admin-user-name">{user?.name || "Admin"}</div>
              <div className="admin-user-role">Administrator</div>
            </div>
            <ChevronDown size={14} style={{ color: "#64748b" }} />
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "45px",
                right: "0",
                width: "200px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                padding: "6px",
                zIndex: 50,
              }}
            >
              <div
                style={{
                  padding: "8px 10px",
                  borderBottom: "1px solid #f1f5f9",
                  marginBottom: "4px",
                }}
              >
                <div style={{ fontSize: "12.5px", fontWeight: "600", color: "#0f172a" }}>
                  {user?.name || "Admin"}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {user?.email || "admin@hrplatform.com"}
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 10px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  color: "#dc2626",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fef2f2")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <LogOut size={14} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

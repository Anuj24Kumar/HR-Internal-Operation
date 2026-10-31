
import { useState } from "react";
import { NavLink, Routes, Route, Navigate, useLocation } from "react-router-dom";
import {
  Activity, LayoutDashboard, Users, CalendarDays, BriefcaseBusiness,
  UserRound, FileText, Files, ClipboardCheck, ShieldCheck,
  DoorOpen, Bell, Settings, Search, Menu, X, LogOut, ChevronRight
} from "lucide-react";
import useRoleAuth from "../useRoleAuth.js";
import "../../styles.css";
import Dashboard from "../../pages/Dashboard.jsx";
import Candidates from "../../pages/Candidates.jsx";
import Interviews from "../../pages/Interviews.jsx";
import Offers from "../../pages/Offers.jsx";
import Employees from "../../pages/Employees.jsx";
import Documents from "../../pages/Documents";
import Letters from "../../pages/Letters";
import Onboarding from "../../pages/Onboarding.jsx";
import ExitManagement from "../../pages/ExitManagement";

const navigation = [
  { label: "Overview", path: "/hr/dashboard", icon: LayoutDashboard },
  { label: "Candidates", path: "/hr/candidates", icon: Users },
  { label: "Interviews", path: "/hr/interviews", icon: CalendarDays },
  { label: "Offers", path: "/hr/offers", icon: BriefcaseBusiness },
  { label: "Employees", path: "/hr/employees", icon: UserRound },
  { label: "Documents", path: "/hr/documents", icon: Files },
  { label: "Letters", path: "/hr/letters", icon: FileText },
  { label: "Onboarding", path: "/hr/onboarding", icon: ClipboardCheck },
  { label: "Approvals", path: "/hr/approvals", icon: ShieldCheck },
  { label: "Exit Management", path: "/hr/exits", icon: DoorOpen },
  { label: "Notifications", path: "/hr/notifications", icon: Bell },
];

function PlaceholderPage({ title }) {
  return (
    <section className="hr-placeholder">
      <div className="hr-eyebrow">HR WORKSPACE</div>
      <h1>{title}</h1>
      <p>This module's UI and live API integration will be implemented next.</p>
    </section>
  );
}

function HrLayout({ message, logout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const current = navigation.find(item => item.path === location.pathname);
  const title = current?.label || "Overview";

  return (
    <div className="hr-app">
      {mobileOpen && (
        <button
          className="hr-mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`hr-sidebar ${mobileOpen ? "hr-sidebar-open" : ""}`}>
        <div className="hr-brand">
          <span className="hr-brand-icon"><Activity size={23} /></span>
          <span>
            <strong>PeopleOps</strong>
            <small>HR OPERATIONS</small>
          </span>
          <button
            className="hr-icon-button hr-close-menu"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="hr-workspace">
          <span className="hr-workspace-icon">A</span>
          <span className="hr-workspace-copy">
            <strong>Acme Corporation</strong>
            <small>HR workspace</small>
          </span>
          <ChevronRight size={16} />
        </div>

        <div className="hr-nav-label">WORKSPACE</div>

        <nav className="hr-navigation">
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `hr-nav-link ${isActive ? "hr-nav-active" : ""}`
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hr-sidebar-bottom">
          <NavLink
            to="/hr/settings"
            className={({ isActive }) =>
              `hr-nav-link ${isActive ? "hr-nav-active" : ""}`
            }
            onClick={() => setMobileOpen(false)}
          >
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>

          <div className="hr-user-card">
            <div className="hr-avatar">HR</div>
            <div className="hr-user-copy">
              <strong>HR Workspace</strong>
              <small>{message}</small>
            </div>
            <button
              className="hr-icon-button"
              onClick={logout}
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="hr-main">
        <header className="hr-topbar">
          <div className="hr-breadcrumb">
            <button
              className="hr-icon-button hr-menu-button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>

          <div className="hr-topbar-actions">
            <label className="hr-global-search">
              <Search size={17} />
              <input placeholder="Search anything..." aria-label="Search" />
              <kbd>⌘ K</kbd>
            </label>
            <div className="hr-topbar-user">
              <div className="hr-avatar">HR</div>
              <span>
                <strong>HR Team</strong>
                <small>Human Resources</small>
              </span>
            </div>
          </div>
        </header>

        <div className="hr-content">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="candidates" element={<Candidates />} />
            <Route path="interviews" element={<Interviews />} />
            <Route path="offers" element={<Offers />} />
            <Route path="employees" element={<Employees />} />
            <Route path="documents" element={<Documents />} />
            <Route path="letters" element={<Letters />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="approvals" element={<PlaceholderPage title="Approvals" />} />
            <Route path="exits" element={<ExitManagement />} />
            <Route path="notifications" element={<PlaceholderPage title="Notifications" />} />
            <Route path="settings" element={<PlaceholderPage title="Settings" />} />
            <Route path="*" element={<Navigate to="/hr/dashboard" replace />} />
          </Routes>
        </div>

        <footer className="hr-footer">
          <span>PeopleOps · HR Operations Platform</span>
          <span>Secure HR workspace</span>
        </footer>
      </main>
    </div>
  );
}

export default function HrEntry() {
  const { message, logout } = useRoleAuth("hr");

  return (
    <HrLayout message={message} logout={logout} />
  );
}

import React, { useState, useEffect } from "react";
import useRoleAuth from "../useRoleAuth.js";
import { apiRequest } from "../../api.js";
import "./adminTheme.css";

import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import GlobalSearchModal from "./components/GlobalSearchModal.jsx";

import DashboardView from "./pages/DashboardView.jsx";
import UsersView from "./pages/UsersView.jsx";
import RecruitmentView from "./pages/RecruitmentView.jsx";
import EmployeesView from "./pages/EmployeesView.jsx";
import WorkflowsView from "./pages/WorkflowsView.jsx";
import TemplatesView from "./pages/TemplatesView.jsx";
import AuditLogsView from "./pages/AuditLogsView.jsx";

export default function AdminEntry() {
  const { logout } = useRoleAuth("admin");
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("hr-auth-token");
    if (token) {
      apiRequest("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.user) {
            setCurrentUser(res.user);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K opens omnibar global search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="admin-shell">
      {/* Omnibar Search Dialog */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      {/* Dark Sidebar (matching PeopleOps theme) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={logout}
        user={currentUser}
      />

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Top Header Bar */}
        <Header
          user={currentUser}
          onLogout={logout}
          onOpenSearch={() => setSearchModalOpen(true)}
        />

        {/* Tab Pages */}
        {activeTab === "dashboard" && (
          <DashboardView user={currentUser} onSelectTab={setActiveTab} />
        )}
        {activeTab === "users" && <UsersView />}
        {activeTab === "recruitment" && <RecruitmentView />}
        {activeTab === "employees" && <EmployeesView />}
        {activeTab === "workflows" && <WorkflowsView />}
        {activeTab === "templates" && <TemplatesView />}
        {activeTab === "audit" && <AuditLogsView />}
      </div>
    </div>
  );
}

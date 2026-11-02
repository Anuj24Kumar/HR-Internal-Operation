import { useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  BriefcaseBusiness,
  UserRound,
  FileText,
  Files,
  ClipboardCheck,
  ShieldCheck,
  DoorOpen,
} from "lucide-react";
import useRoleAuth from "../useRoleAuth.js";
import "../../styles.css";
import UnifiedSidebar from "../../components/UnifiedSidebar.jsx";
import UnifiedNavbar from "../../components/UnifiedNavbar.jsx";

import Dashboard from "../../pages/Dashboard.jsx";
import Candidates from "../../pages/Candidates.jsx";
import Interviews from "../../pages/Interviews.jsx";
import Offers from "../../pages/Offers.jsx";
import Employees from "../../pages/Employees.jsx";
import Documents from "../../pages/Documents";
import Letters from "../../pages/Letters";
import Onboarding from "../../pages/Onboarding.jsx";
import ExitManagement from "../../pages/ExitManagement";
import HrProfile from "./Profile.jsx";

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

function HrLayout({ user, message, logout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const current = navigation.find((item) => item.path === location.pathname);
  const title = location.pathname.includes("/profile") ? "My Profile" : (current?.label || "Overview");

  const notifications = [
    { id: 1, title: "HR Operations", message: "All recruitment and onboarding workflows active." },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sidebar: Same sidebar design as other roles */}
      <UnifiedSidebar
        roleTitle="HR Operations"
        tabs={navigation}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Area */}
      <div className="min-h-screen min-w-0 md:ml-[260px] flex flex-col">
        {/* Navbar: Same navbar design as other roles */}
        <UnifiedNavbar
          user={user || { name: "HR Team", email: "hr@peopleops.com", role: "hr" }}
          roleLabel="HR"
          onViewProfile={() => navigate("/hr/profile")}
          onLogout={logout}
          notifications={notifications}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />

        {/* Content */}
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
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
            <Route path="profile" element={<HrProfile user={user} />} />
            <Route path="*" element={<Navigate to="/hr/dashboard" replace />} />
          </Routes>
        </div>

        <footer className="hr-footer">
          <span>PeopleOps · HR Operations Platform</span>
          <span>Secure HR workspace</span>
        </footer>
      </div>
    </div>
  );
}

export default function HrEntry() {
  const { user, message, logout } = useRoleAuth("hr");

  return (
    <HrLayout user={user} message={message} logout={logout} />
  );
}

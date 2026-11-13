import { useState } from "react";
import { Outlet } from "react-router-dom";
import EmployeeSidebar from "../components/EmployeeSidebar.jsx";
import EmployeeNavbar from "../components/EmployeeNavbar.jsx";

export default function EmployeeLayout({ userMessage, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <EmployeeSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content */}
      <div className="min-h-screen min-w-0 md:ml-[260px] flex flex-col">
        {/* Top Navbar */}
        <EmployeeNavbar
          userMessage={userMessage}
          onLogout={onLogout}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />

        {/* Page Content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

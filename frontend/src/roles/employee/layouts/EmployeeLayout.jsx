import { Outlet } from "react-router-dom";

import EmployeeSidebar from "../components/EmployeeSidebar.jsx";
import EmployeeNavbar from "../components/EmployeeNavbar.jsx";

export default function EmployeeLayout({ userMessage, onLogout }) {
  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      {/* Sidebar */}
      <EmployeeSidebar onLogout={onLogout} />

      {/* Main Content */}
      <div className="min-h-screen md:ml-[264px]">
        {/* Top Navbar */}
        <EmployeeNavbar userMessage={userMessage} />

        {/* Page Content */}
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
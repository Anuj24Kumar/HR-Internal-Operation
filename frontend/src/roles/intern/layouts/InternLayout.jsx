import { useState } from "react";
import { Outlet } from "react-router-dom";
import InternSidebar from "../components/InternSidebar.jsx";
import InternNavbar from "../components/InternNavbar.jsx";

export default function InternLayout({ userMessage, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <InternSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="min-h-screen min-w-0 md:ml-[260px] flex flex-col">
        <InternNavbar
          userMessage={userMessage}
          onLogout={onLogout}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

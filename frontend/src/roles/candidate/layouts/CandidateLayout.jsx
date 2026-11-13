import { useState } from "react";
import { Outlet } from "react-router-dom";
import CandidateSidebar from "../components/CandidateSidebar.jsx";
import CandidateNavbar from "../components/CandidateNavbar.jsx";

export default function CandidateLayout({ userMessage, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <CandidateSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="min-h-screen min-w-0 md:ml-[260px] flex flex-col">
        <CandidateNavbar
          userMessage={userMessage}
          onLogout={onLogout}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

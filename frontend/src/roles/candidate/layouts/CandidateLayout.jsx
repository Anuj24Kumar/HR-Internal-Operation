
import { Outlet } from "react-router-dom";
import CandidateSidebar from "../components/CandidateSidebar.jsx";
import CandidateNavbar from "../components/CandidateNavbar.jsx";

export default function CandidateLayout({ userMessage, onLogout }) {
  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900">
      <CandidateSidebar onLogout={onLogout} />

      <div className="min-h-screen min-w-0 md:ml-[264px]">
        <CandidateNavbar userMessage={userMessage} />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


import { Outlet } from "react-router-dom";
import InternSidebar from "../components/InternSidebar.jsx";
import InternNavbar from "../components/InternNavbar.jsx";

export default function InternLayout({ userMessage, onLogout }) {
return ( <div className="min-h-screen bg-[#F5F7FB]"> <InternSidebar onLogout={onLogout} />


  <div className="min-h-screen md:ml-[264px]">
    <InternNavbar userMessage={userMessage} />

    <main className="min-h-[calc(100vh-76px)] p-4 sm:p-6 lg:p-8">
      <Outlet />
    </main>
  </div>
</div>


);
}

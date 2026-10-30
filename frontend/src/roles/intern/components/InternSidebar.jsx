import { NavLink } from "react-router-dom";

const navigationItems = [
{ label: "Overview", path: "/intern", icon: "▦", end: true },
{ label: "My Profile", path: "/intern/profile", icon: "♙" },
{ label: "My Onboarding", path: "/intern/onboarding", icon: "▤" },
{ label: "My Documents", path: "/intern/documents", icon: "▧" },
];

export default function InternSidebar({ onLogout }) {
return ( <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col bg-[#111C2E] text-white md:flex">
{/* Brand */} <div className="flex h-[88px] items-center gap-3 border-b border-white/10 px-6"> <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-2xl font-bold">
P </div>


    <div>
      <h1 className="text-xl font-bold tracking-tight">PeopleOps</h1>
      <p className="mt-0.5 text-xs text-slate-400">Intern Portal</p>
    </div>
  </div>

  {/* Workspace */}
  <div className="mx-4 mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-3">
    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
      Workspace
    </p>

    <p className="mt-2 text-sm font-semibold">My Internship</p>

    <p className="mt-1 text-xs text-slate-400">
      Manage your internship journey
    </p>
  </div>

  {/* Navigation */}
  <nav className="mt-7 flex-1 space-y-1 px-4">
    <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
      Menu
    </p>

    {navigationItems.map((item) => (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.end}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-3 text-sm font-medium transition-colors ${
            isActive
              ? "border-blue-500 bg-[#233652] text-white"
              : "border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-white"
          }`
        }
      >
        <span className="flex h-5 w-5 items-center justify-center text-lg">
          {item.icon}
        </span>

        {item.label}
      </NavLink>
    ))}
  </nav>

  {/* Footer */}
  <div className="border-t border-white/10 p-5">
    <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
      <span>PeopleOps © 2026</span>
      <span>v1.0</span>
    </div>

    <button
      type="button"
      onClick={onLogout}
      className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
    >
      ↪ &nbsp; Log out
    </button>
  </div>
</aside>


);
}

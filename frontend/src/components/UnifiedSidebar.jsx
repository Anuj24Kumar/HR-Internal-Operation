import { NavLink } from "react-router-dom";
import { X } from "lucide-react";

export default function UnifiedSidebar({
  roleTitle = "Portal",
  tabs = [],
  activeTab,
  onSelectTab,
  mobileOpen = false,
  onCloseMobile,
}) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#0f172a] text-slate-200 border-r border-slate-800 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        aria-label="Navigation Sidebar"
      >
        {/* Brand header */}
        <div className="flex h-[70px] shrink-0 items-center justify-between border-b border-slate-800/80 px-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 font-bold text-white shadow-sm text-lg select-none">
              P
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-white leading-snug">
                PeopleOps
              </h1>
              <p className="text-[11px] font-medium text-slate-400 truncate">
                {roleTitle}
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Respective tabs navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 select-none">
            Menu
          </p>

          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isRouterLink = Boolean(tab.path);
            const isStateActive = activeTab === tab.id;

            if (isRouterLink) {
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  end={tab.end}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                    }`
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {Icon && <Icon size={18} className="shrink-0" />}
                    <span className="truncate">{tab.label}</span>
                  </div>

                  {tab.badge !== undefined && tab.badge !== null && (
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        tab.badgeAlert
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </NavLink>
              );
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onSelectTab?.(tab.id);
                  onCloseMobile?.();
                }}
                className={`w-full flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors text-left ${
                  isStateActive
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {Icon && <Icon size={18} className="shrink-0" />}
                  <span className="truncate">{tab.label}</span>
                </div>

                {tab.badge !== undefined && tab.badge !== null && (
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      tab.badgeAlert
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: Intentionally empty as requested ("at bottom not any option") */}
      </aside>
    </>
  );
}

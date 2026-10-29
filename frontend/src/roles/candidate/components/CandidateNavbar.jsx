
import { useEffect, useState } from "react";
import { apiRequest } from "../../../api.js";

export default function CandidateNavbar({ userMessage }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("hr-auth-token");

    if (!token) return;

    let cancelled = false;

    apiRequest("/candidates/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((result) => {
        if (!cancelled) {
          setProfile(result.profile);
        }
      })
      .catch((error) => {
        console.error("Unable to load candidate profile:", error.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    profile?.name ||
    userMessage?.replace(/^Signed in as /, "") ||
    "Candidate";

  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "C";

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      {/* Search */}
      <div className="flex min-w-0 flex-1 items-center">
        <span className="mr-3 text-xl text-slate-400" aria-hidden="true">
          ⌕
        </span>

        <input
          type="search"
          aria-label="Search"
          placeholder="Search anything..."
          className="w-full max-w-md border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0"
        />
      </div>

      {/* User profile */}
      <div className="ml-4 flex shrink-0 items-center gap-3 sm:gap-4">
        <div className="hidden text-right sm:block">
          <p className="max-w-[180px] truncate text-sm font-semibold text-slate-800">
            {fullName}
          </p>

          <p className="mt-0.5 text-xs text-slate-500">Candidate</p>
        </div>

        {profile?.profileImage ? (
          <img
            src={profile.profileImage}
            alt={`${fullName}'s profile`}
            className="h-10 w-10 rounded-full border border-slate-200 object-cover"
          />
        ) : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700"
            aria-label={`${fullName} profile initials`}
          >
            {initials}
          </div>
        )}
      </div>
    </header>
  );
}


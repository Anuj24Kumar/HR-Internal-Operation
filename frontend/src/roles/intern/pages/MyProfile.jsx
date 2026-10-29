import { useCallback, useEffect, useState } from "react";
import { RefreshCw, UserRound } from "lucide-react";

import { getMyInternProfile } from "../services/internService.js";
import EmptyState from "../components/EmptyState.jsx";

function formatDate(date) {
  if (!date) return "Not provided";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Not provided";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getFullName(user) {
  return [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || user?.name || "Name not provided";
}

function ProfileField({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {value || "Not provided"}
      </p>
    </div>
  );
}

export default function MyProfile() {
  const [intern, setIntern] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getMyInternProfile();

      if (!result.intern) {
        throw new Error("Intern profile was not returned by the server.");
      }

      setIntern(result.intern);
    } catch (err) {
      setError(err.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading profile...</p>;
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-6">
        <p className="font-semibold text-red-700">
          Unable to load profile
        </p>

        <p className="mt-2 text-sm text-slate-600">{error}</p>

        <button
          type="button"
          onClick={loadProfile}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </section>
    );
  }

  if (!intern) {
    return (
      <EmptyState
        title="Profile unavailable"
        description="No intern profile was returned by the server."
      />
    );
  }

  const user = intern.user || {};
  const mentor = intern.mentor;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          My Profile
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Your personal and internship information.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 pb-6">
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt="Profile"
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <UserRound size={28} />
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {getFullName(user)}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {user.email || "Email not provided"}
            </p>

            <span className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
              {intern.status || "Status not provided"}
            </span>
          </div>
        </div>

        <h3 className="mb-4 mt-6 font-semibold text-slate-900">
          Personal Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileField label="First Name" value={user.firstName} />
          <ProfileField label="Last Name" value={user.lastName} />
          <ProfileField label="Email" value={user.email} />
          <ProfileField label="Phone" value={user.phone} />
        </div>

        <h3 className="mb-4 mt-8 font-semibold text-slate-900">
          Internship Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileField label="Department" value={intern.department} />
          <ProfileField label="Designation" value={intern.designation} />
          <ProfileField label="Location" value={intern.location} />
          <ProfileField label="Joining Date" value={formatDate(intern.joiningDate)} />
          <ProfileField label="Stipend" value={intern.stipend} />
          <ProfileField label="Status" value={intern.status} />
          <ProfileField
            label="Mentor"
            value={mentor ? getFullName(mentor) : "Not assigned"}
          />
          <ProfileField label="Mentor Email" value={mentor?.email} />
        </div>
      </section>
    </div>
  );
}
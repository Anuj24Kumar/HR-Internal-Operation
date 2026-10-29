
import { useEffect, useState } from "react";
import { getMyProfile } from "../services/candidateService.js";
import EmptyState from "../components/EmptyState.jsx";

function getInitials(name) {
  return (
    String(name || "Candidate")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "C"
  );
}

function InfoField({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-900">
        {value === undefined || value === null || value === ""
          ? "Not available"
          : String(value)}
      </p>
    </div>
  );
}

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const result = await getMyProfile();

        if (!cancelled) {
          setProfile(result.profile ?? result.user ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load your profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-8 w-52 rounded bg-slate-200" />
        <div className="h-40 rounded-xl bg-white" />
        <div className="h-64 rounded-xl bg-white" />
      </div>
    );
  }

  const name =
    profile?.name ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "Candidate";

  const personalInfo = profile?.personalInfo || {};

  if (!profile && !error) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">
            My Profile
          </h1>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white">
          <EmptyState
            title="Profile information unavailable"
            description="No profile information was returned for your account."
          />
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-7">
      <header>
        <p className="text-sm text-slate-500">
          Workspace <span className="mx-2">›</span> My Profile
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          My Profile
        </h1>

        <p className="mt-2 text-slate-500">
          View the personal information associated with your candidate account.
        </p>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {profile && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={name}
                  className="h-20 w-20 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-50 text-2xl font-bold text-blue-700">
                  {getInitials(name)}
                </div>
              )}

              <div className="min-w-0">
                <h2 className="break-words text-2xl font-bold text-slate-900">
                  {name}
                </h2>

                <p className="mt-1 break-words text-sm text-slate-500">
                  {profile.email || "Email not available"}
                </p>

                <span className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Candidate
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              Personal Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your available account and personal details.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoField
                label="Full Name"
                value={name}
              />

              <InfoField
                label="Email Address"
                value={profile.email}
              />

              <InfoField
                label="Phone Number"
                value={
                  profile.phone ||
                  profile.phoneNumber ||
                  personalInfo.phone ||
                  personalInfo.phoneNumber
                }
              />

              <InfoField
                label="Date of Birth"
                value={
                  profile.dateOfBirth ||
                  personalInfo.dateOfBirth ||
                  personalInfo.dob
                }
              />

              <InfoField
                label="Location"
                value={
                  profile.location ||
                  personalInfo.location ||
                  personalInfo.address
                }
              />

              <InfoField
                label="Account Role"
                value={profile.role || "candidate"}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}


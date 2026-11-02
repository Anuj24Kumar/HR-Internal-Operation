import { useEffect, useState } from "react";
import { apiRequest } from "../api.js";

function getInitials(name, fallback = "U") {
  return (
    String(name || fallback)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || fallback.slice(0, 2).toUpperCase()
  );
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CommonProfilePage({
  role = "candidate",
  roleLabel,
  initialUser,
}) {
  const [loading, setLoading] = useState(!initialUser);
  const [error, setError] = useState("");
  const [profileData, setProfileData] = useState(initialUser || null);

  const displayRoleLabel =
    roleLabel ||
    (role ? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "User");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const token = localStorage.getItem("hr-auth-token");
      if (!token) return;

      try {
        setLoading(true);
        setError("");

        let resData = null;

        if (role === "candidate") {
          const res = await apiRequest("/candidates/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          resData = res.profile || res.candidate || res.user;
        } else if (role === "employee") {
          const res = await apiRequest("/employee/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          resData = res.employee || res.user;
        } else if (role === "intern") {
          const res = await apiRequest("/intern/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          resData = res.intern || res.user;
        } else {
          const res = await apiRequest("/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          resData = res.user;
        }

        if (!cancelled && resData) {
          setProfileData(resData);
        }
      } catch (err) {
        console.warn("Profile fetch error:", err.message);
        if (!cancelled && !profileData) {
          setError(err.message || "Unable to load profile data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [role]);

  const userObj = profileData?.user || profileData || initialUser || {};
  const personalInfo = profileData?.personalInfo || {};

  const fullName =
    [userObj.firstName, userObj.lastName].filter(Boolean).join(" ") ||
    userObj.name ||
    personalInfo.fullName ||
    displayRoleLabel;

  const email = userObj.email || profileData?.email || "Email not available";

  const phone =
    profileData?.phone ||
    profileData?.phoneNumber ||
    userObj.phone ||
    userObj.phoneNumber ||
    personalInfo.phone ||
    personalInfo.phoneNumber ||
    "Not available";

  const rawDob =
    profileData?.dateOfBirth ||
    userObj.dateOfBirth ||
    personalInfo.dateOfBirth ||
    personalInfo.dob;
  const dateOfBirth = rawDob ? formatDate(rawDob) : "Not available";

  const location =
    profileData?.location ||
    userObj.location ||
    personalInfo.location ||
    personalInfo.address ||
    (profileData?.department ? profileData.department : "Not available");

  const accountRole = userObj.role || role || "candidate";

  const profileImage = userObj.profileImage || profileData?.profileImage;

  if (loading && !profileData) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-6 animate-pulse">
        <div className="h-9 w-48 rounded-lg bg-slate-200" />
        <div className="h-4 w-96 rounded bg-slate-200" />
        <div className="h-40 rounded-2xl bg-white border border-slate-200" />
        <div className="h-64 rounded-2xl bg-white border border-slate-200" />
      </div>
    );
  }

  const fields = [
    { label: "FULL NAME", value: fullName },
    { label: "EMAIL ADDRESS", value: email },
    { label: "PHONE NUMBER", value: phone },
    { label: "DATE OF BIRTH", value: dateOfBirth },
    { label: "LOCATION", value: location },
    { label: "ACCOUNT ROLE", value: accountRole },
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          My Profile
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          View the personal information associated with your {displayRoleLabel.toLowerCase()} account.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Top Hero Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {profileImage ? (
            <img
              src={profileImage}
              alt={fullName}
              className="h-20 w-20 rounded-full border border-slate-200 object-cover shrink-0"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-2xl font-bold text-[#2563EB]">
              {getInitials(fullName, displayRoleLabel)}
            </div>
          )}

          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-slate-900 leading-snug">
              {fullName}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {email}
            </p>
            <span className="mt-3 inline-block rounded-full bg-[#EFF6FF] px-3.5 py-1 text-xs font-semibold text-[#2563EB] capitalize">
              {displayRoleLabel}
            </span>
          </div>
        </div>
      </section>

      {/* Personal Information Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">
          Personal Information
        </h2>
        <p className="mt-1 text-sm text-slate-500 mb-6">
          Your available account and personal details.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fields.map((field, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4.5"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {field.label}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-900 break-words">
                {field.value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

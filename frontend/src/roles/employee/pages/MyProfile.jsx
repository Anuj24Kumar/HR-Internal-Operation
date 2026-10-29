
import { useEffect, useState } from "react";
import { getMyEmployeeProfile } from "../services/employeeService.js";

function InfoItem({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-slate-900">
        {value || "Not available"}
      </p>
    </div>
  );
}

export default function MyProfile() {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError("");

        const response = await getMyEmployeeProfile();
        setEmployee(response.employee);
      } catch (err) {
        setError(err.message || "Unable to load employee profile.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const user = employee?.user || {};
  const personalInfo = employee?.personalInfo || {};

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    personalInfo.fullName ||
    "Not available";

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          <p className="mt-2 text-slate-500">
            View your personal and employment information.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          <p className="mt-2 text-slate-500">
            View your personal and employment information.
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-700">
            Unable to load profile
          </h2>
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          <p className="mt-2 text-slate-500">
            View your personal and employment information.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Employee Profile Not Found
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            No employee profile is linked to your account yet.
          </p>
        </div>
      </div>
    );
  }

  const managerName =
    [employee.manager?.firstName, employee.manager?.lastName]
      .filter(Boolean)
      .join(" ") || "Not available";

  const joiningDate = employee.joiningDate
    ? new Date(employee.joiningDate).toLocaleDateString()
    : "Not available";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-2 text-slate-500">
          View your personal and employment information.
        </p>
      </div>

      {/* Employee summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
            {fullName
              .split(" ")
              .filter(Boolean)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {employee.designation || "Designation not available"}
            </p>
            <span className="mt-2 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium capitalize text-green-700">
              {employee.status || "Status not available"}
            </span>
          </div>
        </div>
      </div>

      {/* Personal information */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-slate-900">
          Personal Information
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="Full Name" value={fullName} />
          <InfoItem label="Email" value={user.email} />
          <InfoItem label="Phone" value={user.phone || personalInfo.phone} />
        </div>
      </div>

      {/* Employment information */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-slate-900">
          Employment Information
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            label="Employee ID"
            value={employee.employeeCode || employee.empId}
          />

          <InfoItem label="Department" value={employee.department} />

          <InfoItem label="Designation" value={employee.designation} />

          <InfoItem
            label="Employment Type"
            value={employee.employmentType?.replace("_", " ")}
          />

          <InfoItem label="Joining Date" value={joiningDate} />

          <InfoItem label="Manager" value={managerName} />

          <InfoItem label="Location" value={employee.location} />

          <InfoItem label="Employment Status" value={employee.status} />
        </div>
      </div>
    </div>
  );
}


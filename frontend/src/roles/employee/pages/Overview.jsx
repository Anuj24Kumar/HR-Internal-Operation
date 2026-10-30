
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getMyEmployeeProfile,
  getMyEmployeeDocuments,
  getMySalaryBreakdown,
  getMyEmploymentHistory,
} from "../services/employeeService.js";

function StatCard({ title, value, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="text-sm text-slate-500">{title}</p>

      <h2 className="mt-4 text-xl font-bold capitalize text-slate-900">
        {value}
      </h2>

      <p className="mt-2 text-sm text-blue-600">{description}</p>
    </button>
  );
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default function Overview() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [salary, setSalary] = useState(null);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      setErrors([]);

      const results = await Promise.allSettled([
        getMyEmployeeProfile(),
        getMyEmployeeDocuments(),
        getMySalaryBreakdown(),
        getMyEmploymentHistory(),
      ]);

      const newErrors = [];

      if (results[0].status === "fulfilled") {
        setProfile(results[0].value.employee || null);
      } else {
        newErrors.push("Employee profile could not be loaded.");
      }

      if (results[1].status === "fulfilled") {
        setDocuments(results[1].value.documents || []);
      } else {
        newErrors.push("Employee documents could not be loaded.");
      }

      if (results[2].status === "fulfilled") {
        setSalary(results[2].value.salary || null);
      } else {
        newErrors.push("Salary details could not be loaded.");
      }

      if (results[3].status === "fulfilled") {
        setHistory(results[3].value.history || []);
      } else {
        newErrors.push("Employment history could not be loaded.");
      }

      setErrors(newErrors);
      setLoading(false);
    }

    fetchDashboardData();
  }, []);

  const employmentStatus = profile?.status || "Not available";

  const totalDocuments = documents.length;

  const totalHistory = history.length;

  const totalCTC = salary?.totalCTC;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <p className="text-sm font-medium text-blue-600">
          EMPLOYEE WORKSPACE
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Employee Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Welcome to your employee portal. Manage your profile, documents,
          salary details and employment information.
        </p>
      </div>

      {/* API error messages */}
      {errors.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-800">
            Some dashboard information could not be loaded.
          </h2>

          <ul className="mt-2 list-inside list-disc text-sm text-amber-700">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Dashboard cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Employment Status"
          value={loading ? "Loading..." : employmentStatus}
          description="View your profile"
          onClick={() => navigate("/employee/profile")}
        />

        <StatCard
          title="My Documents"
          value={loading ? "Loading..." : totalDocuments}
          description="View uploaded documents"
          onClick={() => navigate("/employee/documents")}
        />

        <StatCard
          title="Salary Details"
          value={loading ? "Loading..." : formatCurrency(totalCTC)}
          description="View salary breakdown"
          onClick={() => navigate("/employee/salary")}
        />

        <StatCard
          title="Employment History"
          value={loading ? "Loading..." : totalHistory}
          description="View employment history"
          onClick={() => navigate("/employee/history")}
        />
      </div>

      {/* Quick overview */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Quick Overview
        </h2>

        {loading ? (
          <p className="mt-3 text-sm text-slate-500">
            Loading dashboard information...
          </p>
        ) : profile ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Employee Name</p>
              <p className="mt-1 font-semibold text-slate-900">
                {[profile.user?.firstName, profile.user?.lastName]
                  .filter(Boolean)
                  .join(" ") ||
                  profile.personalInfo?.fullName ||
                  "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Employee ID</p>
              <p className="mt-1 font-semibold text-slate-900">
                {profile.employeeCode || profile.empId || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Department</p>
              <p className="mt-1 font-semibold text-slate-900">
                {profile.department || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Designation</p>
              <p className="mt-1 font-semibold text-slate-900">
                {profile.designation || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Location</p>
              <p className="mt-1 font-semibold text-slate-900">
                {profile.location || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Employment Type</p>
              <p className="mt-1 font-semibold capitalize text-slate-900">
                {profile.employmentType?.replaceAll("_", " ") ||
                  "Not available"}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            No employee profile is linked to your account.
          </p>
        )}
      </div>
    </div>
  );
}

